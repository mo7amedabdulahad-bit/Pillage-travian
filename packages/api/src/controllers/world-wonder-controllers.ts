import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { triggerKick } from '../scheduler/scheduler-signal';
import { hasConstructionPlan } from './hero-controllers';
import { createEvents } from './utils/create-event';

// World Wonder paths are not yet in the OpenAPI schema, so controllers are
// built manually and cast to the Controller type. They are registered with
// `as any` in api-routes.ts.

const makeWWController = (
  path: string,
  method: string,
  fn: (database: any, args: any) => any,
): any => {
  return Object.assign(fn, { path, method });
};

/**
 * POST /villages/:villageId/world-wonder/start
 * Starts a World Wonder in a village that holds a Construction Plan.
 */
export const startWorldWonder = makeWWController(
  '/villages/:villageId/world-wonder/start',
  'post',
  (database, { path }) => {
    const villageId = Number(path.villageId);

    database.transaction((db: any) => {
      const village = db.selectObject({
        sql: 'SELECT player_id FROM villages WHERE id = $villageId',
        bind: { $villageId: villageId },
        schema: z.strictObject({ player_id: z.number() }),
      });

      if (!village || village.player_id !== PLAYER_ID) {
        throw new Error('Village does not belong to player');
      }

      const treasuryLevel =
        db.selectValue({
          sql: `
          SELECT COALESCE(bf.level, 0)
          FROM building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
          WHERE bf.village_id = $villageId AND bi.building = 'TREASURY'
        `,
          bind: { $villageId: villageId },
          schema: z.number(),
        }) ?? 0;

      if (treasuryLevel < 10) {
        throw new Error('Treasury must be at least level 10');
      }

      const existingWw =
        db.selectValue({
          sql: 'SELECT COUNT(*) FROM world_wonders WHERE owner_player_id = $playerId',
          bind: { $playerId: PLAYER_ID },
          schema: z.number(),
        }) ?? 0;

      if (existingWw > 0) {
        throw new Error('Player already owns a World Wonder');
      }

      const isWwVillage = db.selectValue({
        sql: 'SELECT is_world_wonder_village FROM villages WHERE id = $villageId',
        bind: { $villageId: villageId },
        schema: z.number(),
      });

      if (isWwVillage === 1) {
        throw new Error('Village is already a World Wonder village');
      }

      const heroRow = db.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: PLAYER_ID },
        schema: z.strictObject({ id: z.number() }),
      });

      if (!heroRow || !hasConstructionPlan(db, heroRow.id)) {
        throw new Error('Hero does not hold a Construction Plan');
      }

      // Look up the WORLD_WONDER building_id from the lookup table
      const wwBuildingId = db.selectValue({
        sql: "SELECT id FROM building_ids WHERE building = 'WORLD_WONDER'",
        schema: z.number(),
      });

      if (!wwBuildingId) {
        throw new Error('WORLD_WONDER building type not found');
      }

      db.exec({
        sql: `
          INSERT INTO world_wonders (village_id, owner_player_id, owner_faction_id, current_level, started_at)
          VALUES ($villageId, $playerId, 'player', 0, $startedAt)
        `,
        bind: {
          $villageId: villageId,
          $playerId: PLAYER_ID,
          $startedAt: Date.now(),
        },
      });

      db.exec({
        sql: 'UPDATE villages SET is_world_wonder_village = 1 WHERE id = $villageId',
        bind: { $villageId: villageId },
      });

      // Replace the wall (field 40) with the World Wonder building on the canvas
      db.exec({
        sql: 'UPDATE building_fields SET building_id = $buildingId, level = 0 WHERE village_id = $villageId AND field_id = 40',
        bind: { $buildingId: wwBuildingId, $villageId: villageId },
      });

      createEvents<'worldWonderUpgrade'>(db, {
        villageId,
        type: 'worldWonderUpgrade',
        targetLevel: 1,
        ownerPlayerId: PLAYER_ID,
        ownerFactionId: 'player',
      } as any);
    });

    triggerKick();

    return { ok: true };
  },
);

/**
 * POST /villages/:villageId/world-wonder/upgrade
 * Queues the next WW level upgrade.
 */
export const upgradeWorldWonder = makeWWController(
  '/villages/:villageId/world-wonder/upgrade',
  'post',
  (database, { path }) => {
    const villageId = Number(path.villageId);

    database.transaction((db: any) => {
      const ww = db.selectObject({
        sql: `
          SELECT ww.current_level, ww.owner_player_id
          FROM world_wonders ww
          WHERE ww.village_id = $villageId AND ww.owner_player_id = $playerId
        `,
        bind: { $villageId: villageId, $playerId: PLAYER_ID },
        schema: z.strictObject({
          current_level: z.number(),
          owner_player_id: z.number(),
        }),
      });

      if (!ww) {
        throw new Error(
          'No World Wonder found in this village for this player',
        );
      }

      if (ww.current_level >= 20) {
        throw new Error('World Wonder is already at maximum level');
      }

      const nextLevel = ww.current_level + 1;

      createEvents<'worldWonderUpgrade'>(db, {
        villageId,
        type: 'worldWonderUpgrade',
        targetLevel: nextLevel,
        ownerPlayerId: PLAYER_ID,
        ownerFactionId: 'player',
      } as any);
    });

    triggerKick();

    return { ok: true };
  },
);

/**
 * PATCH /villages/:villageId/world-wonder/name
 * Renames the World Wonder (max 25 chars).
 */
export const renameWorldWonder = makeWWController(
  '/villages/:villageId/world-wonder/name',
  'patch',
  (database, { path, body }) => {
    const villageId = Number(path.villageId);
    const { name } = body as { name: string };

    if (typeof name !== 'string' || name.length === 0 || name.length > 25) {
      throw new Error('Name must be between 1 and 25 characters');
    }

    database.exec({
      sql: 'UPDATE world_wonders SET name = $name WHERE village_id = $villageId AND owner_player_id = $playerId',
      bind: { $name: name, $villageId: villageId, $playerId: PLAYER_ID },
    });

    return { ok: true };
  },
);

/**
 * GET /villages/:villageId/world-wonder
 * Returns the WW state for a village.
 */
export const getWorldWonder = makeWWController(
  '/villages/:villageId/world-wonder',
  'get',
  (database, { path }) => {
    const villageId = Number(path.villageId);

    return (
      database.selectObject({
        sql: `
        SELECT
          ww.village_id AS villageId,
          ww.owner_player_id AS ownerPlayerId,
          ww.owner_faction_id AS ownerFactionId,
          ww.current_level AS currentLevel,
          ww.started_at AS startedAt,
          ww.name,
          ww.last_attack_at AS lastAttackAt,
          ww.next_attack_at AS nextAttackAt
        FROM world_wonders ww
        WHERE ww.village_id = $villageId
      `,
        bind: { $villageId: villageId },
        schema: z.object({
          villageId: z.number(),
          ownerPlayerId: z.number().nullable(),
          ownerFactionId: z.string(),
          currentLevel: z.number(),
          startedAt: z.number(),
          name: z.string().nullable(),
          lastAttackAt: z.number().nullable(),
          nextAttackAt: z.number().nullable(),
        }),
      }) ?? null
    );
  },
);
