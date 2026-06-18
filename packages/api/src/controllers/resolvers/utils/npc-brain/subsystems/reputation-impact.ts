import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getFactionProfile } from '../faction-profiles';
import {
  getAllNPCVillages,
  getGameSpeed,
  getPlayerVillageCoords,
  mapDistance,
  scaleTroops,
} from '../helpers';
import type { FactionKey } from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';
import { getRaidCount } from './memory-decay';
import { armRevengeIntent, queueRetaliation } from './retaliation-execution';

/**
 * Unified Raid Consequence Handler
 *
 * SINGLE entry point for all NPC raid consequences. Called once from
 * combat-resolver.ts when the player raids an NPC village.
 *
 * Handles:
 * 1. Raid history recording
 * 2. Reputation impact
 * 3. Loot/aggression state updates
 * 4. Retaliation queuing (the ONLY retaliation trigger path)
 * 5. Regional reinforcement escalation
 *
 * This replaces both the old handleNpcRetaliation() in npc.ts AND the old
 * calculateAggressionResponse() in aggression-escalation.ts.
 */

/**
 * Apply all consequences of a player raid on an NPC village.
 */
export const applyRaidReputationConsequences = (
  db: DbFacade,
  npcVillageId: number,
  attackerVillageId: number,
  raidResult: {
    lootWood: number;
    lootClay: number;
    lootIron: number;
    lootWheat: number;
    defenderTroopsRemaining: number;
    defenderLosses: { unitId: string; amount: number }[];
    attackerLosses: { unitId: string; amount: number }[];
  },
): void => {
  // ─── Get village state ───
  const villageState = db.selectObject({
    sql: `
      SELECT
        nvs.faction_key AS factionKey,
        nvs.max_loot_capacity AS maxLoot,
        nvs.loot_at_last_raid AS lootAvailable,
        nvs.rest_state AS restState,
        v.tile_id AS tileId,
        t.x,
        t.y
      FROM npc_village_state nvs
      JOIN villages v ON v.id = nvs.village_id
      JOIN tiles t ON t.id = v.tile_id
      WHERE nvs.village_id = $villageId;
    `,
    bind: { $villageId: npcVillageId },
    schema: z.any(),
  }) as
    | {
        factionKey: string;
        maxLoot: number;
        lootAvailable: number;
        restState: number;
        tileId: number;
        x: number;
        y: number;
      }
    | undefined;

  if (!villageState?.factionKey?.startsWith('npc')) {
    return;
  }

  const factionKey = villageState.factionKey as FactionKey;
  const profile = getFactionProfile(factionKey);

  // ─── 1. Record raid in npc_raid_history ───
  try {
    db.exec({
      sql: `
        INSERT INTO npc_raid_history
          (village_id, timestamp, loot_wood, loot_clay, loot_iron, loot_wheat,
           troops_lost_json, player_troops_lost_json)
        VALUES
          ($villageId, $timestamp, $lootWood, $lootClay, $lootIron, $lootWheat,
           $troopsLostJson, $playerTroopsLostJson);
      `,
      bind: {
        $villageId: npcVillageId,
        $timestamp: Date.now(),
        $lootWood: raidResult.lootWood,
        $lootClay: raidResult.lootClay,
        $lootIron: raidResult.lootIron,
        $lootWheat: raidResult.lootWheat,
        $troopsLostJson: JSON.stringify(raidResult.defenderLosses),
        $playerTroopsLostJson: JSON.stringify(raidResult.attackerLosses),
      },
    });
  } catch (_e) {
    // Table might not exist yet
  }

  // ─── 2. Apply reputation loss ───
  const totalLootStolen =
    raidResult.lootWood +
    raidResult.lootClay +
    raidResult.lootIron +
    raidResult.lootWheat;
  const lootPercentageStolen =
    villageState.maxLoot > 0
      ? Math.min(1, totalLootStolen / villageState.maxLoot)
      : 0;

  let scaledLoss = Math.floor(
    profile.repLossPerRaid * (0.5 + lootPercentageStolen),
  );
  if (raidResult.defenderTroopsRemaining === 0) {
    scaledLoss += NPC_BRAIN_CONSTANTS.WIPE_GARRISON_REP_PENALTY;
  }

  const factionId = db.selectValue({
    sql: 'SELECT id FROM faction_ids WHERE faction = $factionKey;',
    bind: { $factionKey: factionKey },
    schema: z.number(),
  });

  if (factionId != null) {
    const playerFactionId = db.selectValue({
      sql: 'SELECT p.faction_id FROM players p WHERE p.id = $playerId;',
      bind: { $playerId: 1 },
      schema: z.any(),
    });

    if (playerFactionId != null) {
      db.exec({
        sql: `
          UPDATE faction_reputation
          SET reputation = MAX(0, reputation - $loss)
          WHERE source_faction_id = $playerFactionId
            AND target_faction_id = $factionId;
        `,
        bind: {
          $loss: scaledLoss,
          $playerFactionId: playerFactionId,
          $factionId: factionId,
        },
      });
    }
  }

  // ─── 3. Update npc_village_state (single increment of times_attacked) ───
  const newLootAvailable = Math.max(
    0,
    villageState.lootAvailable - lootPercentageStolen,
  );

  db.exec({
    sql: `
      UPDATE npc_village_state
      SET
        times_attacked = times_attacked + 1,
        last_raided_ms = $now,
        last_interacted_at = $now,
        loot_at_last_raid = $newLoot,
        rest_state = 0
      WHERE village_id = $villageId;
    `,
    bind: {
      $now: Date.now(),
      $newLoot: newLootAvailable,
      $villageId: npcVillageId,
    },
  });

  // ─── 4. Determine retaliation ───
  const raidCount = getRaidCount(db, npcVillageId);
  const newAggressionTier = Math.min(
    5,
    Math.floor(raidCount / profile.retaliationThreshold),
  );

  // Update aggression level
  db.exec({
    sql: `
      UPDATE npc_village_state
      SET aggression_level = MAX(aggression_level, $tier)
      WHERE village_id = $villageId;
    `,
    bind: { $tier: newAggressionTier, $villageId: npcVillageId },
  });

  if (newAggressionTier >= 1) {
    const gameSpeed = getGameSpeed(db);

    // Get home troops for retaliation sizing
    const homeTroops = db.selectObjects({
      sql: `
        SELECT u.unit AS unitId, t.amount
        FROM troops t
        JOIN unit_ids u ON u.id = t.unit_id
        WHERE t.tile_id = $tileId
          AND t.source_tile_id = $tileId
          AND t.amount > 0;
      `,
      bind: { $tileId: villageState.tileId },
      schema: z.strictObject({ unitId: z.string(), amount: z.number() }),
    });

    const totalUnits = homeTroops.reduce((sum, t) => sum + t.amount, 0);
    const troopPercentage =
      NPC_BRAIN_CONSTANTS.AGGRESSION_TROOP_PERCENTAGES[
        Math.min(5, newAggressionTier)
      ];

    if (
      totalUnits >= NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION &&
      troopPercentage > 0
    ) {
      // Enough troops: queue retaliation immediately
      const troopMap: Record<string, number> = {};
      for (const troop of homeTroops) {
        troopMap[troop.unitId] = troop.amount;
      }
      const retaliationTroops = scaleTroops(troopMap, troopPercentage);

      if (Object.keys(retaliationTroops).length > 0) {
        const playerCoords = getPlayerVillageCoords(db);
        if (playerCoords) {
          const distance = mapDistance(
            { x: villageState.x, y: villageState.y },
            playerCoords,
          );
          const slowestSpeed = 3;
          const travelTimeMs = Math.ceil(
            (distance / (slowestSpeed * gameSpeed)) * 3_600_000,
          );
          const variance =
            (Math.random() * 2 * NPC_BRAIN_CONSTANTS.RETALIATION_VARIANCE -
              NPC_BRAIN_CONSTANTS.RETALIATION_VARIANCE) *
            travelTimeMs;
          const executeAtMs = Date.now() + travelTimeMs + variance;

          queueRetaliation(
            db,
            npcVillageId,
            factionKey,
            newAggressionTier,
            JSON.stringify(retaliationTroops),
            executeAtMs,
          );
        }
      }
    } else if (troopPercentage > 0) {
      // Not enough troops: arm revenge intent for deferred resolution
      armRevengeIntent(db, npcVillageId, attackerVillageId, gameSpeed);
    }

    // ─── 5. Regional reinforcements at high aggression ───
    if (newAggressionTier >= 4) {
      callRegionalReinforcements(
        db,
        npcVillageId,
        factionKey,
        newAggressionTier,
        gameSpeed,
      );
    }
  }
};

/**
 * Call regional reinforcements from nearby same-faction villages.
 * Bumps their aggression and queues retaliations from them too.
 */
const callRegionalReinforcements = (
  db: DbFacade,
  villageId: number,
  factionKey: FactionKey,
  _tier: number,
  speed: number,
): void => {
  const allNpcVillages = getAllNPCVillages(db);
  const sourceVillage = allNpcVillages.find((v) => v.villageId === villageId);
  if (!sourceVillage) {
    return;
  }

  const range = NPC_BRAIN_CONSTANTS.REINFORCEMENT_RANGE;
  const neighbors = allNpcVillages
    .filter((v) => v.villageId !== villageId)
    .filter((v) => v.factionKey === factionKey)
    .filter((v) => {
      const dist = mapDistance(
        { x: sourceVillage.x, y: sourceVillage.y },
        { x: v.x, y: v.y },
      );
      return dist <= range;
    });

  if (neighbors.length === 0) {
    return;
  }

  // Batch query aggression levels
  const neighborIds = neighbors.map((v) => v.villageId);
  const placeholders = neighborIds.map((_, i) => `$nv${i}`).join(',');
  const binds: Record<string, number> = {};
  neighborIds.forEach((nid, i) => {
    binds[`$nv${i}`] = nid;
  });

  const aggressionLevels = db.selectObjects({
    sql: `
      SELECT village_id AS villageId, aggression_level AS level
      FROM npc_village_state
      WHERE village_id IN (${placeholders});
    `,
    bind: binds,
    schema: z.any(),
  }) as { villageId: number; level: number }[];

  const aggressionMap = new Map(
    aggressionLevels.map((r) => [r.villageId, r.level]),
  );

  const lowAggressionNeighbors = neighbors.filter((v) => {
    return (aggressionMap.get(v.villageId) ?? 0) < 3;
  });

  // Fetch player coords once (was previously inside per-neighbor loop)
  const playerCoords = getPlayerVillageCoords(db);
  if (!playerCoords) {
    return;
  }

  for (const neighbor of lowAggressionNeighbors) {
    // Bump aggression
    db.exec({
      sql: `
        UPDATE npc_village_state
        SET aggression_level = MAX(aggression_level, 2),
            regional_alert_active = 1
        WHERE village_id = $villageId;
      `,
      bind: { $villageId: neighbor.villageId },
    });

    // Queue a low-tier retaliation from this neighbor
    const neighborTroops = db.selectObjects({
      sql: `
        SELECT u.unit AS unitId, t.amount
        FROM troops t
        JOIN unit_ids u ON u.id = t.unit_id
        WHERE t.tile_id = $tileId
          AND t.source_tile_id = $tileId
          AND t.amount > 0;
      `,
      bind: { $tileId: neighbor.tileId },
      schema: z.strictObject({ unitId: z.string(), amount: z.number() }),
    });

    const totalUnits = neighborTroops.reduce((sum, t) => sum + t.amount, 0);
    if (totalUnits < NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION) {
      continue;
    }

    const troopMap: Record<string, number> = {};
    for (const troop of neighborTroops) {
      troopMap[troop.unitId] = troop.amount;
    }
    const retaliationTroops = scaleTroops(troopMap, 0.25); // Tier 2 = 25%

    if (Object.keys(retaliationTroops).length > 0) {
      const distance = mapDistance(
        { x: neighbor.x, y: neighbor.y },
        playerCoords,
      );
      const slowestSpeed = 3;
      const travelTimeMs = Math.ceil(
        (distance / (slowestSpeed * speed)) * 3_600_000,
      );
      const executeAtMs = Date.now() + travelTimeMs;

      queueRetaliation(
        db,
        neighbor.villageId,
        factionKey as FactionKey,
        2,
        JSON.stringify(retaliationTroops),
        executeAtMs,
      );
    }
  }
};
