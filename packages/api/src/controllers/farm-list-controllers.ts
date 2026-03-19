import { z } from 'zod';
import { createController } from '../utils/controller';
import {
  farmListSchema,
  farmListTileSchema,
} from './schemas/farm-list-schemas';
import { createEvents } from './utils/create-event';

export const getFarmLists = createController('/players/:playerId/farm-lists')(
  ({ database, path: { playerId } }) => {
    return database.selectObjects({
      sql: 'SELECT id, name FROM farm_lists WHERE player_id = $player_id',
      bind: { $player_id: playerId },
      schema: farmListSchema,
    });
  },
);

export const createFarmList = createController(
  '/players/:playerId/farm-lists',
  'post',
)(({ database, path: { playerId }, body: { name } }) => {
  database.exec({
    sql: 'INSERT INTO farm_lists (player_id, name) VALUES ($player_id, $name)',
    bind: { $player_id: playerId, $name: name },
  });
});

export const getFarmList = createController('/farm-lists/:farmListId')(
  ({ database, path: { farmListId } }) => {
    const farmList = database.selectObject({
      sql: 'SELECT id, name FROM farm_lists WHERE id = $farmListId',
      bind: { $farmListId: farmListId },
      schema: farmListSchema,
    })!;

    const tiles = database.selectObjects({
      sql: 'SELECT tile_id, troops_meta FROM farm_list_tiles WHERE farm_list_id = $farmListId',
      bind: { $farmListId: farmListId },
      schema: farmListTileSchema,
    });

    return {
      ...farmList,
      tiles,
    };
  },
);

export const deleteFarmList = createController(
  '/farm-lists/:farmListId',
  'delete',
)(({ database, path: { farmListId } }) => {
  database.exec({
    sql: 'DELETE FROM farm_lists WHERE id = $farmListId',
    bind: { $farmListId: farmListId },
  });
});

export const addTileToFarmList = createController(
  '/farm-lists/:farmListId/tiles',
  'post',
)(({ database, path: { farmListId }, body: { tileId, troops } }) => {
  database.transaction(() => {
    const count = database.selectValue({
      sql: 'SELECT COUNT(*) FROM farm_list_tiles WHERE farm_list_id = $farmListId',
      bind: { $farmListId: farmListId },
      schema: z.number(),
    })!;

    if (count >= 100) {
      throw new Error('Farm list cannot have more than 100 tiles');
    }

    database.exec({
      sql: 'INSERT OR REPLACE INTO farm_list_tiles (farm_list_id, tile_id, troops_meta) VALUES ($farmListId, $tile_id, $troops_meta)',
      bind: {
        $farmListId: farmListId,
        $tile_id: tileId,
        $troops_meta: troops ? JSON.stringify(troops) : null,
      },
    });
  });
});

export const raidFarmList = createController(
  '/villages/:villageId/farm-lists/:farmListId/raid',
  'post',
)(({ database, path: { villageId, farmListId } }) => {
  const tiles = database.selectObjects({
    sql: 'SELECT tile_id, troops_meta FROM farm_list_tiles WHERE farm_list_id = $farmListId',
    bind: { $farmListId: farmListId },
    schema: farmListTileSchema,
  });

  database.transaction(() => {
    for (const { tileId, troops } of tiles) {
      if (troops.length === 0) {
        continue;
      }

      const targetVillage = database.selectObject({
        sql: 'SELECT id FROM villages WHERE tile_id = $tileId',
        bind: { $tileId: tileId },
        schema: z.object({ id: z.number() }),
      });

      if (!targetVillage) {
        continue;
      }

      const sourceTileIdQuery = database.selectObject({
        sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
        bind: { $villageId: villageId },
        schema: z.object({ tile_id: z.number() }),
      });

      if (!sourceTileIdQuery) {
        continue;
      }

      const fullTroops = troops.map((t) => ({
        ...t,
        tileId: sourceTileIdQuery.tile_id,
        source: sourceTileIdQuery.tile_id,
      }));

      try {
        createEvents(database, {
          type: 'troopMovementRaid',
          villageId,
          targetId: targetVillage.id,
          troops: fullTroops,
        });
      } catch (e) {
        // Skip farms that can't be raided (e.g. not enough troops)
        console.error(`Failed to raid tile ${tileId}:`, e);
      }
    }
  });
});

export const raidFarmTile = createController(
  '/villages/:villageId/farm-lists/:farmListId/tiles/:tileId/raid',
  'post',
)(({ database, path: { villageId, farmListId, tileId } }) => {
  const tile = database.selectObject({
    sql: 'SELECT tile_id, troops_meta FROM farm_list_tiles WHERE farm_list_id = $farmListId AND tile_id = $tileId',
    bind: { $farmListId: farmListId, $tileId: tileId },
    schema: farmListTileSchema,
  });

  if (!tile) {
    throw new Error('Farm tile not found');
  }

  const { troops } = tile;
  if (troops.length === 0) {
    throw new Error('No troops assigned to this farm');
  }

  database.transaction(() => {
    const targetVillage = database.selectObject({
      sql: 'SELECT id FROM villages WHERE tile_id = $tileId',
      bind: { $tileId: tileId },
      schema: z.object({ id: z.number() }),
    });

    if (!targetVillage) {
      throw new Error('Target village not found');
    }

    const sourceTileIdQuery = database.selectObject({
      sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
      bind: { $villageId: villageId },
      schema: z.object({ tile_id: z.number() }),
    });

    if (!sourceTileIdQuery) {
      throw new Error('Source village not found');
    }

    const fullTroops = troops.map((t) => ({
      ...t,
      tileId: sourceTileIdQuery.tile_id,
      source: sourceTileIdQuery.tile_id,
    }));

    createEvents(database, {
      type: 'troopMovementRaid',
      villageId,
      targetId: targetVillage.id,
      troops: fullTroops,
    });
  });
});

export const removeTileFromFarmList = createController(
  '/farm-lists/:farmListId/tiles/:tileId',
  'delete',
)(({ database, path: { farmListId, tileId } }) => {
  database.exec({
    sql: 'DELETE FROM farm_list_tiles WHERE farm_list_id = $farmListId AND tile_id = $tile_id',
    bind: { $farmListId: farmListId, $tile_id: tileId },
  });
});

export const renameFarmList = createController(
  '/farm-lists/:farmListId/rename',
  'patch',
)(({ database, path: { farmListId }, body: { name } }) => {
  database.exec({
    sql: 'UPDATE farm_lists SET name = $name WHERE id = $farmListId',
    bind: { $name: name, $farmListId: farmListId },
  });
});
