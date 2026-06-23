import { factionSchema } from '@pillage-first/types/models/faction';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

/**
 * Returns the number of NPC factions based on map size.
 *
 * Smaller maps get fewer factions to keep the game balanced:
 * - 25x25 and 50x50: 3 NPC factions
 * - 75x75 and 100x100: 9 NPC factions (existing default)
 */
const getFactionCountForMapSize = (mapSize: number): number => {
  if (mapSize <= 50) {
    return 3;
  }
  return 9;
};

export const factionIdsSeeder = (database: DbFacade, server: Server): void => {
  const allFactions = factionSchema.options;
  const npcFactionCount = getFactionCountForMapSize(
    server.configuration.mapSize,
  );

  // Always include 'player' and 'natars', then add the appropriate number of NPC factions
  const factionsToCreate = [
    'player',
    'natars',
    ...allFactions
      .filter((f) => f !== 'player' && f !== 'natars')
      .slice(0, npcFactionCount),
  ];

  batchInsert(
    database,
    'faction_ids',
    ['faction'],
    factionsToCreate.map((faction) => [faction]),
  );
};
