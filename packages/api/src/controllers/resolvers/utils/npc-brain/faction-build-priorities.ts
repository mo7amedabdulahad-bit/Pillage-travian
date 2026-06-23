import type { BuildingId } from '@pillage-first/types/models/building';
import type { FactionKey } from './npc-brain-types';

/**
 * Build priority entry: which building to upgrade, to what max level, and how important.
 */
export interface BuildPriorityEntry {
  readonly buildingId: BuildingId | 'WALL'; // WALL is resolved to tribe-specific wall at runtime
  readonly maxLevel: number;
  readonly priority: 'mandatory' | 'high' | 'medium' | 'low';
}

export type BuildPriorityScript = readonly BuildPriorityEntry[];

/**
 * Economy budget spending rate multipliers by faction personality.
 */
export const FACTION_SPENDING_RATE: Record<FactionKey, number> = {
  npc1: 0.9, // Aggressive: spend most income on military buildings
  npc2: 0.7, // Economy: accumulate before spending
  npc3: 0.8, // Balanced
  npc4: 0.8, // Balanced
  npc5: 0.8, // Balanced
  npc6: 0.9, // Aggressive
  npc7: 0.7, // Economy
  npc8: 0.8, // Balanced
  npc9: 0.9, // Aggressive
  natars: 0, // Passive: never builds
};

/**
 * Faction build priority scripts.
 * Order = priority order. NPC tries to build the first affordable entry.
 * Every script begins with mandatory entries (storage, rally point, wall).
 */
export const FACTION_BUILD_PRIORITIES: Record<FactionKey, BuildPriorityScript> =
  {
    npc1: [
      // Iron Brotherhood: military focus
      { buildingId: 'WAREHOUSE', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'GRANARY', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'RALLY_POINT', maxLevel: 1, priority: 'mandatory' },
      { buildingId: 'WALL', maxLevel: 15, priority: 'mandatory' },
      { buildingId: 'BARRACKS', maxLevel: 15, priority: 'high' },
      { buildingId: 'STABLE', maxLevel: 10, priority: 'high' },
      { buildingId: 'SMITHY', maxLevel: 10, priority: 'medium' },
      { buildingId: 'ACADEMY', maxLevel: 5, priority: 'low' },
    ],
    npc2: [
      // Merchant Guilds: economy focus
      { buildingId: 'WAREHOUSE', maxLevel: 15, priority: 'mandatory' },
      { buildingId: 'GRANARY', maxLevel: 15, priority: 'mandatory' },
      { buildingId: 'RALLY_POINT', maxLevel: 1, priority: 'mandatory' },
      { buildingId: 'WALL', maxLevel: 8, priority: 'mandatory' },
      { buildingId: 'MARKETPLACE', maxLevel: 10, priority: 'high' },
      { buildingId: 'BARRACKS', maxLevel: 5, priority: 'medium' },
      { buildingId: 'STABLE', maxLevel: 3, priority: 'low' },
    ],
    npc3: [
      // Shadow Nomads: scouts
      { buildingId: 'WAREHOUSE', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'GRANARY', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'RALLY_POINT', maxLevel: 1, priority: 'mandatory' },
      { buildingId: 'WALL', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'STABLE', maxLevel: 10, priority: 'high' },
      { buildingId: 'BARRACKS', maxLevel: 8, priority: 'medium' },
      { buildingId: 'SMITHY', maxLevel: 5, priority: 'medium' },
      { buildingId: 'ACADEMY', maxLevel: 3, priority: 'low' },
    ],
    npc4: [
      // Stone Wardens: defensive fortress
      { buildingId: 'WAREHOUSE', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'GRANARY', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'RALLY_POINT', maxLevel: 1, priority: 'mandatory' },
      { buildingId: 'WALL', maxLevel: 20, priority: 'mandatory' },
      { buildingId: 'BARRACKS', maxLevel: 10, priority: 'high' },
      { buildingId: 'STABLE', maxLevel: 8, priority: 'medium' },
      { buildingId: 'ACADEMY', maxLevel: 8, priority: 'medium' },
      { buildingId: 'SMITHY', maxLevel: 8, priority: 'medium' },
    ],
    npc5: [
      // River Clans: fast cavalry
      { buildingId: 'WAREHOUSE', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'GRANARY', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'RALLY_POINT', maxLevel: 1, priority: 'mandatory' },
      { buildingId: 'WALL', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'STABLE', maxLevel: 15, priority: 'high' },
      { buildingId: 'BARRACKS', maxLevel: 8, priority: 'medium' },
      { buildingId: 'TOURNAMENT_SQUARE', maxLevel: 5, priority: 'medium' },
      { buildingId: 'SMITHY', maxLevel: 8, priority: 'medium' },
    ],
    npc6: [
      // Ember Cult: fanatical siege
      { buildingId: 'WAREHOUSE', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'GRANARY', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'RALLY_POINT', maxLevel: 1, priority: 'mandatory' },
      { buildingId: 'WALL', maxLevel: 12, priority: 'mandatory' },
      { buildingId: 'BARRACKS', maxLevel: 12, priority: 'high' },
      { buildingId: 'STABLE', maxLevel: 10, priority: 'high' },
      { buildingId: 'WORKSHOP', maxLevel: 8, priority: 'high' },
      { buildingId: 'ACADEMY', maxLevel: 5, priority: 'medium' },
      { buildingId: 'SMITHY', maxLevel: 8, priority: 'medium' },
    ],
    npc7: [
      // Verdant Order: nature pacifists
      { buildingId: 'WAREHOUSE', maxLevel: 15, priority: 'mandatory' },
      { buildingId: 'GRANARY', maxLevel: 15, priority: 'mandatory' },
      { buildingId: 'RALLY_POINT', maxLevel: 1, priority: 'mandatory' },
      { buildingId: 'WALL', maxLevel: 5, priority: 'mandatory' },
      { buildingId: 'BARRACKS', maxLevel: 3, priority: 'low' },
      { buildingId: 'STABLE', maxLevel: 2, priority: 'low' },
    ],
    npc8: [
      // Iron Scholars: tech researchers
      { buildingId: 'WAREHOUSE', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'GRANARY', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'RALLY_POINT', maxLevel: 1, priority: 'mandatory' },
      { buildingId: 'WALL', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'ACADEMY', maxLevel: 15, priority: 'high' },
      { buildingId: 'SMITHY', maxLevel: 15, priority: 'high' },
      { buildingId: 'BARRACKS', maxLevel: 10, priority: 'medium' },
      { buildingId: 'STABLE', maxLevel: 8, priority: 'medium' },
    ],
    npc9: [
      // Bone Reavers: death cult
      { buildingId: 'WAREHOUSE', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'GRANARY', maxLevel: 10, priority: 'mandatory' },
      { buildingId: 'RALLY_POINT', maxLevel: 1, priority: 'mandatory' },
      { buildingId: 'WALL', maxLevel: 15, priority: 'mandatory' },
      { buildingId: 'BARRACKS', maxLevel: 15, priority: 'high' },
      { buildingId: 'STABLE', maxLevel: 10, priority: 'high' },
      { buildingId: 'SMITHY', maxLevel: 10, priority: 'medium' },
      { buildingId: 'ACADEMY', maxLevel: 5, priority: 'low' },
    ],
    natars: [
      // Natar Guardians: passive, no building priorities
    ],
  };
