import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { reputationLevels } from '@pillage-first/game-assets/reputation';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../../../utils/create-event.ts';
import { FACTION_PROFILES } from '../faction-profiles';
import {
  adjustForSpeed,
  getMapSize,
  mapDistance,
  scaleTroops,
} from '../helpers';
import type { FactionKey } from '../npc-brain-types';
import { isPassiveFaction, NPC_BRAIN_CONSTANTS } from '../npc-brain-types';
import { getNpcTroopMultiplier } from '../world-threat-level';
import { materializeNpcTroops } from './troop-regeneration';

/**
 * Proactive NPC Attack Subsystem — Reputation-Gated Escalating Wave System
 *
 * NPCs proactively attack the player on a scheduled basis, but:
 * 1. Allied factions (high reputation) are skipped entirely
 * 2. Each faction has its own cooldown, not per-village
 * 3. Wave stage escalates over time (1 village, then 2, then 3...)
 * 4. Global budget limits total in-flight attacks
 */

export type Difficulty = 'skirmish' | 'assault' | 'siege';
export type GameMode = 'standard' | 'blitz';

/**
 * Base interval by difficulty (in real ms, NOT divided by speed)
 */
const BASE_INTERVAL_MS: Record<Difficulty, number> = {
  skirmish: 60 * 60 * 1000,
  assault: 45 * 60 * 1000,
  siege: 20 * 60 * 1000,
};

/**
 * Max wave cap (max villages per wave) by map size
 */
const MAX_WAVE_CAP: Record<number, number> = {
  25: 2,
  50: 3,
  75: 4,
  100: 5,
};

/**
 * Global attack budget by difficulty (standard mode)
 */
const BASE_BUDGET: Record<Difficulty, number> = {
  skirmish: 3,
  assault: 6,
  siege: 12,
};

/**
 * Global attack budget by difficulty (blitz mode)
 */
const BLITZ_BUDGET: Record<Difficulty, number> = {
  skirmish: 2,
  assault: 4,
  siege: 8,
};

/**
 * Ally threshold: factions at or above this reputation level are skipped.
 */
const ALLY_THRESHOLD = reputationLevels.get('friendly') ?? 45_000;

/**
 * Get the server's difficulty setting.
 */
export const getDifficulty = (db: DbFacade): Difficulty => {
  try {
    const result = db.selectValue({
      sql: 'SELECT difficulty FROM servers LIMIT 1;',
      schema: z.string(),
    });
    if (result && ['skirmish', 'assault', 'siege'].includes(result)) {
      return result as Difficulty;
    }
  } catch (_e) {
    // Column may not exist yet
  }
  return 'assault';
};

/**
 * Get the server's game mode.
 */
export const getGameMode = (db: DbFacade): GameMode => {
  try {
    const result = db.selectValue({
      sql: 'SELECT game_mode FROM servers LIMIT 1;',
      schema: z.string(),
    });
    if (result && ['standard', 'blitz'].includes(result)) {
      return result as GameMode;
    }
  } catch (_e) {
    // Column may not exist yet
  }
  return 'standard';
};

/**
 * Check if Blitz protection is still active.
 */
export const isBlitzProtectionActive = (db: DbFacade): boolean => {
  try {
    const result = db.selectObject({
      sql: 'SELECT game_mode, blitz_protection_ends_at FROM servers LIMIT 1;',
      schema: z.object({
        game_mode: z.string(),
        blitz_protection_ends_at: z.number().nullable(),
      }),
    });
    if (
      result?.game_mode === 'blitz' &&
      result.blitz_protection_ends_at != null
    ) {
      return Date.now() < result.blitz_protection_ends_at;
    }
  } catch (_e) {
    // Columns may not exist yet
  }
  return false;
};

/**
 * Check if the server is still in the grace period.
 */
export const isInGracePeriod = (db: DbFacade, speed: number): boolean => {
  const gameMode = getGameMode(db);

  if (gameMode === 'blitz') {
    return isBlitzProtectionActive(db);
  }

  try {
    const result = db.selectObject({
      sql: 'SELECT created_at FROM servers LIMIT 1;',
      schema: z.object({ created_at: z.number() }),
    });
    if (!result) {
      return true;
    }

    const now = Date.now();
    const serverAge = now - result.created_at;
    const gracePeriodMs = adjustForSpeed(5 * 3_600_000, speed);

    return serverAge < gracePeriodMs;
  } catch (_e) {
    return true;
  }
};

/**
 * Get server creation timestamp.
 */
const getServerCreatedAt = (db: DbFacade): number => {
  try {
    const result = db.selectValue({
      sql: 'SELECT created_at FROM servers LIMIT 1;',
      schema: z.number(),
    });
    return result ?? 0;
  } catch (_e) {
    return 0;
  }
};

/**
 * Get all player village IDs and coordinates, sorted by distance from a point.
 */
const getPlayerVillages = (
  db: DbFacade,
): {
  villageId: number;
  tileId: number;
  x: number;
  y: number;
  isWwVillage: number;
  wwLevel: number;
}[] => {
  return db.selectObjects({
    sql: `
      SELECT
        v.id AS villageId,
        v.tile_id AS tileId,
        t.x,
        t.y,
        v.is_world_wonder_village AS isWwVillage,
        v.world_wonder_level AS wwLevel
      FROM villages v
      JOIN tiles t ON t.id = v.tile_id
      WHERE v.player_id = $playerId;
    `,
    bind: { $playerId: PLAYER_ID },
    schema: z.any(),
  }) as {
    villageId: number;
    tileId: number;
    x: number;
    y: number;
    isWwVillage: number;
    wwLevel: number;
  }[];
};

/**
 * Process proactive attacks for all NPC villages.
 *
 * Uses a reputation-gated, faction-turn, escalating wave system:
 * Layer 1 — Reputation Gate: Skip allied factions
 * Layer 2 — Faction Cooldown: Check faction-level cooldown
 * Layer 3 — Wave Stage: How many villages attack this wave
 * Layer 4 — Global Budget: Limit total in-flight attacks
 */
export const processProactiveAttacks = (
  db: DbFacade,
  currentTimeMs: number,
  speed: number,
  worldThreatLevel: number,
): number => {
  // Layer 0: Grace period check
  if (isInGracePeriod(db, speed)) {
    return 0;
  }

  const difficulty = getDifficulty(db);
  const gameMode = getGameMode(db);
  const mapSize = getMapSize(db);
  const serverCreatedAt = getServerCreatedAt(db);
  const npcTroopMultiplier = getNpcTroopMultiplier(worldThreatLevel);

  // Layer 1: Reputation Gate — Fetch faction reputations
  const factionReputations = db.selectObjects({
    sql: `
      SELECT
        fi.faction AS factionKey,
        fr.reputation AS reputationScore
      FROM faction_ids fi
      JOIN faction_reputation fr ON fr.target_faction_id = fi.id
      JOIN players p ON p.faction_id = fr.source_faction_id
      WHERE p.id = 1
        AND fi.faction != 'player';
    `,
    schema: z.any(),
  }) as { factionKey: string; reputationScore: number }[];

  const reputationMap = new Map<string, number>();
  for (const row of factionReputations) {
    reputationMap.set(row.factionKey, row.reputationScore);
  }

  // Load faction state
  const factionStates = db.selectObjects({
    sql: 'SELECT * FROM npc_faction_state;',
    schema: z.any(),
  }) as {
    faction_key: string;
    last_faction_attack_ms: number;
    current_wave_stage: number;
    wave_locked_until_ms: number;
  }[];

  const factionStateMap = new Map<
    string,
    {
      lastFactionAttackMs: number;
      currentWaveStage: number;
      waveLockedUntilMs: number;
    }
  >();
  for (const fs of factionStates) {
    factionStateMap.set(fs.faction_key, {
      lastFactionAttackMs: fs.last_faction_attack_ms,
      currentWaveStage: fs.current_wave_stage,
      waveLockedUntilMs: fs.wave_locked_until_ms,
    });
  }

  // Load all NPC villages grouped by faction
  const npcVillages = db.selectObjects({
    sql: `
      SELECT
        nvs.village_id AS villageId,
        nvs.faction_key AS factionKey,
        nvs.last_proactive_attack_ms AS lastProactiveAttackMs,
        nvs.proactive_attack_offset_ms AS offsetMs,
        v.tile_id AS tileId,
        t.x,
        t.y,
        COALESCE(vt.tribe, pt.tribe) AS tribe
      FROM npc_village_state nvs
      JOIN villages v ON v.id = nvs.village_id
      JOIN tiles t ON t.id = v.tile_id
      LEFT JOIN tribe_ids vt ON vt.id = v.tribe_id
      LEFT JOIN players p ON p.id = v.player_id
      LEFT JOIN tribe_ids pt ON pt.id = p.tribe_id;
    `,
    schema: z.any(),
  }) as unknown as {
    villageId: number;
    factionKey: string;
    lastProactiveAttackMs: number;
    offsetMs: number;
    tileId: number;
    x: number;
    y: number;
    tribe: string;
  }[];

  if (npcVillages.length === 0) {
    return 0;
  }

  // Group villages by faction
  const villagesByFaction = new Map<string, typeof npcVillages>();
  for (const village of npcVillages) {
    const existing = villagesByFaction.get(village.factionKey) ?? [];
    existing.push(village);
    villagesByFaction.set(village.factionKey, existing);
  }

  // Get player villages
  const playerVillages = getPlayerVillages(db);
  if (playerVillages.length === 0) {
    return 0;
  }

  // Layer 4: Global budget check
  const budgetMap = gameMode === 'blitz' ? BLITZ_BUDGET : BASE_BUDGET;
  const mapScaleFactor = mapSize <= 50 ? 0.5 : 1.0;
  const budget = Math.max(
    1,
    Math.floor(budgetMap[difficulty] * mapScaleFactor),
  );

  // Count in-flight NPC attacks
  const inFlightResult = db.selectValue({
    sql: `
      SELECT COUNT(*) AS inFlight
      FROM events
      WHERE type = 'troopMovementAttack'
        AND starts_at + duration > $now;
    `,
    bind: { $now: currentTimeMs },
    schema: z.number(),
  });
  const inFlight = inFlightResult ?? 0;

  if (inFlight >= budget) {
    return 0;
  }

  // Process each faction
  let attacksLaunched = 0;
  const factionStateUpdates: {
    factionKey: string;
    lastFactionAttackMs: number;
    currentWaveStage: number;
    waveLockedUntilMs: number;
  }[] = [];
  const villageTimestampUpdates: { villageId: number; timestamp: number }[] =
    [];

  const waveCap = MAX_WAVE_CAP[mapSize] ?? 5;

  for (const [factionKey, factionVillages] of villagesByFaction) {
    // Layer 0: Passive factions (Natars) never attack proactively
    if (isPassiveFaction(factionKey)) {
      continue;
    }

    // Layer 1: Reputation gate — skip allied factions
    const reputation = reputationMap.get(factionKey) ?? 0;
    if (reputation >= ALLY_THRESHOLD) {
      continue;
    }

    // Layer 2: Faction cooldown check
    const profile = FACTION_PROFILES[factionKey as FactionKey];
    if (!profile) {
      continue;
    }

    const factionIntervalMs = adjustForSpeed(
      BASE_INTERVAL_MS[difficulty] * profile.proactiveCooldownMultiplier,
      speed,
    );

    const factionState = factionStateMap.get(factionKey) ?? {
      lastFactionAttackMs: 0,
      currentWaveStage: 0,
      waveLockedUntilMs: 0,
    };

    // Cold-start: use serverCreatedAt as baseline
    const effectiveLastAttackMs = Math.max(
      factionState.lastFactionAttackMs,
      serverCreatedAt,
    );

    if (currentTimeMs - effectiveLastAttackMs < factionIntervalMs) {
      continue;
    }

    // Layer 3: Wave stage — how many villages attack
    let currentWaveStage = factionState.currentWaveStage;
    let waveLockedUntilMs = factionState.waveLockedUntilMs;

    // Advance wave stage if lock has expired
    if (currentTimeMs >= waveLockedUntilMs) {
      currentWaveStage = Math.min(currentWaveStage + 1, waveCap - 1);
      // Lock wave stage for 2 full cooldown cycles (or 3 real minutes on Blitz)
      if (gameMode === 'blitz') {
        waveLockedUntilMs = currentTimeMs + 3 * 60 * 1000;
      } else {
        waveLockedUntilMs = currentTimeMs + factionIntervalMs * 2;
      }
    }

    const villagesThisWave = Math.min(currentWaveStage + 1, waveCap);

    // Sort villages by distance to nearest player village and pick closest
    const sortedVillages = [...factionVillages].sort((a, b) => {
      const distA = Math.min(
        ...playerVillages.map((pv) =>
          mapDistance({ x: a.x, y: a.y }, { x: pv.x, y: pv.y }),
        ),
      );
      const distB = Math.min(
        ...playerVillages.map((pv) =>
          mapDistance({ x: b.x, y: b.y }, { x: pv.x, y: pv.y }),
        ),
      );
      return distA - distB;
    });

    const attackingVillages = sortedVillages.slice(0, villagesThisWave);

    // Send attacks from selected villages
    for (const village of attackingVillages) {
      // Check budget again
      if (attacksLaunched + inFlight >= budget) {
        break;
      }

      // Materialize troops
      materializeNpcTroops(
        db,
        village.villageId,
        village.tileId,
        village.factionKey as FactionKey,
        village.tribe,
        mapSize,
        village.x,
        village.y,
        speed,
      );

      // Get home troops
      const homeTroops = db.selectObjects({
        sql: `
          SELECT u.unit AS unitId, t.amount
          FROM troops t
          JOIN unit_ids u ON u.id = t.unit_id
          WHERE t.tile_id = $tileId
            AND t.source_tile_id = $tileId
            AND t.amount > 0;
        `,
        bind: { $tileId: village.tileId },
        schema: z.any(),
      }) as { unitId: string; amount: number }[];

      const totalUnits = homeTroops.reduce((sum, t) => sum + t.amount, 0);

      if (totalUnits < NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION) {
        continue;
      }

      // Cap at 70% of available troops
      const troopMap: Record<string, number> = {};
      for (const troop of homeTroops) {
        troopMap[troop.unitId] = troop.amount;
      }
      const attackTroops = scaleTroops(troopMap, 0.7);

      if (Object.keys(attackTroops).length === 0) {
        continue;
      }

      // Apply world threat multiplier
      const scaledTroops: {
        unitId: UnitId;
        amount: number;
        tileId: number;
        source: number;
      }[] = [];
      for (const [unitId, amount] of Object.entries(attackTroops)) {
        const scaledAmount = Math.max(
          1,
          Math.floor(amount * npcTroopMultiplier),
        );
        // Cap at actual available amount — createEvents validates availability
        const cappedAmount = Math.min(scaledAmount, troopMap[unitId] ?? 0);
        if (cappedAmount <= 0) {
          continue;
        }
        scaledTroops.push({
          unitId: unitId as UnitId,
          amount: cappedAmount,
          tileId: village.tileId,
          source: village.tileId,
        });
      }

      if (scaledTroops.length === 0) {
        continue;
      }

      // Find nearest player village (enemy factions prefer WW villages at L>=5: -30% distance)
      const isEnemy = reputation < ALLY_THRESHOLD;
      let nearestPlayerVillage = playerVillages[0];
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const pv of playerVillages) {
        let dist = mapDistance(
          { x: village.x, y: village.y },
          { x: pv.x, y: pv.y },
        );
        // Enemy factions preferentially target WW villages at level >= 5
        if (isEnemy && pv.isWwVillage && pv.wwLevel >= 5) {
          dist *= 0.7;
        }
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestPlayerVillage = pv;
        }
      }

      // Create the attack event — startsAt = departure time (now),
      // createEvents adds duration (travel time) to compute resolvesAt.
      try {
        createEvents<'troopMovementAttack'>(db, {
          type: 'troopMovementAttack',
          villageId: village.villageId,
          targetId: nearestPlayerVillage.villageId,
          troops: scaledTroops as any,
          startsAt: currentTimeMs,
        });
        attacksLaunched++;
      } catch (_e) {
        // Event creation failed
      }

      villageTimestampUpdates.push({
        villageId: village.villageId,
        timestamp: currentTimeMs,
      });
    }

    // Record faction state update
    factionStateUpdates.push({
      factionKey,
      lastFactionAttackMs: currentTimeMs,
      currentWaveStage,
      waveLockedUntilMs,
    });
  }

  // Batch update faction state
  if (factionStateUpdates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};
    for (let i = 0; i < factionStateUpdates.length; i++) {
      const u = factionStateUpdates[i];
      caseClauses.push(`WHEN faction_key = $fk${i} THEN $la${i}`);
      bind[`$fk${i}`] = u.factionKey as any;
      bind[`$la${i}`] = u.lastFactionAttackMs;
    }

    const waveCaseClauses: string[] = [];
    const waveBind: Record<string, number> = {};
    for (let i = 0; i < factionStateUpdates.length; i++) {
      const u = factionStateUpdates[i];
      waveCaseClauses.push(`WHEN faction_key = $wfk${i} THEN $ws${i}`);
      waveBind[`$wfk${i}`] = u.factionKey as any;
      waveBind[`$ws${i}`] = u.currentWaveStage;
    }

    const lockCaseClauses: string[] = [];
    const lockBind: Record<string, number> = {};
    for (let i = 0; i < factionStateUpdates.length; i++) {
      const u = factionStateUpdates[i];
      lockCaseClauses.push(`WHEN faction_key = $lfk${i} THEN $wl${i}`);
      lockBind[`$lfk${i}`] = u.factionKey as any;
      lockBind[`$wl${i}`] = u.waveLockedUntilMs;
    }

    const placeholders = factionStateUpdates.map((_, i) => `$pk${i}`).join(',');
    const placeholderBinds: Record<string, string> = {};
    factionStateUpdates.forEach((u, i) => {
      placeholderBinds[`$pk${i}`] = u.factionKey;
    });

    db.exec({
      sql: `
        UPDATE npc_faction_state
        SET
          last_faction_attack_ms = CASE ${caseClauses.join('\n')} ELSE last_faction_attack_ms END,
          current_wave_stage = CASE ${waveCaseClauses.join('\n')} ELSE current_wave_stage END,
          wave_locked_until_ms = CASE ${lockCaseClauses.join('\n')} ELSE wave_locked_until_ms END
        WHERE faction_key IN (${placeholders});
      `,
      bind: { ...bind, ...waveBind, ...lockBind, ...placeholderBinds },
    });
  }

  // Batch update village timestamps
  if (villageTimestampUpdates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};
    for (let i = 0; i < villageTimestampUpdates.length; i++) {
      const u = villageTimestampUpdates[i];
      caseClauses.push(`WHEN village_id = $v${i} THEN $t${i}`);
      bind[`$v${i}`] = u.villageId;
      bind[`$t${i}`] = u.timestamp;
    }
    const placeholders = villageTimestampUpdates
      .map((_, i) => `$p${i}`)
      .join(',');
    const placeholderBinds: Record<string, number> = {};
    villageTimestampUpdates.forEach((u, i) => {
      placeholderBinds[`$p${i}`] = u.villageId;
    });

    db.exec({
      sql: `
        UPDATE npc_village_state
        SET last_proactive_attack_ms = CASE
          ${caseClauses.join('\n')}
          ELSE last_proactive_attack_ms
        END
        WHERE village_id IN (${placeholders});
      `,
      bind: { ...bind, ...placeholderBinds },
    });
  }

  return attacksLaunched;
};
