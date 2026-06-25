import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createController } from '../utils/controller';
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

const requireAdminMode = (database: DbFacade): boolean => {
  const enabled = database.selectValue({
    sql: 'SELECT is_admin_mode_enabled FROM developer_settings LIMIT 1',
    schema: z.number(),
  });
  return enabled === 1;
};

const success = (message?: string, data?: unknown) => ({
  success: true as const,
  message,
  data,
});

const failure = (message: string) => ({
  success: false as const,
  message,
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
  const village = database.selectObject({
    sql: 'SELECT id, tile_id FROM villages WHERE id = $villageId',
    bind: { $villageId: parsed.villageId },
    schema: z.object({ id: z.number(), tile_id: z.number() }),
  });
  if (!village) {
    return failure('Village not found');
  }

  for (const troop of parsed.troops) {
    database.exec({
      sql: `INSERT INTO troops (tile_id, source_tile_id, unit_id, amount)
            VALUES ($tileId, $tileId, $unitId, $amount)
            ON CONFLICT(tile_id, source_tile_id, unit_id) DO UPDATE SET amount = amount + $amount`,
      bind: {
        $tileId: village.tile_id,
        $unitId: troop.unitId,
        $amount: troop.amount,
      },
    });
  }

  return success(`Spawned troops in village ${parsed.villageId}`);
});

export const adminRemoveTroops = createController(
  '/admin/remove-troops',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminRemoveTroopsSchema.parse(body);
  const village = database.selectObject({
    sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
    bind: { $villageId: parsed.villageId },
    schema: z.object({ tile_id: z.number() }),
  });
  if (!village) {
    return failure('Village not found');
  }

  for (const troop of parsed.troops) {
    database.exec({
      sql: `UPDATE troops SET amount = MAX(0, amount - $amount)
            WHERE tile_id = $tileId AND source_tile_id = $tileId AND unit_id = $unitId`,
      bind: {
        $tileId: village.tile_id,
        $unitId: troop.unitId,
        $amount: troop.amount,
      },
    });
  }

  return success(`Removed troops from village ${parsed.villageId}`);
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
  database.exec({
    sql: 'UPDATE resource_fields SET amount = $amount WHERE village_id = $villageId AND resource = $resource',
    bind: { $villageId: villageId, $resource: 'wood', $amount: lumber },
  });
  database.exec({
    sql: 'UPDATE resource_fields SET amount = $amount WHERE village_id = $villageId AND resource = $resource',
    bind: { $villageId: villageId, $resource: 'clay', $amount: clay },
  });
  database.exec({
    sql: 'UPDATE resource_fields SET amount = $amount WHERE village_id = $villageId AND resource = $resource',
    bind: { $villageId: villageId, $resource: 'iron', $amount: iron },
  });
  database.exec({
    sql: 'UPDATE resource_fields SET amount = $amount WHERE village_id = $villageId AND resource = $resource',
    bind: { $villageId: villageId, $resource: 'wheat', $amount: crop },
  });

  return success(`Set resources for village ${villageId}`);
});

export const adminAddResources = createController(
  '/admin/add-resources',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminAddResourcesSchema.parse(body);
  const resources = [
    { resource: 'wood', amount: parsed.lumber },
    { resource: 'clay', amount: parsed.clay },
    { resource: 'iron', amount: parsed.iron },
    { resource: 'wheat', amount: parsed.crop },
  ];

  for (const r of resources) {
    if (r.amount !== 0) {
      database.exec({
        sql: 'UPDATE resource_fields SET amount = amount + $amount WHERE village_id = $villageId AND resource = $resource',
        bind: {
          $villageId: parsed.villageId,
          $resource: r.resource,
          $amount: r.amount,
        },
      });
    }
  }

  return success(`Added resources to village ${parsed.villageId}`);
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
    sql: 'UPDATE building_fields SET level = $level WHERE village_id = $villageId AND id = $fieldId',
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
    sql: 'UPDATE building_fields SET level = $level WHERE village_id = $villageId AND id = $fieldId',
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

  const newExp = currentExp + 1000 * parsed.levels;
  database.exec({
    sql: 'UPDATE heroes SET experience = $exp WHERE id = $heroId',
    bind: { $heroId: parsed.heroId, $exp: newExp },
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

  const tile = database.selectObject({
    sql: 'SELECT id FROM tiles WHERE x = $x AND y = $y',
    bind: { $x: parsed.x, $y: parsed.y },
    schema: z.object({ id: z.number() }),
  });
  if (!tile) {
    return failure('Tile not found');
  }

  const existing = database.selectValue({
    sql: 'SELECT id FROM villages WHERE tile_id = $tileId',
    bind: { $tileId: tile.id },
    schema: z.number(),
  });
  if (existing) {
    return failure('Tile is already occupied');
  }

  database.exec({
    sql: `INSERT INTO players (faction_id, name, tribe_id)
          SELECT fi.id, 'Natar Village', 7 FROM faction_ids fi WHERE fi.faction = 'natars'`,
  });
  const npcPlayerId = database.selectValue({
    sql: 'SELECT id FROM players ORDER BY id DESC LIMIT 1',
    schema: z.number(),
  });
  if (!npcPlayerId) {
    return failure('Failed to create NPC player');
  }

  database.exec({
    sql: `INSERT INTO villages (player_id, tile_id, name, population)
          VALUES ($playerId, $tileId, 'Natar Village', 100)`,
    bind: { $playerId: npcPlayerId, $tileId: tile.id },
  });
  const villageId = database.selectValue({
    sql: 'SELECT id FROM villages ORDER BY id DESC LIMIT 1',
    schema: z.number(),
  });
  if (!villageId) {
    return failure('Failed to create village');
  }

  database.exec({
    sql: `INSERT INTO natar_villages (village_id, server_slug, construction_plan_available)
          VALUES ($villageId, 'default', 1)`,
    bind: { $villageId: villageId },
  });

  database.exec({
    sql: `INSERT INTO npc_village_state (village_id, faction_key, aggression_level)
          VALUES ($villageId, 'natars', 0)`,
    bind: { $villageId: villageId },
  });

  return success(`Created Natar village at (${parsed.x}, ${parsed.y})`, {
    villageId,
  });
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
  const village = database.selectObject({
    sql: 'SELECT id, player_id FROM villages WHERE id = $villageId',
    bind: { $villageId: parsed.villageId },
    schema: z.object({ id: z.number(), player_id: z.number() }),
  });
  if (!village) {
    return failure('Village not found');
  }

  const existing = database.selectValue({
    sql: 'SELECT village_id FROM world_wonders WHERE village_id = $villageId',
    bind: { $villageId: parsed.villageId },
    schema: z.number(),
  });
  if (existing) {
    return failure('World Wonder already exists for this village');
  }

  const hero = database.selectObject({
    sql: 'SELECT id FROM heroes WHERE player_id = $playerId LIMIT 1',
    bind: { $playerId: PLAYER_ID },
    schema: z.object({ id: z.number() }),
  });
  if (hero) {
    grantConstructionPlan(database, hero.id);
  }

  const now = Date.now();
  database.exec({
    sql: `INSERT INTO world_wonders (village_id, owner_player_id, owner_faction_id, current_level, started_at)
          VALUES ($villageId, $playerId, 'player', 0, $now)`,
    bind: { $villageId: parsed.villageId, $playerId: PLAYER_ID, $now: now },
  });

  database.exec({
    sql: 'UPDATE villages SET is_world_wonder_village = 1, world_wonder_level = 0 WHERE id = $villageId',
    bind: { $villageId: parsed.villageId },
  });

  return success(`Started World Wonder in village ${parsed.villageId}`);
});

export const adminSetWorldWonderLevel = createController(
  '/admin/set-world-wonder-level',
  'post',
)(({ database, body }) => {
  if (!requireAdminMode(database)) {
    return failure('Admin mode is not enabled');
  }

  const parsed = adminSetWorldWonderLevelSchema.parse(body);
  const ww = database.selectValue({
    sql: 'SELECT village_id FROM world_wonders WHERE village_id = $villageId',
    bind: { $villageId: parsed.villageId },
    schema: z.number(),
  });
  if (!ww) {
    return failure('No World Wonder found for this village');
  }

  database.exec({
    sql: 'UPDATE world_wonders SET current_level = $level WHERE village_id = $villageId',
    bind: { $villageId: parsed.villageId, $level: parsed.level },
  });
  database.exec({
    sql: 'UPDATE villages SET world_wonder_level = $level WHERE id = $villageId',
    bind: { $villageId: parsed.villageId, $level: parsed.level },
  });

  return success(
    `Set World Wonder in village ${parsed.villageId} to level ${parsed.level}`,
  );
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
  const winnerPlayerId = parsed.winnerType === 'player' ? PLAYER_ID : 0;
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
  database.exec({
    sql: 'DELETE FROM events WHERE id = $id AND resolved_at IS NULL',
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
  const village = database.selectObject({
    sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
    bind: { $villageId: parsed.villageId },
    schema: z.object({ tile_id: z.number() }),
  });
  if (!village) {
    return failure('Village not found');
  }

  const targetTile = database.selectObject({
    sql: 'SELECT id FROM tiles WHERE x = $x AND y = $y',
    bind: { $x: parsed.x, $y: parsed.y },
    schema: z.object({ id: z.number() }),
  });
  if (!targetTile) {
    return failure('Target tile not found');
  }

  const occupied = database.selectValue({
    sql: 'SELECT id FROM villages WHERE tile_id = $tileId',
    bind: { $tileId: targetTile.id },
    schema: z.number(),
  });
  if (occupied) {
    return failure('Target tile is already occupied');
  }

  database.exec({
    sql: 'UPDATE villages SET tile_id = $newTileId WHERE id = $villageId',
    bind: { $villageId: parsed.villageId, $newTileId: targetTile.id },
  });

  return success(
    `Teleported village ${parsed.villageId} to (${parsed.x}, ${parsed.y})`,
  );
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
    'Events resolving after server end',
    'warning',
    'SELECT COUNT(*) FROM events WHERE resolved_at IS NULL AND (SELECT ended_at FROM servers LIMIT 1) IS NOT NULL',
  );
  runCheck(
    'Natar villages with has_plan but plan unavailable',
    'warning',
    `SELECT COUNT(*) FROM npc_village_state nvs
     JOIN natar_villages nv ON nv.village_id = nvs.village_id
     WHERE nvs.has_plan = 1 AND nv.construction_plan_available = 0`,
  );
  runCheck(
    'Retaliation queue entries for Natars',
    'error',
    "SELECT COUNT(*) FROM npc_retaliation_queue WHERE faction_key = 'natars'",
  );
  runCheck(
    'Duplicate WW per player',
    'error',
    'SELECT COUNT(*) FROM (SELECT owner_player_id, COUNT(*) as cnt FROM world_wonders WHERE owner_player_id IS NOT NULL GROUP BY owner_player_id HAVING cnt > 1)',
  );
  runCheck(
    'Villages with negative resources',
    'error',
    'SELECT COUNT(*) FROM resource_fields WHERE amount < 0',
  );
  runCheck(
    'Troops with negative amounts',
    'error',
    'SELECT COUNT(*) FROM troops WHERE amount < 0',
  );

  return success(undefined, { checks });
});
