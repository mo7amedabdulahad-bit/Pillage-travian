import { z } from 'zod';
import { units } from '@pillage-first/game-assets/units';
import { calculateHeroLevel } from '@pillage-first/game-assets/utils/hero';
import { createController } from '../utils/controller';

// ─── Admin villages (player + NPC) for the Player & Economy tabs ───

const adminVillageSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  playerId: z.number(),
  population: z.number(),
  loyalty: z.number(),
  isWorldWonderVillage: z.number(),
  worldWonderLevel: z.number(),
  constructionPlanHeld: z.number(),
  resources: z.strictObject({
    lumber: z.number(),
    clay: z.number(),
    iron: z.number(),
    crop: z.number(),
  }),
});

export const adminGetVillages = createController('/admin/villages')(
  ({ database }) => {
    const villages = database.selectObjects({
      sql: `
        SELECT
          v.id, v.name, v.slug, t.x, t.y, v.player_id AS playerId,
          v.loyalty, v.is_world_wonder_village AS isWorldWonderVillage,
          v.world_wonder_level AS worldWonderLevel,
          v.construction_plan_held AS constructionPlanHeld,
          COALESCE(rs.wood, 0) AS rWood,
          COALESCE(rs.clay, 0) AS rClay,
          COALESCE(rs.iron, 0) AS rIron,
          COALESCE(rs.wheat, 0) AS rWheat
        FROM villages v
        JOIN tiles t ON t.id = v.tile_id
        LEFT JOIN resource_sites rs ON rs.tile_id = v.tile_id
        ORDER BY v.id
      `,
      schema: z.strictObject({
        id: z.number(),
        name: z.string(),
        slug: z.string().nullable(),
        x: z.number(),
        y: z.number(),
        playerId: z.number(),
        loyalty: z.number(),
        isWorldWonderVillage: z.number(),
        worldWonderLevel: z.number(),
        constructionPlanHeld: z.number(),
        rWood: z.number(),
        rClay: z.number(),
        rIron: z.number(),
        rWheat: z.number(),
      }),
    });

    return villages.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      x: v.x,
      y: v.y,
      playerId: v.playerId,
      population: 0,
      loyalty: v.loyalty,
      isWorldWonderVillage: v.isWorldWonderVillage,
      worldWonderLevel: v.worldWonderLevel,
      constructionPlanHeld: v.constructionPlanHeld,
      resources: {
        lumber: v.rWood,
        clay: v.rClay,
        iron: v.rIron,
        crop: v.rWheat,
      },
    })) satisfies z.infer<typeof adminVillageSchema>[];
  },
);

// ─── Detailed per-village data (buildings + troops) for the details modal ───

const adminVillageDetailSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  buildings: z.array(
    z.strictObject({
      fieldId: z.number(),
      buildingId: z.string(),
      level: z.number(),
    }),
  ),
  troops: z.array(
    z.strictObject({
      unitId: z.string(),
      amount: z.number(),
    }),
  ),
});

export const adminGetVillageDetail = createController(
  '/admin/villages/:villageId/detail',
)(({ database, path: { villageId } }) => {
  const village = database.selectObject({
    sql: 'SELECT id, name FROM villages WHERE id = $villageId',
    bind: { $villageId: villageId },
    schema: z.strictObject({ id: z.number(), name: z.string() }),
  });
  if (!village) {
    throw new Error('Village not found');
  }

  const buildings = database.selectObjects({
    sql: `
      SELECT bf.field_id AS fieldId, bi.building AS buildingId, bf.level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      WHERE bf.village_id = $villageId
      ORDER BY bf.field_id
    `,
    bind: { $villageId: villageId },
    schema: z.strictObject({
      fieldId: z.number(),
      buildingId: z.string(),
      level: z.number(),
    }),
  });

  const troops = database.selectObjects({
    sql: `
      SELECT ui.unit AS unitId, t.amount
      FROM troops t
      JOIN unit_ids ui ON ui.id = t.unit_id
      WHERE t.tile_id = (SELECT tile_id FROM villages WHERE id = $villageId)
        AND t.tile_id = t.source_tile_id
      ORDER BY ui.unit
    `,
    bind: { $villageId: villageId },
    schema: z.strictObject({
      unitId: z.string(),
      amount: z.number(),
    }),
  });

  return {
    id: village.id,
    name: village.name,
    buildings,
    troops,
  } satisfies z.infer<typeof adminVillageDetailSchema>;
});

// ─── Hero overview for the Player tab ───

const heroItemSchema = z.strictObject({
  itemId: z.number(),
  amount: z.number(),
});

export const adminHeroOverviewSchema = z.strictObject({
  id: z.number(),
  level: z.number(),
  health: z.number(),
  maxHealth: z.number(),
  experience: z.number(),
  items: z.array(heroItemSchema),
});

export const adminGetHeroOverview = createController('/admin/hero-overview')(
  ({ database }) => {
    const hero = database.selectObject({
      sql: 'SELECT id, experience, health FROM heroes WHERE player_id = $playerId LIMIT 1',
      bind: { $playerId: 1 },
      schema: z.strictObject({
        id: z.number(),
        experience: z.number(),
        health: z.number(),
      }),
    });
    if (!hero) {
      return {
        id: 0,
        level: 0,
        health: 0,
        maxHealth: 100,
        experience: 0,
        items: [],
      };
    }

    const { level } = calculateHeroLevel(hero.experience);
    const items = database.selectObjects({
      sql: 'SELECT item_id AS itemId, amount FROM hero_inventory WHERE hero_id = $heroId',
      bind: { $heroId: hero.id },
      schema: z.strictObject({
        itemId: z.number(),
        amount: z.number(),
      }),
    });

    return {
      id: hero.id,
      level,
      health: hero.health,
      maxHealth: 100,
      experience: hero.experience,
      items,
    };
  },
);

// ─── Events inspector for the Events tab ───

const adminEventSchema = z.strictObject({
  id: z.number(),
  type: z.string(),
  startsAt: z.number(),
  resolvesAt: z.number(),
  villageId: z.number().nullable(),
  meta: z.string().nullable(),
});

export const adminGetEvents = createController('/admin/events')(
  ({ database, query }) => {
    let sql = `
      SELECT id, type, starts_at AS startsAt, resolves_at AS resolvesAt,
             village_id AS villageId, meta
      FROM events
      WHERE 1=1
    `;
    const bind: Record<string, string | number> = {};

    const type = query?.type as string | undefined;
    if (type) {
      sql += ' AND type = $type';
      bind.$type = type;
    }

    // The events table has no "resolved" column; events are removed after
    // resolution. An empty result is therefore equivalent to "no pending
    // events". We still accept the resolved query param for API symmetry.
    sql += ' ORDER BY resolves_at ASC LIMIT 500';

    return database.selectObjects({
      sql,
      ...(Object.keys(bind).length > 0 ? { bind } : {}),
      schema: adminEventSchema,
    });
  },
);

// ─── Reports inspector for the Logs & Reports tab ───

const adminReportSchema = z.strictObject({
  id: z.number(),
  type: z.string(),
  villageId: z.number(),
  targetVillageId: z.number().nullable(),
  timestamp: z.number(),
  isRead: z.number(),
  isArchived: z.number(),
  data: z.string(),
});

export const adminGetReports = createController('/admin/reports')(
  ({ database, query }) => {
    let sql = `
      SELECT id, type, village_id AS villageId,
             target_village_id AS targetVillageId, timestamp,
             is_read AS isRead, is_archived AS isArchived, data
      FROM reports
      WHERE 1=1
    `;
    const bind: Record<string, string | number> = {};

    const type = query?.type as string | undefined;
    if (type) {
      sql += ' AND type = $type';
      bind.$type = type;
    }

    const read = query?.read as string | undefined;
    if (read === 'unread') {
      sql += ' AND is_read = 0';
    } else if (read === 'read') {
      sql += ' AND is_read = 1';
    }

    sql += ' ORDER BY timestamp DESC LIMIT 500';

    return database.selectObjects({
      sql,
      ...(Object.keys(bind).length > 0 ? { bind } : {}),
      schema: adminReportSchema,
    });
  },
);

// ─── World Wonders list for the WW tab ───

const adminWorldWonderSchema = z.strictObject({
  villageId: z.number(),
  ownerPlayerId: z.number().nullable(),
  ownerFactionId: z.string(),
  currentLevel: z.number(),
  startedAt: z.number(),
  villageName: z.string(),
  x: z.number(),
  y: z.number(),
});

export const adminGetWorldWonders = createController('/admin/world-wonders')(
  ({ database }) => {
    return database.selectObjects({
      sql: `
        SELECT ww.village_id AS villageId, ww.owner_player_id AS ownerPlayerId,
               ww.owner_faction_id AS ownerFactionId,
               ww.current_level AS currentLevel, ww.started_at AS startedAt,
               v.name AS villageName, t.x, t.y
        FROM world_wonders ww
        JOIN villages v ON v.id = ww.village_id
        JOIN tiles t ON t.id = v.tile_id
        ORDER BY ww.village_id
      `,
      schema: adminWorldWonderSchema,
    });
  },
);

// ─── Unit catalogue for troop management dropdowns ───

const adminUnitSchema = z.strictObject({
  id: z.string(),
  tribe: z.string(),
  category: z.string(),
});

export const adminGetUnits = createController('/admin/units')(() => {
  return units.map((u) => ({
    id: u.id,
    tribe: u.tribe,
    category: u.category,
  })) satisfies z.infer<typeof adminUnitSchema>[];
});
