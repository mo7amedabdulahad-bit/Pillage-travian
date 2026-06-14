import type { DbFacade } from '@pillage-first/utils/facades/database';
import { FACTION_PROFILES } from './faction-profiles';
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
  const state = db.selectObject({
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

  if (!state) {
    return null;
  }

  const factionKey = state.faction_key as FactionKey;
  const profile = FACTION_PROFILES[factionKey];
  if (!profile) {
    return null;
  }

  // Get storage building levels
  const buildingLevels = db.selectObjects({
    sql: `
      SELECT bi.building AS buildingKey, bf.level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      WHERE bf.village_id = $villageId
        AND bi.building IN ('warehouse', 'granary');
    `,
    bind: { $villageId: villageId },
    schema: { parse: (v: unknown) => v } as any,
  }) as { buildingKey: string; level: number }[];

  const warehouseLevel =
    buildingLevels.find((b) => b.buildingKey === 'warehouse')?.level ?? 0;
  const granaryLevel =
    buildingLevels.find((b) => b.buildingKey === 'granary')?.level ?? 0;

  // Get troop count
  const tileId = state.tile_id as number;
  const totalTroops = getTotalTroopCount(db, tileId ?? 0);

  // Get village size (approximate)
  const x = state.x as number;
  const y = state.y as number;
  const dist = Math.hypot(x, y);
  let villageSize = 'unknown';
  if (dist > 180) {
    villageSize = 'xxs';
  } else if (dist > 160) {
    villageSize = 'xs';
  } else if (dist > 140) {
    villageSize = 'sm';
  } else if (dist > 120) {
    villageSize = 'md';
  } else if (dist > 80) {
    villageSize = 'lg';
  } else if (dist > 60) {
    villageSize = 'xl';
  } else if (dist > 40) {
    villageSize = '2xl';
  } else if (dist > 20) {
    villageSize = '3xl';
  } else {
    villageSize = '4xl';
  }

  const defenceFloor =
    NPC_BRAIN_CONSTANTS.DEFENCE_FLOOR_BY_SIZE[villageSize] ?? 50;

  // Get recent build decisions from building level change history
  const recentBuilds = db.selectObjects({
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
    coordinates: { x, y },
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
    simulationTier: state.simulation_tier as number,
    nextSimulationDue: state.next_simulation_due as number,
    needsTick: (state.needs_tick as number) === 1,
    lastBuildDecisions: recentBuilds.map(
      (b) => `${b.buildingKey} → level ${b.newLevel}`,
    ),
  };
};
