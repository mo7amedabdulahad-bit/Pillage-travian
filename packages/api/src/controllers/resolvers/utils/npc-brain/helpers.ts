import { z } from 'zod';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getFactionProfile } from './faction-profiles';
import type { FactionKey } from './npc-brain-types';
import {
  NPC_BRAIN_CONSTANTS,
  TRIBE_TROOP_TIERS,
  VILLAGE_SIZE_REGEN_RATE,
} from './npc-brain-types';

/**
 * Adjust a millisecond duration for game speed.
 * All time durations in the game must be divided by speed before use.
 */
export const adjustForSpeed = (baseMs: number, speed: number): number => {
  return baseMs / speed;
};

/**
 * Calculate Euclidean distance between two points on the map.
 */
export const mapDistance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): number => {
  return Math.hypot(a.x - b.x, a.y - b.y);
};

/**
 * Get village size based on distance from map center.
 * Mirrors the existing logic in npc.ts.
 */
export const getVillageSize = (
  x: number,
  y: number,
  mapSize: number,
): VillageSize => {
  const dist = Math.hypot(x, y);
  const normalizedDist = dist / (mapSize / 2);

  if (normalizedDist > 0.9) {
    return 'xxs';
  }
  if (normalizedDist > 0.8) {
    return 'xs';
  }
  if (normalizedDist > 0.7) {
    return 'sm';
  }
  if (normalizedDist > 0.6) {
    return 'md';
  }
  if (normalizedDist > 0.4) {
    return 'lg';
  }
  if (normalizedDist > 0.3) {
    return 'xl';
  }
  if (normalizedDist > 0.2) {
    return '2xl';
  }
  if (normalizedDist > 0.1) {
    return '3xl';
  }
  return '4xl';
};

/**
 * Get the troop regen rate for a village based on its size and faction.
 */
export const getTroopRegenRate = (
  villageSize: VillageSize,
  factionKey: FactionKey,
): number => {
  const baseRate = VILLAGE_SIZE_REGEN_RATE[villageSize] ?? 20;
  const profile = getFactionProfile(factionKey);
  return baseRate * profile.troopRegenRateMultiplier;
};

/**
 * Get max troops per primary troop type for a village.
 * Based on max loot capacity.
 */
export const getMaxTroopsPerType = (maxLootCapacity: number): number => {
  return Math.floor(maxLootCapacity / 20);
};

/**
 * Get the preferred troop composition for a village based on tribe and faction.
 * Returns an array of { unitId, weight } for distributing regen.
 */
export const getPreferredTroopComposition = (
  tribe: string,
  factionKey: FactionKey,
): { unitId: string; weight: number }[] => {
  const tiers = TRIBE_TROOP_TIERS[tribe];
  if (!tiers) {
    return [];
  }

  const profile = getFactionProfile(factionKey);
  return tiers.map((unitId, index) => ({
    unitId,
    weight: profile.preferredTroopTierWeights[index],
  }));
};

/**
 * Scale a troop object by a percentage factor.
 * Returns new troop counts with fractional amounts floored.
 */
export const scaleTroops = (
  troops: Record<string, number>,
  percentage: number,
): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const [unitId, amount] of Object.entries(troops)) {
    const scaled = Math.floor(amount * percentage);
    if (scaled > 0) {
      result[unitId] = scaled;
    }
  }
  return result;
};

/**
 * Fetch the game speed from the servers table.
 */
export const getGameSpeed = (db: DbFacade): number => {
  const result = db.selectObject({
    sql: 'SELECT speed FROM servers LIMIT 1;',
    schema: z.object({ speed: z.number() }),
  });
  return result?.speed ?? 1;
};

/**
 * Fetch the map size from the servers table.
 */
export const getMapSize = (db: DbFacade): number => {
  const result = db.selectObject({
    sql: 'SELECT map_size as mapSize FROM servers LIMIT 1;',
    schema: z.object({ mapSize: z.number() }),
  });
  return result?.mapSize ?? 400;
};

/**
 * Get all NPC village IDs with their faction keys.
 */
export const getAllNPCVillages = (
  db: DbFacade,
): {
  villageId: number;
  factionKey: FactionKey;
  tileId: number;
  x: number;
  y: number;
}[] => {
  return db.selectObjects({
    sql: `
      SELECT
        nvs.village_id AS villageId,
        nvs.faction_key AS factionKey,
        v.tile_id AS tileId,
        t.x,
        t.y
      FROM npc_village_state nvs
      JOIN villages v ON v.id = nvs.village_id
      JOIN tiles t ON t.id = v.tile_id;
    `,
    schema: z.strictObject({
      villageId: z.number(),
      factionKey: z.string(),
      tileId: z.number(),
      x: z.number(),
      y: z.number(),
    }),
  }) as {
    villageId: number;
    factionKey: FactionKey;
    tileId: number;
    x: number;
    y: number;
  }[];
};

/**
 * Get the player's village ID (the first village of PLAYER_ID).
 */
export const getPlayerVillageId = (db: DbFacade): number | null => {
  const result = db.selectObject({
    sql: `
      SELECT v.id
      FROM villages v
      JOIN players p ON p.id = v.player_id
      WHERE p.id = 1
      LIMIT 1;
    `,
    schema: z.object({ id: z.number() }),
  });
  return result?.id ?? null;
};

/**
 * Get player village tile coordinates.
 */
export const getPlayerVillageCoords = (
  db: DbFacade,
): { x: number; y: number } | null => {
  const result = db.selectObject({
    sql: `
      SELECT t.x, t.y
      FROM villages v
      JOIN tiles t ON t.id = v.tile_id
      JOIN players p ON p.id = v.player_id
      WHERE p.id = 1
      LIMIT 1;
    `,
    schema: z.object({ x: z.number(), y: z.number() }),
  });
  return result ?? null;
};

/**
 * Get the total field level sum for a village's resource sites.
 */
export const getFieldLevelSum = (db: DbFacade, villageId: number): number => {
  const result = db.selectValue({
    sql: `
      SELECT
        COALESCE(SUM(level), 0) AS totalLevel
      FROM building_fields
      WHERE village_id = $villageId AND field_id <= 18;
    `,
    bind: { $villageId: villageId },
    schema: z.object({ totalLevel: z.number() }),
  });
  return result?.totalLevel ?? 0;
};

/**
 * Calculate max loot capacity for a village.
 * maxLootCapacity = sum(resourceFieldLevels) * LOOT_PER_FIELD_LEVEL * villageSizeMultiplier
 */
export const calculateMaxLootCapacity = (
  fieldLevelSum: number,
  villageSize: VillageSize,
): number => {
  const sizeMultiplier =
    NPC_BRAIN_CONSTANTS.VILLAGE_SIZE_MULTIPLIER[villageSize] ?? 1.0;
  return Math.floor(
    fieldLevelSum * NPC_BRAIN_CONSTANTS.LOOT_PER_FIELD_LEVEL * sizeMultiplier,
  );
};

/**
 * Format milliseconds into a human-readable duration string.
 */
export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0
      ? `${days} day${days > 1 ? 's' : ''} ${remainingHours}h`
      : `${days} day${days > 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
};

/**
 * Check if a faction key is valid.
 */
export const isValidFactionKey = (key: string): key is FactionKey => {
  return key.startsWith('npc') && key !== 'player';
};
