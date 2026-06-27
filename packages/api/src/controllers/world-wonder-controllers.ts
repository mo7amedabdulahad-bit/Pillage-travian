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
 * POST /villages/:villageId/world-wonder/upgrade
 * Queues the next WW level upgrade.
 *
 * Players conquer Natar WW villages, then upgrade the WW.
 * Requires: active construction plan (hero inventory) for L0→L1.
 */
export const upgradeWorldWonder = makeWWController(
  '/villages/:villageId/world-wonder/upgrade',
  'post',
  (database, { path }) => {
    const villageId = Number(path.villageId);

    database.transaction((db: any) => {
      const ww = db.selectObject({
        sql: `
          SELECT ww.current_level, ww.owner_player_id, ww.owner_faction_id
          FROM world_wonders ww
          WHERE ww.village_id = $villageId AND ww.owner_player_id = $playerId
        `,
        bind: { $villageId: villageId, $playerId: PLAYER_ID },
        schema: z.strictObject({
          current_level: z.number(),
          owner_player_id: z.number(),
          owner_faction_id: z.string(),
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

      // For L0→L1 upgrade: require a construction plan in hero inventory
      if (ww.current_level === 0) {
        const heroRow = db.selectObject({
          sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
          bind: { $playerId: PLAYER_ID },
          schema: z.strictObject({ id: z.number() }),
        });

        if (!heroRow || !hasConstructionPlan(db, heroRow.id)) {
          throw new Error(
            'A Construction Plan is required to upgrade the World Wonder from Level 0 to Level 1',
          );
        }
      }

      // For L50+ upgrades: require two plans (yours + alliance member's)
      if (ww.current_level >= 49) {
        const heroRow = db.selectObject({
          sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
          bind: { $playerId: PLAYER_ID },
          schema: z.strictObject({ id: z.number() }),
        });

        if (!heroRow || !hasConstructionPlan(db, heroRow.id)) {
          throw new Error(
            'A Construction Plan is required for Level 50+ upgrades',
          );
        }

        // Check for alliance member's plan (simplified: check if any alliance member has a plan)
        // TODO: Implement proper alliance plan sharing for L50+
      }

      createEvents<'worldWonderUpgrade'>(db, {
        villageId,
        type: 'worldWonderUpgrade',
        targetLevel: nextLevel,
        ownerPlayerId: PLAYER_ID,
        ownerFactionId: ww.owner_faction_id,
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

    // WW can only be renamed before level 11
    const ww = database.selectObject({
      sql: 'SELECT current_level FROM world_wonders WHERE village_id = $villageId AND owner_player_id = $playerId',
      bind: { $villageId: villageId, $playerId: PLAYER_ID },
      schema: z.strictObject({ current_level: z.number() }),
    });

    if (ww && ww.current_level >= 11) {
      throw new Error('World Wonder cannot be renamed after Level 11');
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

    const ww = database.selectObject({
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
    });

    if (!ww) {
      return null;
    }

    // Compute cannotBeUpgradedReason
    let cannotBeUpgradedReason: string | null = null;

    if (ww.currentLevel >= 20) {
      cannotBeUpgradedReason = 'World Wonder has reached maximum level (20)';
    } else if (ww.currentLevel === 0) {
      // Check if player has construction plan for L0→L1
      const heroRow = database.selectObject({
        sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
        bind: { $playerId: PLAYER_ID },
        schema: z.strictObject({ id: z.number() }),
      });
      if (!heroRow || !hasConstructionPlan(database, heroRow.id)) {
        cannotBeUpgradedReason =
          'A Construction Plan is required to upgrade from Level 0 to Level 1';
      }
    }

    // Check if this is a Natar-owned WW (not yet conquered)
    const isNatarOwned = ww.ownerFactionId === 'natars';

    return {
      ...ww,
      cannotBeUpgradedReason,
      isNatarOwned,
    };
  },
);

/**
 * GET /world-wonders/leaderboard
 * Returns all World Wonders on the server (player + NPC factions).
 */
export const getWorldWonderLeaderboard = makeWWController(
  '/world-wonders/leaderboard',
  'get',
  (database) => {
    return database.selectObjects({
      sql: `
        SELECT
          ww.village_id AS villageId,
          ww.owner_player_id AS ownerPlayerId,
          ww.owner_faction_id AS ownerFactionId,
          ww.current_level AS currentLevel,
          ww.started_at AS startedAt,
          ww.name,
          v.name AS villageName,
          v.is_world_wonder_village AS isWWVillage,
          t.x,
          t.y
        FROM world_wonders ww
        JOIN villages v ON v.id = ww.village_id
        JOIN tiles t ON t.id = v.tile_id
        ORDER BY ww.current_level DESC, ww.started_at ASC
      `,
      schema: z.strictObject({
        villageId: z.number(),
        ownerPlayerId: z.number().nullable(),
        ownerFactionId: z.string(),
        currentLevel: z.number(),
        startedAt: z.number(),
        name: z.string().nullable(),
        villageName: z.string(),
        isWWVillage: z.number(),
        x: z.number(),
        y: z.number(),
      }),
    });
  },
);
