import type { DbFacade } from '@pillage-first/utils/facades/database';
import { FACTION_PROFILES } from './faction-profiles';
import { getMapSize, getVillageSize } from './helpers';
import type { FactionKey } from './npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from './npc-brain-types';
import { getTotalTroopCount } from './subsystems/troop-regeneration';

/**
 * Developer Tools: NPC Village Debug Info
 *
 * Returns comprehensive debug data for any NPC village.
 * Gated behind isDeveloperMode — must not be callable in production.
 */

export interface NpcVillageDebugInfo {
  villageId: number;
  villageName: string;
  factionKey: FactionKey;
  factionProfile: {
    name: string;
    personality: string;
    retaliationThreshold: number;
    isMemoryPermanent: boolean;
    aggressionDecayDays: number | null;
    growthRateMultiplier: number;
    troopRegenRateMultiplier: number;
  };
  coordinates: { x: number; y: number };
  villageSize: string;
  npcVillageState: Record<string, unknown>;
  currentTroopCount: number;
  defenceFloor: number;
  storageLevels: { warehouse: number; granary: number };
  storageVsLoot: { currentLoot: number; maxLoot: number };
  revengeIntent: {
    targetVillageId: number | null;
    armedAtMs: number | null;
  };
  simulationTier: number;
  nextSimulationDue: number;
  needsTick: boolean;
  lastBuildDecisions: string[];
}

/**
 * Query comprehensive debug info for an NPC village.
 * Only callable when developer mode is enabled.
 */
export const getNpcVillageDebugInfo = (
  db: DbFacade,
  villageId: number,
): NpcVillageDebugInfo | null => {
  // Fetch village + npc_village_state
  let state: Record<string, unknown> | undefined;
  try {
    state = db.selectObject({
      sql: `
        SELECT
          nvs.*,
          v.name AS village_name,
          t.x,
          t.y
        FROM npc_village_state nvs
        JOIN villages v ON v.id = nvs.village_id
        JOIN tiles t ON t.id = v.tile_id
        WHERE nvs.village_id = $villageId;
      `,
      bind: { $villageId: villageId },
      schema: { parse: (v: unknown) => v } as any,
    }) as Record<string, unknown> | undefined;
  } catch (e) {
    console.error('[NPC Debug] state query failed:', e);
    throw e;
  }

  if (!state) {
    return null;
  }

  const factionKey = state.faction_key as FactionKey;
  const profile = FACTION_PROFILES[factionKey];
  if (!profile) {
    return null;
  }

  // Get storage building levels
  let buildingLevels: { buildingKey: string; level: number }[] = [];
  try {
    buildingLevels = db.selectObjects({
      sql: `
        SELECT bi.building AS buildingKey, bf.level
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $villageId
          AND UPPER(bi.building) IN ('WAREHOUSE', 'GRANARY');
      `,
      bind: { $villageId: villageId },
      schema: { parse: (v: unknown) => v } as any,
    }) as { buildingKey: string; level: number }[];
  } catch (e) {
    console.error('[NPC Debug] buildingLevels query failed:', e);
  }

  console.error(
    '[NPC Debug] buildingLevels:',
    buildingLevels.length,
    'rows for village',
    villageId,
  );

  const warehouseLevel =
    buildingLevels.find((b) => b.buildingKey.toUpperCase() === 'WAREHOUSE')
      ?.level ?? 0;
  const granaryLevel =
    buildingLevels.find((b) => b.buildingKey.toUpperCase() === 'GRANARY')
      ?.level ?? 0;

  // Get troop count
  let totalTroops = 0;
  try {
    const tileId = state.tile_id as number;
    totalTroops = getTotalTroopCount(db, tileId ?? 0);
  } catch (e) {
    console.error('[NPC Debug] troop count query failed:', e);
  }

  // Get village size using shared helper
  let villageSize = 'unknown';
  try {
    const x = state.x as number;
    const y = state.y as number;
    const mapSize = getMapSize(db);
    villageSize = getVillageSize(mapSize, x, y);
  } catch (e) {
    console.error('[NPC Debug] villageSize query failed:', e);
  }

  const defenceFloor =
    NPC_BRAIN_CONSTANTS.DEFENCE_FLOOR_BY_SIZE[villageSize] ?? 50;

  // Get recent build decisions from building level change history
  let recentBuilds: {
    buildingKey: string;
    newLevel: number;
    timestamp: number;
  }[] = [];
  try {
    recentBuilds = db.selectObjects({
      sql: `
        SELECT bi.building AS buildingKey, blch.new_level AS newLevel, blch.timestamp
        FROM building_level_change_history blch
        JOIN building_ids bi ON bi.id = blch.building_id
        WHERE blch.village_id = $villageId
        ORDER BY blch.timestamp DESC
        LIMIT 10;
      `,
      bind: { $villageId: villageId },
      schema: { parse: (v: unknown) => v } as any,
    }) as { buildingKey: string; newLevel: number; timestamp: number }[];
  } catch (_e) {
    // Table might not exist
  }

  return {
    villageId,
    villageName: state.village_name as string,
    factionKey,
    factionProfile: {
      name: profile.name,
      personality: profile.personality,
      retaliationThreshold: profile.retaliationThreshold,
      isMemoryPermanent: profile.isMemoryPermanent,
      aggressionDecayDays: profile.aggressionDecayDays,
      growthRateMultiplier: profile.growthRateMultiplier,
      troopRegenRateMultiplier: profile.troopRegenRateMultiplier,
    },
    coordinates: { x: state.x as number, y: state.y as number },
    villageSize,
    npcVillageState: state as Record<string, unknown>,
    currentTroopCount: totalTroops,
    defenceFloor,
    storageLevels: { warehouse: warehouseLevel, granary: granaryLevel },
    storageVsLoot: {
      currentLoot: state.current_loot_available as number,
      maxLoot: state.max_loot_capacity as number,
    },
    revengeIntent: {
      targetVillageId: state.revenge_intent_target_village_id as number | null,
      armedAtMs: state.revenge_intent_armed_at_ms as number | null,
    },
    simulationTier: (state.simulation_tier as number) ?? 2,
    nextSimulationDue: (state.next_simulation_due as number) ?? 0,
    needsTick: (state.needs_tick as number) === 1,
    lastBuildDecisions: recentBuilds.map(
      (b) => `${b.buildingKey} → level ${b.newLevel}`,
    ),
  };
};
