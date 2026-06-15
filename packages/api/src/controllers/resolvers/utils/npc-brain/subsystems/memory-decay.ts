import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { FACTION_PROFILES } from '../faction-profiles';
import { adjustForSpeed } from '../helpers';

/**
 * Batched memory decay for all NPC villages.
 * One DELETE with JOIN on npc_village_state handles all villages at once.
 */
export const processMemoryDecayBatch = (
  db: DbFacade,
  currentTimeMs: number,
  speed: number,
): void => {
  // Build a CASE expression for memory thresholds per faction
  const nonPermanentFactions = Object.values(FACTION_PROFILES)
    .filter((p) => !p.isMemoryPermanent)
    .map((p) => p.key);

  if (nonPermanentFactions.length === 0) {
    return;
  }

  // Build CASE for each faction's memory duration
  const caseClauses: string[] = [];
  const bind: Record<string, number | string> = {};

  nonPermanentFactions.forEach((factionKey, i) => {
    const profile = FACTION_PROFILES[factionKey];
    const thresholdMs = adjustForSpeed(
      profile.memoryDurationHours! * 3_600_000,
      speed,
    );
    const fk = `$fk${i}`;
    const tk = `$tk${i}`;
    caseClauses.push(`WHEN nvs2.faction_key = ${fk} THEN ${tk}`);
    bind[fk] = factionKey;
    bind[tk] = thresholdMs;
  });

  const factionPlaceholders = nonPermanentFactions
    .map((_, i) => `$fk${i}`)
    .join(',');

  db.exec({
    sql: `
      DELETE FROM npc_raid_history
      WHERE village_id IN (
        SELECT nvs.village_id
        FROM npc_village_state nvs
        WHERE nvs.faction_key IN (${factionPlaceholders})
      )
      AND ($currentTime - timestamp) > (
        SELECT CASE nvs2.faction_key
          ${caseClauses.join('\n')}
          ELSE 999999999999
        END
        FROM npc_village_state nvs2
        WHERE nvs2.village_id = npc_raid_history.village_id
      );
    `,
    bind: { ...bind, $currentTime: currentTimeMs },
  });
};

/**
 * Get the current count of remembered raids for a village.
 * Returns 0 if the table doesn't exist (old game worlds).
 */
export const getRaidCount = (db: DbFacade, villageId: number): number => {
  try {
    const count = db.selectValue({
      sql: `
        SELECT COUNT(*) FROM npc_raid_history WHERE village_id = $villageId;
      `,
      bind: { $villageId: villageId },
      schema: z.any(),
    });
    return (count as number) ?? 0;
  } catch (_e) {
    return 0;
  }
};
