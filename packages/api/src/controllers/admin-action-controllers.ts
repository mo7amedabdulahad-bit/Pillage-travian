import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateHeroLevel } from '@pillage-first/game-assets/utils/hero';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createController } from '../utils/controller';
import { addVillageResourcesAt } from '../utils/village';
import { grantConstructionPlan } from './hero-controllers';
import { reconcileNpcBrain } from './resolvers/utils/npc-brain/simulate-elapsed-time';
import { endServer } from './resolvers/world-wonder-resolvers';
import {
  adminAddResourcesSchema,
  adminCancelEventSchema,
  adminCancelRetaliationSchema,
  adminCreateNatarVillageSchema,
  adminDeleteVillageSchema,
  adminDowngradeBuildingSchema,
  adminEndServerSchema,
  adminGrantConstructionPlanSchema,
  adminLevelUpHeroSchema,
  adminRemoveTroopsSchema,
  adminRenameVillageSchema,
  adminSetGameSpeedSchema,
  adminSetHeroHealthSchema,
  adminSetNpcAggressionSchema,
  adminSetResourcesSchema,
  adminSetWorldWonderLevelSchema,
  adminSpawnHeroItemSchema,
  adminSpawnTroopsSchema,
  adminStartWorldWonderSchema,
  adminTeleportVillageSchema,
  adminUpgradeBuildingSchema,
} from './schemas/admin-action-schemas';

type AdminResult = {
  success: boolean;
  message?: string;
  data?: unknown;
};

const requireAdminMode = (database: DbFacade): boolean => {
  const enabled = database.selectValue({
    sql: 'SELECT is_admin_mode_enabled FROM developer_settings LIMIT 1',
    schema: z.number(),
  });
  return enabled === 1;
};

const success = (message?: string, data?: unknown): AdminResult => ({
  success: true,
  message,
  data,
});

const failure = (message: string): AdminResult => ({
  success: false,
  message,
});

const getResourceSitesTileId = (
  database: DbFacade,
  villageId: number,
): number | undefined =>
  database.selectValue({
    sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
    bind: { $villageId: villageId },
    schema: z.number(),
  });

// ─── Troop Management ───

export const adminSpawnTroops = createController(
  '/admin/spawn-troops',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminSpawnTroopsSchema.parse(body);
  let result = success(`Spawned troops in village ${parsed.villageId}`);

  database.transaction((db) => {
    const village = db.selectObject({
      sql: 'SELECT id, tile_id FROM villages WHERE id = $villageId',
      bind: { $villageId: parsed.villageId },
      schema: z.object({ id: z.number(), tile_id: z.number() }),
    });
    if (!village) {
      result = failure('Village not found');
      return;
    }

    for (const troop of parsed.troops) {
      const unitIdRow = db.selectValue({
        sql: 'SELECT id FROM unit_ids WHERE unit = $unit',
        bind: { $unit: troop.unitId },
        schema: z.number(),
      });
      if (!unitIdRow) {
        result = failure(`Unknown unit: ${troop.unitId}`);
        return;
      }
      db.exec({
        sql: `INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
              VALUES ($tileId, $tileId, $unitId, $amount)
              ON CONFLICT(tile_id, source_tile_id, unit_id)
              DO UPDATE SET amount = amount + $amount`,
        bind: {
          $tileId: village.tile_id,
          $unitId: unitIdRow,
          $amount: troop.amount,
        },
      });
    }
  });

  return result;
});

export const adminRemoveTroops = createController(
  '/admin/remove-troops',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminRemoveTroopsSchema.parse(body);
  let result = success(`Removed troops from village ${parsed.villageId}`);

  database.transaction((db) => {
    const village = db.selectObject({
      sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
      bind: { $villageId: parsed.villageId },
      schema: z.object({ tile_id: z.number() }),
    });
    if (!village) {
      result = failure('Village not found');
      return;
    }

    for (const troop of parsed.troops) {
      const unitIdRow = db.selectValue({
        sql: 'SELECT id FROM unit_ids WHERE unit = $unit',
        bind: { $unit: troop.unitId },
        schema: z.number(),
      });
      if (!unitIdRow) {
        result = failure(`Unknown unit: ${troop.unitId}`);
        return;
      }
      // troops has CHECK(amount > 0); can't set to 0, so delete rows we fully drain.
      db.exec({
        sql: `DELETE FROM troops
              WHERE tile_id = $tileId AND source_tile_id = $tileId
                AND unit_id = $unitId AND amount <= $amount`,
        bind: {
          $tileId: village.tile_id,
          $unitId: unitIdRow,
          $amount: troop.amount,
        },
      });
      db.exec({
        sql: `UPDATE troops SET amount = amount - $amount
              WHERE tile_id = $tileId AND source_tile_id = $tileId
                AND unit_id = $unitId AND amount > $amount`,
        bind: {
          $tileId: village.tile_id,
          $unitId: unitIdRow,
          $amount: troop.amount,
        },
      });
    }
  });

  return result;
});

// ─── Resource Management ───

export const adminSetResources = createController(
  '/admin/set-resources',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminSetResourcesSchema.parse(body);
  const { villageId, lumber, clay, iron, crop } = parsed;

  let result = success(`Set resources for village ${villageId}`);
  database.transaction((db) => {
    const tileId = getResourceSitesTileId(db, villageId);
    if (!tileId) {
      result = failure('Village not found');
      return;
    }
    db.exec({
      sql: `UPDATE resource_sites
            SET wood = $wood, clay = $clay, iron = $iron, wheat = $wheat,
                updated_at = $now
            WHERE tile_id = $tileId`,
      bind: {
        $tileId: tileId,
        $wood: lumber,
        $clay: clay,
        $iron: iron,
        $wheat: crop,
        $now: Date.now(),
      },
    });
  });
  return result;
});

export const adminAddResources = createController(
  '/admin/add-resources',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminAddResourcesSchema.parse(body);
  let result = success(`Added resources to village ${parsed.villageId}`);
  database.transaction((db) => {
    if (!getResourceSitesTileId(db, parsed.villageId)) {
      result = failure('Village not found');
      return;
    }
    addVillageResourcesAt(db, parsed.villageId, Date.now(), [
      parsed.lumber,
      parsed.clay,
      parsed.iron,
      parsed.crop,
    ]);
  });
  return result;
});

// ─── Building Management ───

export const adminUpgradeBuilding = createController(
  '/admin/upgrade-building',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminUpgradeBuildingSchema.parse(body);
  database.exec({
    sql: `UPDATE building_fields SET level = $level
          WHERE village_id = $villageId AND field_id = $fieldId`,
    bind: {
      $villageId: parsed.villageId,
      $fieldId: parsed.fieldId,
      $level: parsed.targetLevel,
    },
  });

  return success(
    `Upgraded building in village ${parsed.villageId} to level ${parsed.targetLevel}`,
  );
});

export const adminDowngradeBuilding = createController(
  '/admin/downgrade-building',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminDowngradeBuildingSchema.parse(body);
  database.exec({
    sql: `UPDATE building_fields SET level = $level
          WHERE village_id = $villageId AND field_id = $fieldId`,
    bind: {
      $villageId: parsed.villageId,
      $fieldId: parsed.fieldId,
      $level: parsed.targetLevel,
    },
  });

  return success(
    `Downgraded building in village ${parsed.villageId} to level ${parsed.targetLevel}`,
  );
});

// ─── Hero Management ───

export const adminSpawnHeroItem = createController(
  '/admin/spawn-hero-item',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminSpawnHeroItemSchema.parse(body);
  database.exec({
    sql: `INSERT INTO hero_inventory (hero_id, item_id, amount)
          VALUES ($heroId, $itemId, $amount)
          ON CONFLICT(hero_id, item_id) DO UPDATE SET amount = amount + $amount`,
    bind: {
      $heroId: parsed.heroId,
      $itemId: parsed.itemId,
      $amount: parsed.amount,
    },
  });

  return success(
    `Spawned ${parsed.amount}x item ${parsed.itemId} for hero ${parsed.heroId}`,
  );
});

export const adminSetHeroHealth = createController(
  '/admin/set-hero-health',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminSetHeroHealthSchema.parse(body);
  database.exec({
    sql: 'UPDATE heroes SET health = $health WHERE id = $heroId',
    bind: { $heroId: parsed.heroId, $health: parsed.health },
  });

  return success(`Set hero ${parsed.heroId} health to ${parsed.health}`);
});

export const adminLevelUpHero = createController(
  '/admin/level-up-hero',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminLevelUpHeroSchema.parse(body);
  const currentExp = database.selectValue({
    sql: 'SELECT experience FROM heroes WHERE id = $heroId',
    bind: { $heroId: parsed.heroId },
    schema: z.number(),
  });

  if (currentExp === null || currentExp === undefined) {
    return failure('Hero not found');
  }

  // Level is derived from experience via calculateHeroLevel. To advance N
  // levels, set experience to the threshold of (currentLevel + N).
  const { level: currentLevel } = calculateHeroLevel(currentExp);
  const targetLevel = currentLevel + parsed.levels;
  const targetExp = targetLevel * (targetLevel + 1) * 25;

  database.exec({
    sql: 'UPDATE heroes SET experience = $exp WHERE id = $heroId',
    bind: { $heroId: parsed.heroId, $exp: targetExp },
  });

  return success(`Leveled up hero ${parsed.heroId} by ${parsed.levels} levels`);
});

// ─── Natar Village Management ───

export const adminCreateNatarVillage = createController(
  '/admin/create-natar-village',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminCreateNatarVillageSchema.parse(body);
  let result = success('Created Natar village');
  let createdVillageId: number | undefined;

  database.transaction((db) => {
    const tile = db.selectObject({
      sql: 'SELECT id FROM tiles WHERE x = $x AND y = $y',
      bind: { $x: parsed.x, $y: parsed.y },
      schema: z.object({ id: z.number() }),
    });
    if (!tile) {
      result = failure('Tile not found');
      return;
    }

    const existing = db.selectValue({
      sql: 'SELECT id FROM villages WHERE tile_id = $tileId',
      bind: { $tileId: tile.id },
      schema: z.number(),
    });
    if (existing) {
      result = failure('Tile is already occupied');
      return;
    }

    const natarFactionId = db.selectValue({
      sql: `SELECT id FROM faction_ids WHERE faction = 'natars' LIMIT 1`,
      schema: z.number(),
    });
    if (!natarFactionId) {
      result = failure('Natars faction not configured');
      return;
    }

    db.exec({
      sql: `INSERT INTO players (faction_id, name, tribe_id)
            VALUES ($factionId, 'Natar Village', 7)`,
      bind: { $factionId: natarFactionId },
    });
    const npcPlayerId = db.selectValue({
      sql: 'SELECT last_insert_rowid()',
      schema: z.number(),
    });
    if (!npcPlayerId) {
      result = failure('Failed to create NPC player');
      return;
    }

    db.exec({
      sql: `INSERT INTO villages (player_id, tile_id, name, population)
            VALUES ($playerId, $tileId, 'Natar Village', 100)`,
      bind: { $playerId: npcPlayerId, $tileId: tile.id },
    });
    const villageId = db.selectValue({
      sql: 'SELECT last_insert_rowid()',
      schema: z.number(),
    });
    if (!villageId) {
      result = failure('Failed to create village');
      return;
    }
    createdVillageId = villageId;

    db.exec({
      sql: `INSERT INTO natar_villages (village_id, server_slug, construction_plan_available)
            VALUES ($villageId, 'default', 1)`,
      bind: { $villageId: villageId },
    });

    db.exec({
      sql: `INSERT INTO npc_village_state (village_id, faction_key, aggression_level)
            VALUES ($villageId, 'natars', 0)`,
      bind: { $villageId: villageId },
    });

    // Seed garrison troops if a garrison strength was requested.
    if (parsed.garrisonStrength > 0) {
      // Distribute the requested garrison across the standard Natar unit set.
      const garrisonUnits = [
        'PIKEMAN',
        'THORNED_WARRIOR',
        'GUARDSMAN',
        'AXERIDER',
        'NATARIAN_KNIGHT',
        'WAR_ELEPHANT',
        'BALLISTA',
        'NATARIAN_EMPEROR',
      ];
      const perUnit = Math.max(
        1,
        Math.floor(parsed.garrisonStrength / garrisonUnits.length),
      );
      for (const unit of garrisonUnits) {
        const unitIdRow = db.selectValue({
          sql: 'SELECT id FROM unit_ids WHERE unit = $unit',
          bind: { $unit: unit },
          schema: z.number(),
        });
        if (!unitIdRow) {
          continue;
        }
        db.exec({
          sql: `INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
                VALUES ($tileId, $tileId, $unitId, $amount)
                ON CONFLICT(tile_id, source_tile_id, unit_id)
                DO UPDATE SET amount = amount + $amount`,
          bind: {
            $tileId: tile.id,
            $unitId: unitIdRow,
            $amount: perUnit,
          },
        });
      }
      // Reflect garrison strength into npc_village_state.
      db.exec({
        sql: 'UPDATE npc_village_state SET garrison_power = $power WHERE village_id = $villageId',
        bind: { $power: perUnit * garrisonUnits.length, $villageId: villageId },
      });
    }

    result = success(`Created Natar village at (${parsed.x}, ${parsed.y})`, {
      villageId,
    });
  });

  // Surface the created id via the success data even if loop vars cleared.
  if (createdVillageId && result.success) {
    return success(result.message, { villageId: createdVillageId });
  }
  return result;
});

// ─── Construction Plan ───

export const adminGrantConstructionPlan = createController(
  '/admin/grant-construction-plan',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminGrantConstructionPlanSchema.parse(body);
  const granted = grantConstructionPlan(database, parsed.heroId);
  if (!granted) {
    return failure('Hero already has a Construction Plan');
  }

  return success(`Granted Construction Plan to hero ${parsed.heroId}`);
});

// ─── World Wonder Management ───

export const adminStartWorldWonder = createController(
  '/admin/start-world-wonder',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminStartWorldWonderSchema.parse(body);
  let result = success(`Started World Wonder in village ${parsed.villageId}`);

  database.transaction((db) => {
    const village = db.selectObject({
      sql: 'SELECT id, player_id FROM villages WHERE id = $villageId',
      bind: { $villageId: parsed.villageId },
      schema: z.object({ id: z.number(), player_id: z.number() }),
    });
    if (!village) {
      result = failure('Village not found');
      return;
    }

    const existing = db.selectValue({
      sql: 'SELECT village_id FROM world_wonders WHERE village_id = $villageId',
      bind: { $villageId: parsed.villageId },
      schema: z.number(),
    });
    if (existing) {
      result = failure('World Wonder already exists for this village');
      return;
    }

    // Bypass preconditions: ensure the player's hero holds a plan first.
    const hero = db.selectObject({
      sql: 'SELECT id FROM heroes WHERE player_id = $playerId LIMIT 1',
      bind: { $playerId: village.player_id },
      schema: z.object({ id: z.number() }),
    });
    if (hero) {
      grantConstructionPlan(db, hero.id);
    }

    const now = Date.now();
    db.exec({
      sql: `INSERT INTO world_wonders (village_id, owner_player_id, owner_faction_id, current_level, started_at)
            VALUES ($villageId, $playerId, 'player', 0, $now)`,
      bind: {
        $villageId: parsed.villageId,
        $playerId: village.player_id,
        $now: now,
      },
    });

    db.exec({
      sql: 'UPDATE villages SET is_world_wonder_village = 1, world_wonder_level = 0 WHERE id = $villageId',
      bind: { $villageId: parsed.villageId },
    });

    // Place the World Wonder building on slot 35
    const wwBuildingId = db.selectValue({
      sql: "SELECT id FROM building_ids WHERE building = 'WORLD_WONDER'",
      schema: z.number(),
    });
    if (wwBuildingId) {
      db.exec({
        sql: 'UPDATE building_fields SET building_id = $buildingId, level = 0 WHERE village_id = $villageId AND field_id = 35',
        bind: { $buildingId: wwBuildingId, $villageId: parsed.villageId },
      });
    }
  });

  return result;
});

export const adminSetWorldWonderLevel = createController(
  '/admin/set-world-wonder-level',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminSetWorldWonderLevelSchema.parse(body);
  let result = success(
    `Set World Wonder in village ${parsed.villageId} to level ${parsed.level}`,
  );

  database.transaction((db) => {
    const ww = db.selectValue({
      sql: 'SELECT village_id FROM world_wonders WHERE village_id = $villageId',
      bind: { $villageId: parsed.villageId },
      schema: z.number(),
    });
    if (!ww) {
      result = failure('No World Wonder found for this village');
      return;
    }
    db.exec({
      sql: 'UPDATE world_wonders SET current_level = $level WHERE village_id = $villageId',
      bind: { $villageId: parsed.villageId, $level: parsed.level },
    });
    db.exec({
      sql: 'UPDATE villages SET world_wonder_level = $level WHERE id = $villageId',
      bind: { $villageId: parsed.villageId, $level: parsed.level },
    });
  });

  return result;
});

// ─── Server Management ───

export const adminEndServer = createController(
  '/admin/end-server',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminEndServerSchema.parse(body);
  let winnerPlayerId: number = PLAYER_ID;
  if (parsed.winnerType === 'natars') {
    // Find a Natar-controlled player to mirror the natural endgame path.
    const natarPlayerId = database.selectValue({
      sql: `SELECT p.id FROM players p
            JOIN faction_ids fi ON fi.id = p.faction_id
            WHERE fi.faction = 'natars' LIMIT 1`,
      schema: z.number(),
    });
    winnerPlayerId = natarPlayerId ?? 0;
  }
  endServer(database, parsed.winnerType, winnerPlayerId, Date.now());

  return success(`Server ended. Winner: ${parsed.winnerType}`);
});

export const adminResetServerEnd = createController(
  '/admin/reset-server-end',
  'post',
)(({ database }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  database.exec({
    sql: 'UPDATE servers SET ended_at = NULL, winner_player_id = NULL, winner_type = NULL, win_condition_met_at = NULL',
  });

  return success('Server end has been reset');
});

// ─── NPC Brain ───

export const adminTriggerNpcBrainTick = createController(
  '/admin/trigger-npc-brain-tick',
  'post',
)(({ database }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const speed =
    database.selectValue({
      sql: 'SELECT speed FROM servers LIMIT 1',
      schema: z.number(),
    }) ?? 1;

  const result = reconcileNpcBrain(database, 0, speed);
  return success('NPC brain tick completed', result);
});

// ─── Game Settings ───

export const adminSetGameSpeed = createController(
  '/admin/set-game-speed',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminSetGameSpeedSchema.parse(body);
  database.exec({
    sql: 'UPDATE servers SET speed = $speed',
    bind: { $speed: parsed.speed },
  });

  return success(`Game speed set to ${parsed.speed}x`);
});

export const adminSetNpcAggression = createController(
  '/admin/set-npc-aggression',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminSetNpcAggressionSchema.parse(body);
  database.exec({
    sql: 'UPDATE npc_village_state SET aggression_level = $level WHERE village_id = $villageId',
    bind: { $villageId: parsed.villageId, $level: parsed.aggressionLevel },
  });

  return success(
    `Set NPC aggression for village ${parsed.villageId} to ${parsed.aggressionLevel}`,
  );
});

// ─── Retaliation Management ───

export const adminCancelRetaliation = createController(
  '/admin/cancel-retaliation',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminCancelRetaliationSchema.parse(body);
  database.exec({
    sql: 'DELETE FROM npc_retaliation_queue WHERE id = $id',
    bind: { $id: parsed.retaliationId },
  });

  return success(`Cancelled retaliation ${parsed.retaliationId}`);
});

// ─── Event Management ───

export const adminCancelEvent = createController(
  '/admin/cancel-event',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminCancelEventSchema.parse(body);
  // The events table has no resolved_at column; events are DELETEd after
  // resolution. Cancelling = removing the pending event so the scheduler
  // never picks it up (the plan's "leave rows for inspection" is already
  // how resolution works; cancelling is intentionally destructive).
  database.exec({
    sql: 'DELETE FROM events WHERE id = $id',
    bind: { $id: parsed.eventId },
  });

  return success(`Cancelled event ${parsed.eventId}`);
});

// ─── Village Management ───

export const adminTeleportVillage = createController(
  '/admin/teleport-village',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminTeleportVillageSchema.parse(body);
  let result = success(
    `Teleported village ${parsed.villageId} to (${parsed.x}, ${parsed.y})`,
  );

  database.transaction((db) => {
    const village = db.selectObject({
      sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
      bind: { $villageId: parsed.villageId },
      schema: z.object({ tile_id: z.number() }),
    });
    if (!village) {
      result = failure('Village not found');
      return;
    }

    const targetTile = db.selectObject({
      sql: 'SELECT id FROM tiles WHERE x = $x AND y = $y',
      bind: { $x: parsed.x, $y: parsed.y },
      schema: z.object({ id: z.number() }),
    });
    if (!targetTile) {
      result = failure('Target tile not found');
      return;
    }

    const occupied = db.selectValue({
      sql: 'SELECT id FROM villages WHERE tile_id = $tileId',
      bind: { $tileId: targetTile.id },
      schema: z.number(),
    });
    if (occupied) {
      result = failure('Target tile is already occupied');
      return;
    }

    db.exec({
      sql: 'UPDATE villages SET tile_id = $newTileId WHERE id = $villageId',
      bind: { $villageId: parsed.villageId, $newTileId: targetTile.id },
    });
  });

  return result;
});

export const adminRenameVillage = createController(
  '/admin/rename-village',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminRenameVillageSchema.parse(body);
  database.exec({
    sql: 'UPDATE villages SET name = $name WHERE id = $villageId',
    bind: { $villageId: parsed.villageId, $name: parsed.name },
  });

  return success(`Renamed village ${parsed.villageId} to "${parsed.name}"`);
});

export const adminDeleteVillage = createController(
  '/admin/delete-village',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminDeleteVillageSchema.parse(body);
  database.exec({
    sql: 'DELETE FROM villages WHERE id = $villageId',
    bind: { $villageId: parsed.villageId },
  });

  return success(`Deleted village ${parsed.villageId}`);
});

// ─── Integrity Report ───

export const adminGetIntegrityReport = createController(
  '/admin/integrity-report',
)(({ database }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const checks: Array<{ name: string; severity: string; count: number }> = [];

  const runCheck = (name: string, severity: string, sql: string) => {
    const count = database.selectValue({ sql, schema: z.number() }) ?? 0;
    if (count > 0) {
      checks.push({ name, severity, count });
    }
  };

  runCheck(
    'Orphaned npc_village_state',
    'error',
    'SELECT COUNT(*) FROM npc_village_state WHERE village_id NOT IN (SELECT id FROM villages)',
  );
  runCheck(
    'Natar villages with garrison_power = 0',
    'error',
    "SELECT COUNT(*) FROM npc_village_state WHERE faction_key = 'natars' AND garrison_power = 0",
  );
  runCheck(
    'World wonders with current_level > 20',
    'error',
    'SELECT COUNT(*) FROM world_wonders WHERE current_level > 20',
  );
  runCheck(
    'Pending events after server end',
    'warning',
    'SELECT COUNT(*) FROM events WHERE (SELECT ended_at FROM servers LIMIT 1) IS NOT NULL',
  );
  runCheck(
    'Natar villages with has_plan but plan unavailable',
    'warning',
    `SELECT COUNT(*) FROM npc_village_state nvs
     JOIN natar_villages nv ON nv.village_id = nvs.village_id
     WHERE nvs.has_plan = 1 AND nv.construction_plan_available = 0
       AND nv.is_ww_village = 0`,
  );
  runCheck(
    'NPC factions holding a plan but with no World Wonder',
    'info',
    `SELECT COUNT(DISTINCT nvs.faction_key) FROM npc_village_state nvs
     WHERE nvs.holds_plan = 1
       AND nvs.faction_key NOT IN (SELECT owner_faction_id FROM world_wonders)`,
  );
  runCheck(
    'Player villages flagged plan_held but no plan in inventory',
    'warning',
    `SELECT COUNT(*) FROM villages v
     WHERE v.construction_plan_held = 1 AND v.player_id = 1
       AND NOT EXISTS (
         SELECT 1 FROM hero_inventory hi
         JOIN heroes h ON h.id = hi.hero_id
         WHERE h.player_id = 1 AND hi.item_id = 200 AND hi.amount > 0
       )`,
  );
  runCheck(
    'Retaliation queue entries for Natars',
    'error',
    "SELECT COUNT(*) FROM npc_retaliation_queue WHERE faction_key = 'natars'",
  );
  runCheck(
    'Duplicate WW per player',
    'error',
    `SELECT COUNT(*) FROM (
      SELECT owner_player_id, COUNT(*) as cnt
      FROM world_wonders
      WHERE owner_player_id IS NOT NULL
        AND owner_faction_id != 'natars'
      GROUP BY owner_player_id
      HAVING cnt > 1
    )`,
  );
  runCheck(
    'Villages with negative resources',
    'error',
    'SELECT COUNT(*) FROM resource_sites WHERE wood < 0 OR clay < 0 OR iron < 0 OR wheat < 0',
  );
  runCheck(
    'Troops with non-positive amounts',
    'error',
    'SELECT COUNT(*) FROM troops WHERE amount <= 0',
  );

  return success(undefined, { checks });
});
