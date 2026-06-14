import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getFactionProfile } from '../faction-profiles';
import type { FactionKey } from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';
import { calculateAggressionResponse } from './aggression-escalation';
import { resetRestState } from './loot-recovery';

/**
 * Reputation Impact Subsystem (Section 4.7)
 *
 * Called immediately when the player RAIDS an NPC village.
 * Manages both the dual reputation system (existing faction_reputation table)
 * and the NPC Brain's internal raid tracking.
 *
 * Game design intent: Reputation loss scales with how badly you raid them.
 * A light raid costs less rep than wiping their garrison. PERMANENT factions
 * never forgive — the only reset is the legendary consumable.
 */

/**
 * Get or create npc_village_state for a village.
 * For old game worlds, this ensures the row exists with proper faction data.
 */
const ensureNpcVillageState = (
  db: DbFacade,
  npcVillageId: number,
): {
  factionKey: FactionKey;
  maxLoot: number;
  lootAvailable: number;
  restState: number;
} | null => {
  // Try to get existing state
  try {
    const state = db.selectObject({
      sql: `
        SELECT
          nvs.faction_key AS factionKey,
          nvs.max_loot_capacity AS maxLoot,
          nvs.current_loot_available AS lootAvailable,
          nvs.rest_state AS restState
        FROM npc_village_state nvs
        WHERE nvs.village_id = $villageId;
      `,
      bind: { $villageId: npcVillageId },
      schema: z.object({
        factionKey: z.string(),
        maxLoot: z.number(),
        lootAvailable: z.number(),
        restState: z.number(),
      }),
    });

    if (state?.factionKey?.startsWith('npc')) {
      return state as {
        factionKey: FactionKey;
        maxLoot: number;
        lootAvailable: number;
        restState: number;
      };
    }
  } catch (_e) {
    // Column might not exist yet
  }

  // Fallback: get faction from players table and create/update the state
  const villageInfo = db.selectObject({
    sql: `
      SELECT v.id, fi.faction
      FROM villages v
      JOIN players p ON p.id = v.player_id
      JOIN faction_ids fi ON fi.id = p.faction_id
      WHERE v.id = $villageId;
    `,
    bind: { $villageId: npcVillageId },
    schema: z.object({ id: z.number(), faction: z.string() }),
  });

  if (!villageInfo || villageInfo.faction === 'player') {
    return null;
  }

  const factionKey = villageInfo.faction as FactionKey;

  // Try to insert or update the state
  try {
    db.exec({
      sql: `
        INSERT INTO npc_village_state (village_id, faction_key, last_interacted_at, times_attacked)
        VALUES ($villageId, $factionKey, 0, 0)
        ON CONFLICT (village_id) DO UPDATE SET faction_key = $factionKey;
      `,
      bind: { $villageId: npcVillageId, $factionKey: factionKey },
    });
  } catch (_e) {
    // Table might not have faction_key column yet
  }

  return {
    factionKey,
    maxLoot: 500,
    lootAvailable: 1.0,
    restState: 0,
  };
};

/**
 * Apply all consequences of a player raid on an NPC village.
 * This is the main entry point called from the combat resolver.
 */
export const applyRaidReputationConsequences = (
  db: DbFacade,
  npcVillageId: number,
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
  // Get or create village state
  const villageState = ensureNpcVillageState(db, npcVillageId);

  if (!villageState) {
    return;
  }

  const factionKey = villageState.factionKey;
  const profile = getFactionProfile(factionKey);

  // Calculate loot stolen as percentage of max capacity
  const totalLootStolen =
    raidResult.lootWood +
    raidResult.lootClay +
    raidResult.lootIron +
    raidResult.lootWheat;
  const lootPercentageStolen =
    villageState.maxLoot > 0
      ? Math.min(1, totalLootStolen / villageState.maxLoot)
      : 0;

  // Calculate reputation loss
  let scaledLoss = Math.floor(
    profile.repLossPerRaid * (0.5 + lootPercentageStolen),
  );

  // Wipe garrison bonus
  if (raidResult.defenderTroopsRemaining === 0) {
    scaledLoss += NPC_BRAIN_CONSTANTS.WIPE_GARRISON_REP_PENALTY;
  }

  // Apply to existing faction_reputation table (dual system)
  const factionId = db.selectValue({
    sql: `
      SELECT id FROM faction_ids WHERE faction = $factionKey;
    `,
    bind: { $factionKey: factionKey },
    schema: z.number(),
  });

  if (factionId != null) {
    db.exec({
      sql: `
        UPDATE faction_reputation
        SET reputation = MAX(0, reputation - $loss)
        WHERE source_faction_id = 1
          AND target_faction_id = $factionId;
      `,
      bind: {
        $loss: scaledLoss,
        $factionId: factionId,
      },
    });
  }

  // Record raid in npc_raid_history
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

  // Update npc_village_state
  const newLootAvailable = Math.max(
    0,
    villageState.lootAvailable - lootPercentageStolen,
  );

  try {
    db.exec({
      sql: `
        UPDATE npc_village_state
        SET
          times_attacked = times_attacked + 1,
          last_raided_ms = $now,
          last_interacted_at = $now,
          current_loot_available = $newLoot,
          rest_state = 0,
          needs_tick = 1
        WHERE village_id = $villageId;
      `,
      bind: {
        $now: Date.now(),
        $newLoot: newLootAvailable,
        $villageId: npcVillageId,
      },
    });
  } catch (_e) {
    // Columns might not exist yet
  }

  // Reset rest state
  try {
    resetRestState(db, npcVillageId);
  } catch (_e) {}

  // Trigger aggression check
  try {
    calculateAggressionResponse(db, npcVillageId, factionKey);
  } catch (_e) {}
};
