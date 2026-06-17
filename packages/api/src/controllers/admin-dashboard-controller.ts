import { z } from 'zod';
import { createController } from '../utils/controller.ts';
import { FACTION_PROFILES } from './resolvers/utils/npc-brain/faction-profiles.ts';

/**
 * Admin Dashboard Controller
 *
 * Provides aggregate data for the NPC Brain admin dashboard.
 * All endpoints are read-only GET requests.
 * Wrapped in try-catch to prevent worker thread crashes.
 */

const safeNumber = (v: unknown): number => (typeof v === 'number' ? v : 0);

export const getAdminDashboardOverview = createController(
  '/admin/npc-dashboard/overview',
)(({ database }) => {
  try {
    const totalNpcVillages = database.selectValue({
      sql: 'SELECT COUNT(*) FROM npc_village_state;',
      schema: z.number().nullable(),
    });

    const totalTroops = database.selectValue({
      sql: `SELECT COALESCE(SUM(t.amount), 0)
        FROM troops t
        JOIN villages v ON v.tile_id = t.source_tile_id
        WHERE v.player_id != 1 AND t.tile_id = t.source_tile_id;`,
      schema: z.number().nullable(),
    });

    const avgAggression = database.selectValue({
      sql: 'SELECT COALESCE(AVG(aggression_level), 0) FROM npc_village_state;',
      schema: z.number().nullable(),
    });

    const totalFieldLevels = database.selectValue({
      sql: `SELECT COALESCE(SUM(bf.level), 0)
        FROM building_fields bf
        JOIN villages v ON v.id = bf.village_id
        WHERE v.player_id != 1;`,
      schema: z.number().nullable(),
    });

    const totalFields = database.selectValue({
      sql: `SELECT COUNT(*)
        FROM building_fields bf
        JOIN villages v ON v.id = bf.village_id
        WHERE v.player_id != 1;`,
      schema: z.number().nullable(),
    });

    const totalBuilds = database.selectValue({
      sql: 'SELECT COUNT(*) FROM building_level_change_history WHERE village_id != 1;',
      schema: z.number().nullable(),
    });

    const villagesWithHighAggression = database.selectValue({
      sql: 'SELECT COUNT(*) FROM npc_village_state WHERE aggression_level >= 3;',
      schema: z.number().nullable(),
    });

    const totalPopulation = database.selectValue({
      sql: `SELECT COALESCE(SUM(e.value * -1), 0)
        FROM effects e
        JOIN villages v ON v.id = e.village_id
        WHERE v.player_id != 1
          AND e.effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction')
          AND e.type = 'base'
          AND e.source = 'building'
          AND e.source_specifier = 0;`,
      schema: z.number().nullable(),
    });

    return {
      totalNpcVillages: safeNumber(totalNpcVillages),
      totalTroops: safeNumber(totalTroops),
      avgAggression: Number(safeNumber(avgAggression).toFixed(2)),
      avgFieldLevel: Number(
        (
          safeNumber(totalFieldLevels) / Math.max(1, safeNumber(totalFields))
        ).toFixed(1),
      ),
      totalBuilds: safeNumber(totalBuilds),
      villagesWithHighAggression: safeNumber(villagesWithHighAggression),
      totalPopulation: safeNumber(totalPopulation),
    };
  } catch (_e) {
    return {
      totalNpcVillages: 0,
      totalTroops: 0,
      avgAggression: 0,
      avgFieldLevel: 0,
      totalBuilds: 0,
      villagesWithHighAggression: 0,
      totalPopulation: 0,
    };
  }
});

export const getAdminDashboardFactions = createController(
  '/admin/npc-dashboard/factions',
)(({ database }) => {
  try {
    const factionRows = database.selectObjects({
      sql: `
        SELECT
          nvs.faction_key AS factionKey,
          COUNT(*) AS villageCount,
          COALESCE(SUM(troopSums.totalTroops), 0) AS totalTroops,
          COALESCE(AVG(fieldSums.fieldLevelSum), 0) AS avgFieldLevel
        FROM npc_village_state nvs
        JOIN villages v ON v.id = nvs.village_id
        LEFT JOIN (
          SELECT v2.id AS villageId, COALESCE(SUM(t.amount), 0) AS totalTroops
          FROM villages v2
          JOIN troops t ON t.source_tile_id = v2.tile_id AND t.tile_id = v2.tile_id
          WHERE v2.player_id != 1
          GROUP BY v2.id
        ) troopSums ON troopSums.villageId = nvs.village_id
        LEFT JOIN (
          SELECT bf.village_id, SUM(bf.level) AS fieldLevelSum
          FROM building_fields bf
          JOIN villages v3 ON v3.id = bf.village_id
          WHERE v3.player_id != 1
          GROUP BY bf.village_id
        ) fieldSums ON fieldSums.village_id = nvs.village_id
        GROUP BY nvs.faction_key
        ORDER BY villageCount DESC;
      `,
      schema: z.any(),
    }) as {
      factionKey: string;
      villageCount: number;
      totalTroops: number;
      avgFieldLevel: number;
    }[];

    const result = factionRows.map((row) => {
      const profile =
        FACTION_PROFILES[row.factionKey as keyof typeof FACTION_PROFILES];
      return {
        factionKey: row.factionKey,
        factionName: profile?.name ?? row.factionKey,
        villageCount: safeNumber(row.villageCount),
        totalTroops: safeNumber(row.totalTroops),
        avgFieldLevel: Number(safeNumber(row.avgFieldLevel).toFixed(1)),
        totalPopulation: 0,
        aggressionLevel: 0,
        topVillageName: '',
        topVillageTroops: 0,
      };
    });

    if (result.length === 0) {
      return result;
    }

    const aggressionRows = database.selectObjects({
      sql: `SELECT faction_key AS factionKey, AVG(aggression_level) AS avgAggression
        FROM npc_village_state GROUP BY faction_key;`,
      schema: z.any(),
    }) as { factionKey: string; avgAggression: number }[];
    const aggressionMap = new Map(
      aggressionRows.map((r) => [r.factionKey, r.avgAggression]),
    );
    for (const f of result) {
      f.aggressionLevel = Number(
        safeNumber(aggressionMap.get(f.factionKey)).toFixed(2),
      );
    }

    const topVillageRows = database.selectObjects({
      sql: `
        SELECT
          nvs.faction_key AS factionKey,
          v.name AS villageName,
          COALESCE(SUM(t.amount), 0) AS totalTroops
        FROM npc_village_state nvs
        JOIN villages v ON v.id = nvs.village_id
        JOIN troops t ON t.source_tile_id = v.tile_id AND t.tile_id = v.tile_id
        WHERE v.player_id != 1
        GROUP BY nvs.faction_key, v.id, v.name
        ORDER BY nvs.faction_key, totalTroops DESC;`,
      schema: z.any(),
    }) as { factionKey: string; villageName: string; totalTroops: number }[];
    const topByFaction = new Map<string, { name: string; troops: number }>();
    for (const row of topVillageRows) {
      if (!topByFaction.has(row.factionKey)) {
        topByFaction.set(row.factionKey, {
          name: row.villageName,
          troops: row.totalTroops,
        });
      }
    }
    for (const f of result) {
      const top = topByFaction.get(f.factionKey);
      if (top) {
        f.topVillageName = top.name;
        f.topVillageTroops = top.troops;
      }
    }

    return result;
  } catch (_e) {
    return [];
  }
});

export const getAdminDashboardVillages = createController(
  '/admin/npc-dashboard/villages',
)(({ database }) => {
  try {
    return database.selectObjects({
      sql: `
        SELECT
          nvs.village_id AS villageId,
          v.name AS villageName,
          nvs.faction_key AS factionKey,
          t.x,
          t.y,
          nvs.aggression_level AS aggressionLevel,
          nvs.current_loot_available AS currentLoot,
          nvs.max_loot_capacity AS maxLoot,
          COALESCE(troopSums.totalTroops, 0) AS totalTroops,
          COALESCE(fieldSums.fieldLevelSum, 0) AS fieldLevelSum,
          COALESCE(popEffects.totalPopulation, 0) AS population
        FROM npc_village_state nvs
        JOIN villages v ON v.id = nvs.village_id
        JOIN tiles t ON t.id = v.tile_id
        LEFT JOIN (
          SELECT v2.id AS villageId, COALESCE(SUM(t2.amount), 0) AS totalTroops
          FROM villages v2
          JOIN troops t2 ON t2.source_tile_id = v2.tile_id AND t2.tile_id = v2.tile_id
          WHERE v2.player_id != 1
          GROUP BY v2.id
        ) troopSums ON troopSums.villageId = nvs.village_id
        LEFT JOIN (
          SELECT bf.village_id, SUM(bf.level) AS fieldLevelSum
          FROM building_fields bf
          JOIN villages v3 ON v3.id = bf.village_id
          WHERE v3.player_id != 1
          GROUP BY bf.village_id
        ) fieldSums ON fieldSums.village_id = nvs.village_id
        LEFT JOIN (
          SELECT e.village_id, SUM(e.value * -1) AS totalPopulation
          FROM effects e
          JOIN effect_ids ei ON ei.id = e.effect_id
          WHERE ei.effect = 'wheatProduction'
            AND e.type = 'base'
            AND e.source = 'building'
            AND e.source_specifier = 0
          GROUP BY e.village_id
        ) popEffects ON popEffects.village_id = nvs.village_id
        ORDER BY totalTroops DESC;`,
      schema: z.object({
        villageId: z.number(),
        villageName: z.string(),
        factionKey: z.string(),
        x: z.number(),
        y: z.number(),
        aggressionLevel: z.number(),
        currentLoot: z.number(),
        maxLoot: z.number(),
        totalTroops: z.number(),
        fieldLevelSum: z.number(),
        population: z.number(),
      }),
    });
  } catch (_e) {
    return [];
  }
});

export const getAdminDashboardActivity = createController(
  '/admin/npc-dashboard/activity',
)(({ database }) => {
  try {
    const recentBuilds = database.selectObjects({
      sql: `
        SELECT
          blch.village_id AS villageId,
          v.name AS villageName,
          nvs.faction_key AS factionKey,
          bi.building,
          blch.field_id AS fieldId,
          blch.previous_level AS oldLevel,
          blch.new_level AS newLevel,
          blch.timestamp
        FROM building_level_change_history blch
        JOIN villages v ON v.id = blch.village_id
        JOIN npc_village_state nvs ON nvs.village_id = blch.village_id
        JOIN building_ids bi ON bi.id = blch.building_id
        WHERE blch.village_id != 1
        ORDER BY blch.timestamp DESC
        LIMIT 50;`,
      schema: z.object({
        villageId: z.number(),
        villageName: z.string(),
        factionKey: z.string(),
        building: z.string(),
        fieldId: z.number(),
        oldLevel: z.number(),
        newLevel: z.number(),
        timestamp: z.number(),
      }),
    });

    const recentRaids = database.selectObjects({
      sql: `
        SELECT
          nrh.village_id AS villageId,
          v.name AS villageName,
          nvs.faction_key AS factionKey,
          nrh.timestamp,
          nrh.loot_wood AS lootWood,
          nrh.loot_clay AS lootClay,
          nrh.loot_iron AS lootIron,
          nrh.loot_wheat AS lootWheat
        FROM npc_raid_history nrh
        JOIN villages v ON v.id = nrh.village_id
        JOIN npc_village_state nvs ON nvs.village_id = nrh.village_id
        ORDER BY nrh.timestamp DESC
        LIMIT 50;`,
      schema: z.object({
        villageId: z.number(),
        villageName: z.string(),
        factionKey: z.string(),
        timestamp: z.number(),
        lootWood: z.number(),
        lootClay: z.number(),
        lootIron: z.number(),
        lootWheat: z.number(),
      }),
    });

    const pendingRetaliations = database.selectObjects({
      sql: `
        SELECT
          rq.village_id AS villageId,
          v.name AS villageName,
          rq.faction_key AS factionKey,
          rq.execute_at_ms AS executeAtMs,
          rq.aggression_tier AS tier,
          rq.scheduled_at_ms AS scheduledAtMs
        FROM npc_retaliation_queue rq
        JOIN villages v ON v.id = rq.village_id
        ORDER BY rq.execute_at_ms ASC;`,
      schema: z.object({
        villageId: z.number(),
        villageName: z.string(),
        factionKey: z.string(),
        executeAtMs: z.number(),
        tier: z.number(),
        scheduledAtMs: z.number(),
      }),
    });

    const buildHistory = database.selectObjects({
      sql: `
        SELECT
          (timestamp / 3600) * 3600 AS hour,
          COUNT(*) AS builds
        FROM building_level_change_history
        WHERE village_id != 1
        GROUP BY hour
        ORDER BY hour DESC
        LIMIT 24;`,
      schema: z.object({
        hour: z.number(),
        builds: z.number(),
      }),
    });

    return {
      recentBuilds,
      recentRaids,
      pendingRetaliations,
      buildHistory,
    };
  } catch (_e) {
    return {
      recentBuilds: [],
      recentRaids: [],
      pendingRetaliations: [],
      buildHistory: [],
    };
  }
});
