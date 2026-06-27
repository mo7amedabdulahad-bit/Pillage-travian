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

/**
 * Returns the number of World Wonder villages per map size.
 * WW villages are Natar-owned villages containing the WW building.
 * - 25x25: 8 WW villages
 * - 50x50: 10 WW villages
 * - 75x75: 12 WW villages
 * - 100x100: 14 WW villages
 */
const getWWVillageCount = (mapSize: number): number => {
  if (mapSize <= 25) {
    return 8;
  }
  if (mapSize <= 50) {
    return 10;
  }
  if (mapSize <= 75) {
    return 12;
  }
  return 14;
};

/**
 * Select tiles distributed evenly by angle from center.
 */
const selectTilesByAngle = (
  pool: CandidateTile[],
  count: number,
  prng: ReturnType<typeof prngMulberry32>,
  selectedIds: Set<number>,
): CandidateTile[] => {
  const byAngle = [...pool].sort(
    (a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x),
  );

  const selected: CandidateTile[] = [];

  for (let i = 0; i < count && selected.length < byAngle.length; i += 1) {
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
    selected.push(tile);
    selectedIds.add(tile.id);
  }

  return selected;
};

export const natarVillagesSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const regularCount = getNatarVillageCount(server.configuration.mapSize);
  const wwCount = getWWVillageCount(server.configuration.mapSize);
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

  const mapSize = server.configuration.mapSize;
  const selectedIds = new Set<number>();

  // ─── 1. Select regular Natar villages (35-50% radius from center) ───
  const minRadius = mapSize * 0.35;
  const maxRadius = mapSize * 0.5;
  const regularOuterCandidates = candidates.filter((tile) => {
    const distance = Math.hypot(tile.x, tile.y);
    return distance >= minRadius && distance <= maxRadius;
  });
  const regularPool =
    regularOuterCandidates.length >= regularCount
      ? regularOuterCandidates
      : candidates.filter((tile) => {
            const distance = Math.hypot(tile.x, tile.y);
            return distance >= mapSize * 0.2 && distance <= mapSize * 0.6;
          }).length >= regularCount
        ? candidates.filter((tile) => {
            const distance = Math.hypot(tile.x, tile.y);
            return distance >= mapSize * 0.2 && distance <= mapSize * 0.6;
          })
        : candidates;

  const regularTiles = selectTilesByAngle(
    regularPool,
    regularCount,
    prng,
    selectedIds,
  );

  // ─── 2. Select WW villages ───
  // 8 outside grey zone (60-80% radius), 6 inside grey zone (30-50% radius)
  const wwOutsideCount = Math.min(8, Math.floor(wwCount * 0.57));
  const wwInsideCount = wwCount - wwOutsideCount;

  // WW villages outside grey zone (60-80% radius)
  const wwOutsideMinRadius = mapSize * 0.6;
  const wwOutsideMaxRadius = mapSize * 0.8;
  const wwOutsideCandidates = candidates.filter((tile) => {
    if (selectedIds.has(tile.id)) {
      return false;
    }
    const distance = Math.hypot(tile.x, tile.y);
    return distance >= wwOutsideMinRadius && distance <= wwOutsideMaxRadius;
  });
  const wwOutsidePool =
    wwOutsideCandidates.length >= wwOutsideCount
      ? wwOutsideCandidates
      : candidates.filter((tile) => {
          if (selectedIds.has(tile.id)) {
            return false;
          }
          const distance = Math.hypot(tile.x, tile.y);
          return distance >= mapSize * 0.5 && distance <= mapSize * 0.9;
        });

  const wwOutsideTiles = selectTilesByAngle(
    wwOutsidePool,
    wwOutsideCount,
    prng,
    selectedIds,
  );

  // WW villages inside grey zone (30-50% radius)
  const wwInsideMinRadius = mapSize * 0.3;
  const wwInsideMaxRadius = mapSize * 0.5;
  const wwInsideCandidates = candidates.filter((tile) => {
    if (selectedIds.has(tile.id)) {
      return false;
    }
    const distance = Math.hypot(tile.x, tile.y);
    return distance >= wwInsideMinRadius && distance <= wwInsideMaxRadius;
  });
  const wwInsidePool =
    wwInsideCandidates.length >= wwInsideCount
      ? wwInsideCandidates
      : candidates.filter((tile) => {
          if (selectedIds.has(tile.id)) {
            return false;
          }
          const distance = Math.hypot(tile.x, tile.y);
          return distance >= mapSize * 0.2 && distance <= mapSize * 0.6;
        });

  const wwInsideTiles = selectTilesByAngle(
    wwInsidePool,
    wwInsideCount,
    prng,
    selectedIds,
  );

  const allWWTiles = [...wwOutsideTiles, ...wwInsideTiles];

  // ─── 3. Insert regular Natar villages ───
  if (regularTiles.length > 0) {
    batchInsert(
      database,
      'villages',
      ['name', 'slug', 'tile_id', 'player_id', 'tribe_id'],
      regularTiles.map((tile, index) => [
        `Natar Stronghold ${index + 1}`,
        null,
        tile.id,
        natarPlayer.player_id,
        natarPlayer.tribe_id,
      ]),
    );

    const regularTileIdBinds: Record<string, number> = {};
    const regularTileIdPlaceholders = regularTiles
      .map((tile, index) => {
        regularTileIdBinds[`$tile${index}`] = tile.id;
        return `$tile${index}`;
      })
      .join(',');

    const regularVillages = database.selectObjects({
      sql: `
        SELECT id AS village_id
        FROM villages
        WHERE tile_id IN (${regularTileIdPlaceholders});
      `,
      bind: regularTileIdBinds,
      schema: z.strictObject({ village_id: z.number() }),
    });

    batchInsert(
      database,
      'natar_villages',
      [
        'village_id',
        'server_slug',
        'is_ww_village',
        'ww_level',
        'construction_plan_available',
        'plan_holder_player_id',
        'attack_block_until',
        'last_attacked_at',
      ],
      regularVillages.map(({ village_id }) => [
        village_id,
        server.slug,
        0,
        0,
        1,
        null,
        null,
        null,
      ]),
    );
  }

  // ─── 4. Insert WW villages ───
  if (allWWTiles.length > 0) {
    batchInsert(
      database,
      'villages',
      [
        'name',
        'slug',
        'tile_id',
        'player_id',
        'tribe_id',
        'is_world_wonder_village',
        'loyalty',
      ],
      allWWTiles.map((tile, index) => [
        `WW Village ${index + 1}`,
        null,
        tile.id,
        natarPlayer.player_id,
        natarPlayer.tribe_id,
        1,
        200,
      ]),
    );

    const wwTileIdBinds: Record<string, number> = {};
    const wwTileIdPlaceholders = allWWTiles
      .map((tile, index) => {
        wwTileIdBinds[`$tile${index}`] = tile.id;
        return `$tile${index}`;
      })
      .join(',');

    const wwVillages = database.selectObjects({
      sql: `
        SELECT id AS village_id
        FROM villages
        WHERE tile_id IN (${wwTileIdPlaceholders});
      `,
      bind: wwTileIdBinds,
      schema: z.strictObject({ village_id: z.number() }),
    });

    // WW villages block attacks until 7 days after server start (standard) or 1 day (blitz)
    const gameMode = server.gameMode ?? 'standard';
    const attackBlockDays = gameMode === 'blitz' ? 1 : 7;
    const attackBlockUntil =
      server.createdAt + attackBlockDays * 24 * 3_600_000;

    batchInsert(
      database,
      'natar_villages',
      [
        'village_id',
        'server_slug',
        'is_ww_village',
        'ww_level',
        'construction_plan_available',
        'plan_holder_player_id',
        'attack_block_until',
        'last_attacked_at',
      ],
      wwVillages.map(({ village_id }) => [
        village_id,
        server.slug,
        1,
        0,
        0,
        null,
        attackBlockUntil,
        null,
      ]),
    );

    // Insert world_wonders rows for WW villages (Natar-owned, level 0)
    batchInsert(
      database,
      'world_wonders',
      [
        'village_id',
        'owner_player_id',
        'owner_faction_id',
        'current_level',
        'started_at',
      ],
      wwVillages.map(({ village_id }) => [
        village_id,
        natarPlayer.player_id,
        'natars',
        0,
        server.createdAt,
      ]),
    );
  }
};
