import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { NatureUnitId } from '@pillage-first/types/models/unit';
import type { Resolver } from '../../types/resolver';
import { createEvents } from '../utils/create-event';

const OASIS_TICK_INTERVAL_MS = 5 * 60 * 1000;
const ANIMAL_RESPAWN_BASE_MS = 6 * 60 * 60 * 1000;

const oasisTroopCombinations: Record<string, [NatureUnitId, number, number][]> =
  {
    wood: [
      ['WILD_BOAR', 2, 11],
      ['WOLF', 2, 7],
      ['BEAR', 2, 5],
    ],
    clay: [
      ['RAT', 3, 12],
      ['SPIDER', 2, 10],
      ['WILD_BOAR', 2, 7],
    ],
    iron: [
      ['RAT', 2, 16],
      ['SPIDER', 2, 12],
      ['BAT', 2, 10],
    ],
    wheat: [
      ['RAT', 2, 20],
      ['SERPENT', 2, 18],
      ['TIGER', 2, 11],
      ['CROCODILE', 2, 9],
    ],
  };

export const oasisTickResolver: Resolver<
  GameEvent<'oasisLoyaltyRegeneration'>
> = (database, args) => {
  const { resolvesAt } = args;

  const serverSpeed = database.selectValue({
    sql: 'SELECT speed FROM servers LIMIT 1;',
    schema: z.number(),
  })!;

  database.transaction((db) => {
    db.exec({
      sql: `
        UPDATE oasis
        SET loyalty = MIN(100, loyalty + 1)
        WHERE village_id IS NOT NULL AND loyalty < 100;
      `,
    });

    const unoccupiedOases = db.selectObjects({
      sql: `
        SELECT
          o.tile_id AS tileId,
          o.animal_spawned_at AS animalSpawnedAt,
          GROUP_CONCAT(o.resource) AS resources
        FROM oasis o
        WHERE o.village_id IS NULL
        GROUP BY o.tile_id, o.animal_spawned_at;
      `,
      schema: z.strictObject({
        tileId: z.number(),
        animalSpawnedAt: z.number().nullable(),
        resources: z.string(),
      }),
    });

    for (const oasis of unoccupiedOases) {
      const animalCount = db.selectValue({
        sql: `
          SELECT COALESCE(SUM(amount), 0)
          FROM troops
          WHERE tile_id = $tile_id AND source_tile_id = $tile_id;
        `,
        bind: { $tile_id: oasis.tileId },
        schema: z.number(),
      })!;

      if (animalCount === 0) {
        const now = resolvesAt;
        const baseRespawnMs = ANIMAL_RESPAWN_BASE_MS / serverSpeed;

        if (oasis.animalSpawnedAt === null) {
          db.exec({
            sql: `
              UPDATE oasis
              SET animal_spawned_at = $spawned_at
              WHERE tile_id = $tile_id;
            `,
            bind: {
              $tile_id: oasis.tileId,
              $spawned_at: now,
            },
          });
        } else {
          const elapsed = now - oasis.animalSpawnedAt;

          if (elapsed >= baseRespawnMs) {
            const resources = oasis.resources.split(',');
            const primaryResource = resources.includes('wheat')
              ? (resources.find((r) => r !== 'wheat') ?? 'wheat')
              : resources[0];

            const troopOptions = oasisTroopCombinations[primaryResource] ?? [
              ['WOLF', 2, 7] as [NatureUnitId, number, number],
            ];

            const unitIdMap = new Map<string, number>();
            const unitIds = db.selectObjects({
              sql: 'SELECT id, unit FROM unit_ids',
              schema: z.strictObject({
                id: z.number(),
                unit: z.string(),
              }),
            });
            for (const uid of unitIds) {
              unitIdMap.set(uid.unit, uid.id);
            }

            const totalToSpawn = Math.floor(Math.random() * 3) + 5;
            let spawned = 0;

            for (const [unitId, minAmt, maxAmt] of troopOptions) {
              if (spawned >= totalToSpawn) {
                break;
              }

              const unitDbId = unitIdMap.get(unitId);
              if (!unitDbId) {
                continue;
              }

              const amount =
                Math.floor(Math.random() * (maxAmt - minAmt + 1)) + minAmt;
              const actualAmount = Math.min(amount, totalToSpawn - spawned);

              db.exec({
                sql: `
                  INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
                  VALUES ($unit_id, $amount, $tile_id, $source_tile_id);
                `,
                bind: {
                  $unit_id: unitDbId,
                  $amount: actualAmount,
                  $tile_id: oasis.tileId,
                  $source_tile_id: oasis.tileId,
                },
              });

              spawned += actualAmount;
            }

            db.exec({
              sql: `
                UPDATE oasis
                SET animal_spawned_at = $spawned_at
                WHERE tile_id = $tile_id;
              `,
              bind: {
                $tile_id: oasis.tileId,
                $spawned_at: now,
              },
            });
          }
        }
      }
    }
  });

  createEvents<'oasisLoyaltyRegeneration'>(database, {
    type: 'oasisLoyaltyRegeneration',
    startsAt: resolvesAt,
    duration: OASIS_TICK_INTERVAL_MS / serverSpeed,
  });
};

export const oasisReleaseResolver: Resolver<GameEvent<'oasisRelease'>> = (
  database,
  args,
) => {
  const { meta } = args;
  const { oasisTileId, villageId } = meta;

  database.exec({
    sql: `
      DELETE FROM effects
      WHERE source = 'oasis'
        AND village_id = $village_id
        AND source_specifier = $source_specifier;
    `,
    bind: {
      $village_id: villageId,
      $source_specifier: oasisTileId,
    },
  });

  database.exec({
    sql: `
      UPDATE oasis
      SET village_id = NULL, loyalty = 100
      WHERE tile_id = $tile_id AND village_id = $village_id;
    `,
    bind: {
      $tile_id: oasisTileId,
      $village_id: villageId,
    },
  });
};
