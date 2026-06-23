/**
 * Returns the number of NPC factions based on map size.
 *
 * Smaller maps get fewer factions to keep the game balanced:
 * - 25x25 and 50x50: 3 NPC factions
 * - 75x75 and 100x100: 9 NPC factions (existing default)
 *
 * Note: This controls the number of factions (alliances), NOT the number
 * of NPC villages per faction. Village count per faction is handled by
 * the existing NPC scaling logic.
 */
export const getFactionCountForMapSize = (mapSize: number): number => {
  if (mapSize <= 50) {
    return 3;
  }
  return 9;
};

/**
 * Returns the number of Natar villages per map size.
 * Natar villages hold Construction Plans and are passive defenders.
 * - 25x25: 1 Natar village
 * - 50x50: 2 Natar villages
 * - 75x75: 3 Natar villages
 * - 100x100: 4 Natar villages
 */
export const getNatarVillageCount = (mapSize: number): number => {
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
