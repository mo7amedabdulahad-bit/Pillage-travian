import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../../../utils/create-event.ts';
import {
  adjustForSpeed,
  getMapSize,
  getPlayerVillageCoords,
  mapDistance,
  scaleTroops,
} from '../helpers';
import type { FactionKey } from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';
import { getNpcTroopMultiplier } from '../world-threat-level';
import { materializeNpcTroops } from './troop-regeneration';

/**
 * Proactive NPC Attack Subsystem
 *
 * NPCs proactively attack the player on a scheduled basis.
 * This is separate from retaliation — NPCs attack even if not provoked.
 */

export type Difficulty = 'skirmish' | 'assault' | 'siege';
export type GameMode = 'standard' | 'blitz';

/**
 * Difficulty settings for proactive attacks.
 * Each defines the base interval (in-game minutes) and chance to actually send troops.
 */
const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  { intervalMinutes: number; attackChance: number }
> = {
  skirmish: { intervalMinutes: 60, attackChance: 0.1 },
  assault: { intervalMinutes: 45, attackChance: 0.25 },
  siege: { intervalMinutes: 20, attackChance: 0.65 },
};

/**
 * Get the server's difficulty setting.
 * Defaults to 'assault' if not set.
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
 * Defaults to 'standard' if not set.
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
 * Returns true if the server is in Blitz mode and protection hasn't ended.
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
 * Calculate the proactive attack interval in real milliseconds for a given difficulty.
 * The interval is divided by server speed to account for game speed.
 */
export const getProactiveAttackIntervalMs = (
  difficulty: Difficulty,
  speed: number,
): number => {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  return adjustForSpeed(settings.intervalMinutes * 60_000, speed);
};

/**
 * Get the attack chance for a difficulty level.
 */
export const getAttackChance = (difficulty: Difficulty): number => {
  return DIFFICULTY_SETTINGS[difficulty].attackChance;
};

/**
 * Check if the server is still in the grace period (no proactive attacks).
 * Standard servers: 5 in-game hours
 * Blitz servers: No grace period after protection ends
 * Returns true if grace period is still active.
 */
export const isInGracePeriod = (db: DbFacade, speed: number): boolean => {
  const gameMode = getGameMode(db);

  // Blitz mode: check protection period instead of grace period
  if (gameMode === 'blitz') {
    return isBlitzProtectionActive(db);
  }

  // Standard mode: 5 in-game hours grace period
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
    const gracePeriodMs = adjustForSpeed(5 * 3_600_000, speed); // 5 in-game hours

    return serverAge < gracePeriodMs;
  } catch (_e) {
    return true;
  }
};

/**
 * Process proactive attacks for all NPC villages.
 *
 * This is called during the NPC brain tick. It:
 * 1. Checks if we're still in the grace period
 * 2. For each NPC village, checks if enough time has passed since last proactive attack
 * 3. Rolls the dice to determine if an attack is sent
 * 4. Selects the player's nearest village as target
 * 5. Creates a troop movement attack event
 *
 * Performance: Uses batch queries and minimal DB writes.
 */
export const processProactiveAttacks = (
  db: DbFacade,
  currentTimeMs: number,
  speed: number,
  worldThreatLevel: number,
): number => {
  const difficulty = getDifficulty(db);

  // Check grace period (handles both standard and blitz modes)
  if (isInGracePeriod(db, speed)) {
    return 0;
  }

  const settings = DIFFICULTY_SETTINGS[difficulty];
  const intervalMs = getProactiveAttackIntervalMs(difficulty, speed);
  const attackChance = settings.attackChance;
  const npcTroopMultiplier = getNpcTroopMultiplier(worldThreatLevel);
  const mapSize = getMapSize(db);

  // Get player's village coordinates once
  const playerCoords = getPlayerVillageCoords(db);
  if (!playerCoords) {
    return 0;
  }

  // Get player's village ID
  const playerVillageId = db.selectValue({
    sql: `
      SELECT v.id FROM villages v
      WHERE v.player_id = $playerId
      ORDER BY v.id ASC LIMIT 1;
    `,
    bind: { $playerId: PLAYER_ID },
    schema: z.number(),
  });
  if (!playerVillageId) {
    return 0;
  }

  // Batch fetch: all NPC villages with their state and coordinates
  const npcVillages = db.selectObjects({
    sql: `
      SELECT
        nvs.village_id AS villageId,
        nvs.faction_key AS factionKey,
        nvs.last_proactive_attack_ms AS lastProactiveAttackMs,
        v.tile_id AS tileId,
        v.name AS villageName,
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
    tileId: number;
    villageName: string;
    x: number;
    y: number;
    tribe: string;
  }[];

  if (npcVillages.length === 0) {
    return 0;
  }

  let attacksLaunched = 0;
  const updates: { villageId: number; timestamp: number }[] = [];

  for (const village of npcVillages) {
    // Check if enough time has passed since last proactive attack
    const lastAttack = village.lastProactiveAttackMs || 0;
    if (currentTimeMs - lastAttack < intervalMs) {
      continue;
    }

    // Roll the dice
    if (Math.random() > attackChance) {
      // Update timestamp even if we don't attack (to avoid checking every tick)
      updates.push({ villageId: village.villageId, timestamp: currentTimeMs });
      continue;
    }

    // Materialize troops for this village
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

    // Skip if below minimum threshold
    if (totalUnits < NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION) {
      updates.push({ villageId: village.villageId, timestamp: currentTimeMs });
      continue;
    }

    // Cap at 70% of available troops
    const troopMap: Record<string, number> = {};
    for (const troop of homeTroops) {
      troopMap[troop.unitId] = troop.amount;
    }
    const attackTroops = scaleTroops(troopMap, 0.7);

    if (Object.keys(attackTroops).length === 0) {
      updates.push({ villageId: village.villageId, timestamp: currentTimeMs });
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
      const scaledAmount = Math.max(1, Math.floor(amount * npcTroopMultiplier));
      scaledTroops.push({
        unitId: unitId as UnitId,
        amount: scaledAmount,
        tileId: village.tileId,
        source: village.tileId,
      });
    }

    if (scaledTroops.length === 0) {
      updates.push({ villageId: village.villageId, timestamp: currentTimeMs });
      continue;
    }

    // Calculate travel time
    const distance = mapDistance({ x: village.x, y: village.y }, playerCoords);
    const slowestSpeed = 3; // Assume slowest unit speed
    const travelTimeMs = Math.ceil(
      (distance / (slowestSpeed * speed)) * 3_600_000,
    );
    const executeAtMs = currentTimeMs + travelTimeMs;

    // Create the attack event
    try {
      createEvents<'troopMovementAttack'>(db, {
        type: 'troopMovementAttack',
        villageId: village.villageId,
        targetId: playerVillageId,
        troops: scaledTroops as any,
        startsAt: Math.floor(executeAtMs),
      });
      attacksLaunched++;
    } catch (_e) {
      // Event creation failed — skip
    }

    updates.push({ villageId: village.villageId, timestamp: currentTimeMs });
  }

  // Batch update last proactive attack timestamps
  if (updates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};
    for (let i = 0; i < updates.length; i++) {
      const u = updates[i];
      caseClauses.push(`WHEN village_id = $v${i} THEN $t${i}`);
      bind[`$v${i}`] = u.villageId;
      bind[`$t${i}`] = u.timestamp;
    }
    const placeholders = updates.map((_, i) => `$p${i}`).join(',');
    const placeholderBinds: Record<string, number> = {};
    updates.forEach((u, i) => {
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
