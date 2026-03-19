import type { CombatResult } from '@pillage-first/game-assets/combat/combat-engine';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export type CombatReportData = CombatResult & {
  attackerVillageName: string;
  defenderVillageName: string;
  attackerPlayerName: string;
  defenderPlayerName: string;
  attackerTribe: string;
  defenderTribe: string;
  initialAttackerTroops: { unitId: string; amount: number }[];
  initialDefenderTroops: { unitId: string; amount: number }[];
  isRaid: boolean;
};

/**
 * Saves a combat report to the database.
 */
export const saveCombatReport = (
  database: DbFacade,
  data: CombatReportData,
  villageId: number,
  targetVillageId: number,
  timestamp: number,
  attackerFactionId: number,
  defenderFactionId: number,
): void => {
  database.exec({
    sql: `
      INSERT INTO reports (
        type, 
        village_id, 
        target_village_id, 
        timestamp, 
        attacker_faction_id, 
        defender_faction_id, 
        data, 
        is_read
      )
      VALUES ($type, $villageId, $targetVillageId, $timestamp, $attackerFactionId, $defenderFactionId, $data, 0);
    `,
    bind: {
      $type: data.isRaid ? 'raid' : 'attack',
      $villageId: villageId,
      $targetVillageId: targetVillageId,
      $timestamp: timestamp,
      $attackerFactionId: attackerFactionId,
      $defenderFactionId: defenderFactionId,
      $data: JSON.stringify(data),
    },
  });
};
