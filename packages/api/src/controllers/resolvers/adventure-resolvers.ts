import { z } from 'zod';
import { calculateAdventurePointIncreaseEventDuration } from '@pillage-first/game-assets/utils/adventures';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import type { Resolver } from '../../types/resolver';
import { createEvents } from '../utils/create-event';

export const adventurePointIncreaseResolver: Resolver<
  GameEvent<'adventurePointIncrease'>
> = (database, args) => {
  const { resolvesAt } = args;
  const now = Date.now();

  const { createdAt, speed } = database.selectObject({
    sql: 'SELECT created_at AS createdAt, speed FROM servers LIMIT 1;',
    schema: z.object({ createdAt: z.number(), speed: speedSchema }),
  })!;

  const interval = calculateAdventurePointIncreaseEventDuration(
    createdAt,
    speed,
  );

  // Bulk catch-up: grant all adventure points missed while offline in one
  // shot, instead of one tick per resolver invocation.
  const pointsToAdd = Math.max(
    1,
    Math.floor((now - resolvesAt) / interval) + 1,
  );

  database.exec({
    sql: 'UPDATE hero_adventures SET available = available + $points;',
    bind: { $points: pointsToAdd },
  });

  // Reschedule from real-now so the next event is in the future, not the past.
  createEvents<'adventurePointIncrease'>(database, {
    ...args,
    startsAt: now,
    type: 'adventurePointIncrease',
  });
};
