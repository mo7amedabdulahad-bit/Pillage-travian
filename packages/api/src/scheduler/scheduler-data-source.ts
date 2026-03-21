import { z } from 'zod';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { resolveEvent } from '../utils/resolver';
import type { SchedulerDataSource } from './scheduler';

const getPastEventIdsSchema = z.number();

const getNextEventSchema = z.strictObject({
  id: z.number(),
  resolvesAt: z.number(),
});

export const createSchedulerDataSource = (
  database: DbFacade,
): SchedulerDataSource => {
  return {
    getPastEventIds: (now: number) => {
      return database.selectValues({
        sql: 'SELECT id FROM events WHERE resolves_at <= $now ORDER BY resolves_at;',
        bind: { $now: now },
        schema: getPastEventIdsSchema,
      });
    },
    getNextEvent: (now: number) => {
      return database.selectObject({
        sql: `
          SELECT id, resolves_at as resolvesAt
          FROM events
          WHERE resolves_at > $now
          ORDER BY resolves_at
          LIMIT 1;
        `,
        bind: { $now: now },
        schema: getNextEventSchema,
      })!;
    },
    resolveEvent: (id: GameEvent['id']) => {
      let result: ReturnType<typeof resolveEvent> | undefined;

      database.transaction((tx) => {
        result = resolveEvent(tx, id);
      });

      if (!result) {
        return;
      }

      globalThis.postMessage({
        eventKey: result.ok ? 'event:success' : 'event:error',
        ...result.event,
      } satisfies EventApiNotificationEvent);
    },
  };
};
