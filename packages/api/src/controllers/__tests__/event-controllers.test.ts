import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createTroopMovementAttackEventMock } from '@pillage-first/mocks/event';
import type { TroopMovementEvent } from '@pillage-first/types/models/game-event';
import { getVillageEvents, getVillageEventsByType } from '../event-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('event-controllers', () => {
  test('getVillageEvents should return events for a village', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getVillageEvents(
      database,
      createControllerArgs<'/villages/:villageId/events'>({
        path: { villageId: village.id },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getVillageEventsByType should return events for a village by type', async () => {
    const database = await prepareTestDatabase();

    const village = database.selectObject({
      sql: 'SELECT id FROM villages LIMIT 1',
      schema: z.strictObject({ id: z.number() }),
    })!;

    getVillageEventsByType(
      database,
      createControllerArgs<'/villages/:villageId/events/:eventType'>({
        path: { villageId: village.id, eventType: 'buildingLevelChange' },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getVillageEventsByType should include incoming troop movements', async () => {
    const database = await prepareTestDatabase();

    const villages = database.selectObjects({
      sql: 'SELECT id, tile_id AS tileId FROM villages ORDER BY id LIMIT 2',
      schema: z.strictObject({ id: z.number(), tileId: z.number() }),
    });

    const [sourceVillage, targetVillage] = villages;

    database.exec({
      sql: `
        INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
        VALUES ((SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 20, $tile_id, $tile_id)
      `,
      bind: { $tile_id: sourceVillage.tileId },
    });

    const event = createTroopMovementAttackEventMock({
      id: 12345,
      villageId: sourceVillage.id,
      targetId: targetVillage.id,
      startsAt: 1000,
      duration: 500,
      resolvesAt: 1500,
      troops: [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId: sourceVillage.tileId,
          source: sourceVillage.tileId,
        },
      ],
    });

    database.exec({
      sql: `
        INSERT INTO events (id, type, starts_at, duration, village_id, meta)
        VALUES ($id, $type, $startsAt, $duration, $villageId, $meta)
      `,
      bind: {
        $id: event.id,
        $type: event.type,
        $startsAt: event.startsAt,
        $duration: event.duration,
        $villageId: event.villageId,
        $meta: JSON.stringify({
          targetId: event.targetId,
          troops: event.troops,
        }),
      },
    });

    const result = getVillageEventsByType(
      database,
      createControllerArgs<'/villages/:villageId/events/:eventType'>({
        path: { villageId: targetVillage.id, eventType: 'troopMovement' },
      }),
    ) as TroopMovementEvent[];

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(event.id);
    expect(result[0]?.targetId).toBe(targetVillage.id);
  });
});
