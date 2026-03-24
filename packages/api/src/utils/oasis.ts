import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';

// ═══════════════════════════════════════════════════════════════════════════
// OASIS RESOURCE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculates current oasis resource amounts based on elapsed time.
 * Does NOT write to DB — read-only calculation.
 *
 * Production rates (per hour, at 1x server speed):
 *   +25% bonus oasis: 50 of that resource/hour
 *   +50% bonus oasis: 100 of that resource/hour
 *   Dual-bonus oasis: produces both resources simultaneously
 *
 * Cap: 500 per resource type (hard cap, no storage upgrade on oases)
 */
export const calculateOasisResourcesAt = (
  database: DbFacade,
  tileId: number,
  timestamp: number,
): { wood: number; clay: number; iron: number; wheat: number } => {
  // 1. Get server speed
  const { speed: serverSpeed } = database.selectObject({
    sql: 'SELECT speed FROM servers LIMIT 1',
    schema: z.object({ speed: z.number() }),
  })!;

  // 2. Get current stored resources and last update time
  const stored = database.selectObject({
    sql: 'SELECT wood, clay, iron, wheat, updated_at FROM resource_sites WHERE tile_id = $tileId',
    bind: { $tileId: tileId },
    schema: z.strictObject({
      wood: z.number(),
      clay: z.number(),
      iron: z.number(),
      wheat: z.number(),
      updated_at: z.number(),
    }),
  });

  if (!stored) {
    return { wood: 0, clay: 0, iron: 0, wheat: 0 };
  }

  // 3. Get oasis bonus types for this tile
  const bonuses = database.selectObjects({
    sql: 'SELECT resource, bonus FROM oasis WHERE tile_id = $tileId',
    bind: { $tileId: tileId },
    schema: z.strictObject({ resource: z.string(), bonus: z.number() }),
  });

  // 4. Calculate elapsed hours
  const elapsedMs = Math.max(0, timestamp - stored.updated_at);
  const elapsedHours = elapsedMs / (1000 * 3600);

  // 5. Calculate production per resource
  const production: Record<string, number> = {
    wood: 0,
    clay: 0,
    iron: 0,
    wheat: 0,
  };

  for (const { resource, bonus } of bonuses) {
    // Rate: 50/hour for +25%, 100/hour for +50%, scaled by server speed
    const baseRate = bonus >= 50 ? 100 : 50;
    production[resource] =
      (production[resource] ?? 0) + baseRate * serverSpeed * elapsedHours;
  }

  const CAP = 500;

  return {
    wood: Math.min(CAP, stored.wood + Math.floor(production.wood ?? 0)),
    clay: Math.min(CAP, stored.clay + Math.floor(production.clay ?? 0)),
    iron: Math.min(CAP, stored.iron + Math.floor(production.iron ?? 0)),
    wheat: Math.min(CAP, stored.wheat + Math.floor(production.wheat ?? 0)),
  };
};

/**
 * Writes calculated oasis resources back to resource_sites.
 * Call this before any loot calculation (same as updateVillageResourcesAt).
 */
export const updateOasisResourcesAt = (
  database: DbFacade,
  tileId: number,
  timestamp: number,
): void => {
  const { wood, clay, iron, wheat } = calculateOasisResourcesAt(
    database,
    tileId,
    timestamp,
  );

  database.exec({
    sql: `
      UPDATE resource_sites
      SET wood = $wood, clay = $clay, iron = $iron, wheat = $wheat, updated_at = $timestamp
      WHERE tile_id = $tileId
    `,
    bind: {
      $tileId: tileId,
      $wood: wood,
      $clay: clay,
      $iron: iron,
      $wheat: wheat,
      $timestamp: timestamp,
    },
  });
};
