import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateHealthRegenerationEventDuration } from '@pillage-first/game-assets/utils/hero';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { insertHeroEffectsQuery } from '../../utils/queries/effect-queries';
import { updateVillageResourcesAt } from '../../utils/village.ts';
import { createEvents } from '../utils/create-event';
import { addTroops } from './utils/troops.ts';

export const heroRevivalResolver: Resolver<GameEvent<'heroRevival'>> = (
  database,
  args,
) => {
  const { resolvesAt } = args;

  const { villageId, tileId, healthRegeneration, speed } =
    database.selectObject({
      sql: `
      SELECT
        villages.id AS villageId,
        villages.tile_id AS tileId,
        heroes.health_regeneration AS healthRegeneration,
        servers.speed AS speed
      FROM heroes
      JOIN villages ON heroes.village_id = villages.id
      JOIN servers ON 1 = 1
      WHERE heroes.player_id = $player_id;
    `,
      bind: {
        $player_id: PLAYER_ID,
      },
      schema: z.object({
        villageId: z.number(),
        tileId: z.number(),
        healthRegeneration: z.number(),
        speed: z.number(),
      }),
    })!;

  updateVillageResourcesAt(database, villageId, resolvesAt);

  database.exec({
    sql: 'UPDATE heroes SET health = 100 WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
  });

  database.exec({
    sql: insertHeroEffectsQuery,
    bind: { $player_id: PLAYER_ID },
  });

  addTroops(database, [
    {
      unitId: 'HERO',
      amount: 1,
      tileId: tileId,
      source: tileId,
    },
  ]);

  const duration = calculateHealthRegenerationEventDuration(
    healthRegeneration,
    speed,
  );

  createEvents<'heroHealthRegeneration'>(database, {
    type: 'heroHealthRegeneration',
    startsAt: resolvesAt,
    duration,
  });
};

export const heroHealthRegenerationResolver: Resolver<
  GameEvent<'heroHealthRegeneration'>
> = (database, args) => {
  const { resolvesAt } = args;
  const now = Date.now();

  const { health, healthRegeneration, speed } = database.selectObject({
    sql: `
      SELECT
        heroes.health AS health,
        heroes.health_regeneration AS healthRegeneration,
        servers.speed AS speed
      FROM heroes
      JOIN servers ON 1 = 1
      WHERE heroes.player_id = $player_id;
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
    schema: z.object({
      health: z.number(),
      healthRegeneration: z.number(),
      speed: z.number(),
    }),
  })!;

  const regenInterval = calculateHealthRegenerationEventDuration(
    healthRegeneration,
    speed,
  );

  if (health >= 100 || regenInterval <= 0) {
    // Hero already at full health — no regen needed. Reschedule from real-now
    // so the next event lands in the future instead of spiraling through
    // no-op ticks accumulated while offline.
    createEvents<'heroHealthRegeneration'>(database, {
      type: 'heroHealthRegeneration',
      startsAt: now,
      duration: regenInterval,
    });
    return;
  }

  // Bulk catch-up: apply all regen intervals missed since this event was due
  // in one shot, instead of one tick per resolver invocation.
  const intervalsElapsed = Math.max(
    1,
    Math.floor((now - resolvesAt) / regenInterval) + 1,
  );
  const newHealth = Math.min(100, health + intervalsElapsed);

  database.exec({
    sql: 'UPDATE heroes SET health = $health WHERE player_id = $player_id AND health > 0;',
    bind: { $player_id: PLAYER_ID, $health: newHealth },
  });

  // Reschedule from real-now so the next event is in the future, not the past.
  createEvents<'heroHealthRegeneration'>(database, {
    type: 'heroHealthRegeneration',
    startsAt: now,
    duration: regenInterval,
  });
};
