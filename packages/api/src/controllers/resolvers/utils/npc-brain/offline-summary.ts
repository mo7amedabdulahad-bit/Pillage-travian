import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getFactionProfile } from './faction-profiles';
import { formatDuration } from './helpers';
import type {
  AttackSummaryEntry,
  FactionKey,
  OfflineSummary,
  SimulationResult,
} from './npc-brain-types';
import { getNextRetaliation } from './subsystems/retaliation-execution';

/**
 * Offline Summary Builder (Section 7)
 *
 * Constructs the "While You Were Away" summary data from simulation results.
 * This is displayed to the player as a modal before the main game screen loads.
 *
 * Game design intent: Players should understand what happened while they were
 * offline. This creates narrative tension ("The Iron Brotherhood attacked!")
 * and gives strategic information ("Your next threat is in 2h 15m").
 */

/**
 * Build the offline summary from simulation results.
 */
export const buildOfflineSummary = (
  db: DbFacade,
  simulationResult: Pick<
    SimulationResult,
    | 'retaliationsResolved'
    | 'villagesGrown'
    | 'troopsRegenerated'
    | 'aggressionChanges'
  >,
  totalElapsedMs: number,
): OfflineSummary => {
  const currentTimeMs = Date.now();

  // Build attack summary entries
  const incomingAttacksResolved: AttackSummaryEntry[] =
    simulationResult.retaliationsResolved.map((r) => {
      const profile = getFactionProfile(r.factionKey);
      return {
        villageName: r.villageName,
        faction: profile.name,
        outcome: r.attackerWins ? 'defeated' : 'defended',
        troopsLost: r.defenderTroopsLost,
      };
    });

  // Find next scheduled retaliation
  const nextRetaliation = getNextRetaliation(db, currentTimeMs);
  let nextThreatenedBy: string | null = null;
  let nextEventIn: string | null = null;

  if (nextRetaliation) {
    const profile = getFactionProfile(nextRetaliation.factionKey as FactionKey);
    nextThreatenedBy = `${nextRetaliation.villageName} (${profile.name})`;
    const timeUntilAttack = nextRetaliation.executeAtMs - currentTimeMs;
    if (timeUntilAttack > 0) {
      nextEventIn = `Attack arrives in ${formatDuration(timeUntilAttack)}`;
    }
  }

  return {
    totalTimeSimulated: formatDuration(totalElapsedMs),
    incomingAttacksResolved,
    npcVillagesGrown: simulationResult.villagesGrown,
    nextThreatenedBy,
    nextEventIn,
  };
};
