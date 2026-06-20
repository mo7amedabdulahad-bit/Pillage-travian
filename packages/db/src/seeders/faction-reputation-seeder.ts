import { z } from 'zod';
import { reputationLevels } from '@pillage-first/game-assets/reputation';
import { factionSchema } from '@pillage-first/types/models/faction';
import type { ReputationLevel } from '@pillage-first/types/models/reputation';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

const FACTION_REPUTATION_LEVELS: Record<string, ReputationLevel> = {
  npc1: 'ecstatic',
  npc2: 'honored',
  npc3: 'respected',
  npc4: 'friendly',
  npc5: 'neutral',
  npc6: 'unfriendly',
  npc7: 'hostile',
  npc8: 'hated',
  npc9: 'hated',
};

export const factionReputationSeeder = (database: DbFacade): void => {
  const rows = database.selectObjects({
    sql: 'SELECT faction, id FROM faction_ids;',
    schema: z.strictObject({
      faction: factionSchema,
      id: z.number(),
    }),
  });

  const factionToIdMap = Object.fromEntries(
    rows.map((r) => [r.faction, r.id] as const),
  );

  const playerFactionId = factionToIdMap.player;

  // Only create reputation entries for factions that exist in the database
  const relations: [number, number, number][] = [];

  for (const [factionKey, levelName] of Object.entries(
    FACTION_REPUTATION_LEVELS,
  )) {
    const factionId = factionToIdMap[factionKey];
    if (factionId !== undefined) {
      relations.push([
        playerFactionId,
        factionId,
        reputationLevels.get(levelName)!,
      ]);
    }
  }

  batchInsert(
    database,
    'faction_reputation',
    ['source_faction_id', 'target_faction_id', 'reputation'],
    relations,
  );
};
