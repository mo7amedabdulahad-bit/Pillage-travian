import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

/**
 * Faction-specific starting values for npc_village_state.
 * Derives max_loot_capacity from actual warehouse/granary levels.
 * Sets population_growth_rate, rest_threshold_ms, rest_stockpile_bonus from faction profile.
 */

const FACTION_STARTING_VALUES: Record<
  string,
  {
    populationGrowthRate: number;
    restThresholdHours: number;
    restStockpileBonus: number;
  }
> = {
  npc1: {
    populationGrowthRate: 0.75,
    restThresholdHours: 48,
    restStockpileBonus: 0.1,
  },
  npc2: {
    populationGrowthRate: 1.5,
    restThresholdHours: 24,
    restStockpileBonus: 0.25,
  },
  npc3: {
    populationGrowthRate: 1.0,
    restThresholdHours: 48,
    restStockpileBonus: 0.15,
  },
  npc4: {
    populationGrowthRate: 1.0,
    restThresholdHours: 48,
    restStockpileBonus: 0.1,
  },
  npc5: {
    populationGrowthRate: 1.0,
    restThresholdHours: 48,
    restStockpileBonus: 0.2,
  },
  npc6: {
    populationGrowthRate: 0.8,
    restThresholdHours: 48,
    restStockpileBonus: 0.05,
  },
  npc7: {
    populationGrowthRate: 2.0,
    restThresholdHours: 24,
    restStockpileBonus: 0.3,
  },
  npc8: {
    populationGrowthRate: 1.2,
    restThresholdHours: 48,
    restStockpileBonus: 0.15,
  },
  npc9: {
    populationGrowthRate: 0.9,
    restThresholdHours: 48,
    restStockpileBonus: 0.05,
  },
};

/**
 * Storage capacity formula (same as player).
 * Level 1 = 800, each level adds capacity based on building data.
 * Simplified: warehouse_capacity(level) = 800 * level, granary_capacity(level) = 800 * level.
 * This is an approximation — the actual formula uses building-data.ts.
 */
const storageCapacityForLevel = (level: number): number => {
  if (level <= 0) {
    return 0;
  }
  // Base capacity at level 1 = 800, each additional level adds ~750-800
  return 800 + (level - 1) * 750;
};

/**
 * Initializes npc_village_state for all NPC villages with faction-specific values.
 */
export const npcVillageStateSeeder = (database: DbFacade): void => {
  // Get server speed for rest_threshold calculation
  const serverRow = database.selectObject({
    sql: 'SELECT speed FROM servers LIMIT 1;',
    schema: z.object({ speed: z.number() }),
  });
  const speed = serverRow?.speed ?? 1;

  // Get all NPC villages with their faction, tile coordinates
  const villages = database.selectObjects({
    sql: `
      SELECT
        v.id AS village_id,
        COALESCE(fi.faction, 'npc1') AS faction_key,
        t.x,
        t.y
      FROM villages v
      JOIN players p ON v.player_id = p.id
      LEFT JOIN faction_ids fi ON fi.id = p.faction_id
      JOIN tiles t ON t.id = v.tile_id
      WHERE v.player_id != $player_id;
    `,
    bind: { $player_id: PLAYER_ID },
    schema: z.strictObject({
      village_id: z.number(),
      faction_key: z.string(),
      x: z.number(),
      y: z.number(),
    }),
  });

  // Get building levels for all NPC villages (for max_loot_capacity calculation)
  const buildingLevels = database.selectObjects({
    sql: `
      SELECT
        bf.village_id,
        bi.building,
        bf.level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      JOIN villages v ON v.id = bf.village_id
      WHERE v.player_id != $playerId
        AND UPPER(bi.building) IN ('WAREHOUSE', 'GRANARY');
    `,
    bind: { $playerId: PLAYER_ID },
    schema: z.strictObject({
      village_id: z.number(),
      building: z.string(),
      level: z.number(),
    }),
  });

  // Group building levels by village
  const buildingLevelsByVillage = new Map<
    number,
    { warehouse: number; granary: number }
  >();
  for (const bl of buildingLevels) {
    let entry = buildingLevelsByVillage.get(bl.village_id);
    if (!entry) {
      entry = { warehouse: 0, granary: 0 };
      buildingLevelsByVillage.set(bl.village_id, entry);
    }
    if (bl.building === 'warehouse') {
      entry.warehouse = bl.level;
    }
    if (bl.building === 'granary') {
      entry.granary = bl.level;
    }
  }

  // Build insert rows
  const rows: (number | string)[][] = [];

  for (const village of villages) {
    const factionKey = village.faction_key;
    const factionValues =
      FACTION_STARTING_VALUES[factionKey] ?? FACTION_STARTING_VALUES.npc1;

    // Calculate max_loot_capacity from actual building levels
    const bl = buildingLevelsByVillage.get(village.village_id);
    const warehouseCapacity = storageCapacityForLevel(bl?.warehouse ?? 0);
    const granaryCapacity = storageCapacityForLevel(bl?.granary ?? 0);
    const maxLootCapacity = warehouseCapacity + granaryCapacity;

    // current_loot_available = 60% of max
    const currentLootAvailable = 0.6;

    // rest_threshold_ms = restThresholdHours * 3_600_000 / speed
    const restThresholdMs = Math.floor(
      (factionValues.restThresholdHours * 3_600_000) / speed,
    );

    rows.push([
      village.village_id, // village_id
      0, // last_interacted_at
      0, // times_attacked
      0, // field_growth_accumulator
      0, // last_growth_tick_ms
      factionValues.populationGrowthRate, // population_growth_rate
      0, // rest_state
      restThresholdMs, // rest_threshold_ms
      factionValues.restStockpileBonus, // rest_stockpile_bonus
      0, // last_troop_regen_ms
      currentLootAvailable, // current_loot_available
      maxLootCapacity, // max_loot_capacity
      0.08, // loot_recovery_rate
      0, // aggression_level
      0, // aggression_decay_timer
      0, // regional_alert_active
      0, // last_aggression_decay_ms
      0, // last_raided_ms
      factionKey, // faction_key
    ]);
  }

  if (rows.length === 0) {
    return;
  }

  batchInsert(
    database,
    'npc_village_state',
    [
      'village_id',
      'last_interacted_at',
      'times_attacked',
      'field_growth_accumulator',
      'last_growth_tick_ms',
      'population_growth_rate',
      'rest_state',
      'rest_threshold_ms',
      'rest_stockpile_bonus',
      'last_troop_regen_ms',
      'current_loot_available',
      'max_loot_capacity',
      'loot_recovery_rate',
      'aggression_level',
      'aggression_decay_timer',
      'regional_alert_active',
      'last_aggression_decay_ms',
      'last_raided_ms',
      'faction_key',
    ],
    rows,
  );

  // Safety net: recalculate max_loot_capacity from actual warehouse/granary levels
  // This handles any edge case where the JS calculation missed a village.
  database.exec({
    sql: `
      UPDATE npc_village_state
      SET max_loot_capacity = (
        SELECT COALESCE(SUM(
          CASE WHEN bf.level <= 0 THEN 0
               ELSE 800 + (bf.level - 1) * 750 END
        ), 0)
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = npc_village_state.village_id
          AND UPPER(bi.building) IN ('WAREHOUSE', 'GRANARY')
      )
      WHERE village_id IN (
        SELECT v.id FROM villages v
        JOIN players p ON p.id = v.player_id
        WHERE p.id != $playerId
      );
    `,
    bind: { $playerId: PLAYER_ID },
  });
};
