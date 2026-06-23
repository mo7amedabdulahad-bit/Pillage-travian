import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';
import { batchInsert } from '../utils/batch-insert';

type CandidateTile = {
  id: number;
  x: number;
  y: number;
};

const getNatarVillageCount = (mapSize: number): number => {
  if (mapSize <= 25) {
    return 1;
  }
  if (mapSize <= 50) {
    return 2;
  }
  if (mapSize <= 75) {
    return 3;
  }
  return 4;
};

export const natarVillagesSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const count = getNatarVillageCount(server.configuration.mapSize);
  const prng = prngMulberry32(`${server.seed}:natars`);

  const natarPlayer = database.selectObject({
    sql: `
      SELECT p.id AS player_id, p.tribe_id
      FROM players p
        JOIN faction_ids fi ON fi.id = p.faction_id
      WHERE fi.faction = 'natars'
      LIMIT 1;
    `,
    schema: z.strictObject({ player_id: z.number(), tribe_id: z.number() }),
  });

  if (!natarPlayer) {
    return;
  }

  const candidates = database.selectObjects({
    sql: `
      SELECT t.id, t.x, t.y
      FROM tiles t
      WHERE t.type = 'free'
        AND NOT EXISTS (
          SELECT 1 FROM villages v WHERE v.tile_id = t.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM oasis o WHERE o.tile_id = t.id
        )
      ORDER BY t.x, t.y;
    `,
    schema: z.strictObject({ id: z.number(), x: z.number(), y: z.number() }),
  });

  if (candidates.length === 0) {
    return;
  }

  const outerRingThreshold = Math.max(4, server.configuration.mapSize * 0.3);
  const outerCandidates = candidates.filter(
    (tile) => Math.hypot(tile.x, tile.y) >= outerRingThreshold,
  );
  const placementPool =
    outerCandidates.length >= count ? outerCandidates : candidates;
  const byAngle = [...placementPool].sort(
    (a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x),
  );

  const selectedTiles: CandidateTile[] = [];
  const selectedIds = new Set<number>();

  for (let i = 0; i < count && selectedTiles.length < byAngle.length; i += 1) {
    const start = Math.floor((i * byAngle.length) / count);
    const end = Math.max(
      start + 1,
      Math.floor(((i + 1) * byAngle.length) / count),
    );
    const segment = byAngle
      .slice(start, end)
      .filter((tile) => !selectedIds.has(tile.id));

    if (segment.length === 0) {
      continue;
    }

    const tile =
      segment[seededRandomIntFromInterval(prng, 0, segment.length - 1)];
    selectedTiles.push(tile);
    selectedIds.add(tile.id);
  }

  if (selectedTiles.length === 0) {
    return;
  }

  batchInsert(
    database,
    'villages',
    ['name', 'slug', 'tile_id', 'player_id', 'tribe_id'],
    selectedTiles.map((tile, index) => [
      `Natar Stronghold ${index + 1}`,
      null,
      tile.id,
      natarPlayer.player_id,
      natarPlayer.tribe_id,
    ]),
  );

  const tileIdBinds: Record<string, number> = {};
  const tileIdPlaceholders = selectedTiles
    .map((tile, index) => {
      tileIdBinds[`$tile${index}`] = tile.id;
      return `$tile${index}`;
    })
    .join(',');

  const villages = database.selectObjects({
    sql: `
      SELECT id AS village_id
      FROM villages
      WHERE tile_id IN (${tileIdPlaceholders});
    `,
    bind: tileIdBinds,
    schema: z.strictObject({ village_id: z.number() }),
  });

  batchInsert(
    database,
    'natar_villages',
    [
      'village_id',
      'server_slug',
      'construction_plan_available',
      'plan_holder_player_id',
    ],
    villages.map(({ village_id }) => [village_id, server.slug, 1, null]),
  );
};
