import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getFactionProfile } from '../faction-profiles';
import { adjustForSpeed } from '../helpers';
import type { FactionKey } from '../npc-brain-types';

/**
 * Memory Decay Subsystem (Section 4.1)
 *
 * Prunes expired raid history entries for non-PERMANENT factions.
 * PERMANENT factions (Iron Brotherhood, Ember Cult, Bone Reavers) never forget.
 *
 * Game design intent: Memory duration creates distinct faction personalities.
 * Short memory (River Clans, 24h) means quick forgiveness — raid them and they'll
 * calm down fast. Long memory (Stone Wardens, 168h) means they hold grudges.
 * PERMANENT means the only escape is the legendary consumable.
 */
export const processMemoryDecay = (
  db: DbFacade,
  villageId: number,
  factionKey: FactionKey,
  currentTimeMs: number,
  speed: number,
): number => {
  const profile = getFactionProfile(factionKey);

  if (profile.isMemoryPermanent) {
    return getRaidCount(db, villageId);
  }

  const memoryThresholdMs = adjustForSpeed(
    profile.memoryDurationHours! * 3_600_000,
    speed,
  );

  db.exec({
    sql: `
      DELETE FROM npc_raid_history
      WHERE village_id = $villageId
        AND ($currentTime - timestamp) > $memoryThreshold;
    `,
    bind: {
      $villageId: villageId,
      $currentTime: currentTimeMs,
      $memoryThreshold: memoryThresholdMs,
    },
  });

  return getRaidCount(db, villageId);
};

/**
 * Get the current count of remembered raids for a village.
 */
export const getRaidCount = (db: DbFacade, villageId: number): number => {
  const count = db.selectValue({
    sql: `
      SELECT COUNT(*) FROM npc_raid_history WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.number(),
  });
  return count ?? 0;
};
