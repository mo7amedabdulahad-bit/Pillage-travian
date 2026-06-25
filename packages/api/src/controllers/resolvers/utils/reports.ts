import { z } from 'zod';
import type { CombatResult } from '@pillage-first/game-assets/combat/combat-engine';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { ScoutMode } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export type CombatReportData = Omit<CombatResult, 'loot'> & {
  attackerVillageName: string;
  defenderVillageName: string;
  attackerPlayerName: string;
  defenderPlayerName: string;
  attackerTribe: string;
  defenderTribe: string;
  initialAttackerTroops: { unitId: string; amount: number }[];
  initialDefenderTroops: { unitId: string; amount: number }[];
  isRaid: boolean;
  loot?: [number, number, number, number];
  // Oasis occupation specific fields
  oasisLoyaltyDecrease?: number;
  oasisLoyaltyCurrent?: number;
  // Village chief attack fields
  loyaltyReduction?: number;
  newLoyalty?: number;
  conquered?: boolean;
  protectedBuildingName?: string;
  protectedBuildingLevel?: number;
  // Catapult building damage fields
  catapultTarget1?: string;
  catapultLevelsDestroyed1?: number;
  catapultTarget1Destroyed?: boolean;
  catapultTarget1IsRandom?: boolean;
  catapultTarget1RequestedName?: string;
  catapultTarget1WasFallback?: boolean;
  catapultTarget2?: string;
  catapultLevelsDestroyed2?: number;
  catapultTarget2Destroyed?: boolean;
  catapultTarget2IsRandom?: boolean;
  catapultTarget2RequestedName?: string;
  catapultTarget2WasFallback?: boolean;
  villageDestroyed?: boolean;
};

export type AdventureReportData = {
  villageName: string;
  playerName: string;
  health: number;
  damageTaken: number;
  completed: number;
  heroDied: boolean;
};

export type ScoutReportData = {
  attackerVillageName: string;
  defenderVillageName: string;
  attackerPlayerName: string;
  defenderPlayerName: string;
  attackerTribe: string;
  defenderTribe: string;
  attackerScouts: { unitId: string; amount: number }[];
  defenderScouts: { unitId: string; amount: number }[];
  attackerLosses: { unitId: string; amount: number }[];
  defenderLosses: { unitId: string; amount: number }[];
  attackerSurvivors: { unitId: string; amount: number }[];
  defenderSurvivors: { unitId: string; amount: number }[];
  wasDetected: boolean;
  scoutMode: ScoutMode;
  resources?: [number, number, number, number];
  crannyCapacity?: number;
  wallLevel?: number;
  palaceLevel?: number;
  troops?: { unitId: string; amount: number }[];
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
  defenderFactionId: number | null,
): void => {
  const serializedData = JSON.stringify(data);

  // Check if target is a village (for oasis attacks, targetVillageId is the oasis tile ID)
  const isTargetVillage = database.selectValue({
    sql: 'SELECT COUNT(*) FROM villages WHERE id = $id',
    bind: { $id: targetVillageId },
    schema: z.number(),
  })!;

  if (isTargetVillage) {
    // Both attacker and defender reports for village vs village
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
        VALUES
          ($attackerType, $attackerVillageId, $defenderVillageId, $timestamp, $attackerFactionId, $defenderFactionId, $data, 0),
          ($defenderType, $defenderVillageId, $attackerVillageId, $timestamp, $attackerFactionId, $defenderFactionId, $data, 0);
      `,
      bind: {
        $attackerType: data.isRaid ? 'raid' : 'attack',
        $defenderType: 'defence',
        $attackerVillageId: villageId,
        $defenderVillageId: targetVillageId,
        $timestamp: timestamp,
        $attackerFactionId: attackerFactionId,
        $defenderFactionId: defenderFactionId,
        $data: serializedData,
      },
    });
  } else {
    // Oasis attack - only attacker report
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
        VALUES
          ($attackerType, $attackerVillageId, $defenderVillageId, $timestamp, $attackerFactionId, $defenderFactionId, $data, 0);
      `,
      bind: {
        $attackerType: data.isRaid ? 'raid' : 'attack',
        $attackerVillageId: villageId,
        $defenderVillageId: targetVillageId,
        $timestamp: timestamp,
        $attackerFactionId: attackerFactionId,
        $defenderFactionId: defenderFactionId,
        $data: serializedData,
      },
    });
  }
};

export const saveAdventureReport = (
  database: DbFacade,
  data: AdventureReportData,
  villageId: number,
  timestamp: number,
  factionId: number,
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
      VALUES ($type, $villageId, NULL, $timestamp, $factionId, NULL, $data, 0);
    `,
    bind: {
      $type: 'adventure',
      $villageId: villageId,
      $timestamp: timestamp,
      $factionId: factionId,
      $data: JSON.stringify(data),
    },
  });
};

export const saveConstructionPlanObtainedReport = (
  database: DbFacade,
  attackerVillageId: number,
  natarVillageId: number,
  heroId: number,
  timestamp: number,
  attackerFactionId: number,
  defenderFactionId: number,
): void => {
  const data = JSON.stringify({
    natarVillageId,
    heroId,
    timestamp,
  });

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
      VALUES ($type, $attackerVillageId, $natarVillageId, $timestamp, $attackerFactionId, $defenderFactionId, $data, 0);
    `,
    bind: {
      $type: 'construction_plan_obtained',
      $attackerVillageId: attackerVillageId,
      $natarVillageId: natarVillageId,
      $timestamp: timestamp,
      $attackerFactionId: attackerFactionId,
      $defenderFactionId: defenderFactionId,
      $data: data,
    },
  });
};

export type NpcWonderMilestoneType =
  | 'started'
  | 'upgrade'
  | 'no_attack'
  | 'finished';

export const saveNpcWonderMilestoneReport = (
  database: DbFacade,
  factionKey: string,
  milestoneType: NpcWonderMilestoneType,
  level?: number,
): void => {
  const now = Date.now();

  // Find the WW village for this faction (for the report data)
  const wwVillage = database.selectObject({
    sql: `
      SELECT ww.village_id AS villageId, ww.current_level AS currentLevel
      FROM world_wonders ww
      WHERE ww.owner_faction_id = $faction
      LIMIT 1
    `,
    bind: { $faction: factionKey },
    schema: z.strictObject({
      villageId: z.number(),
      currentLevel: z.number(),
    }),
  });

  const currentLevel = level ?? wwVillage?.currentLevel ?? 0;

  const data = JSON.stringify({
    factionKey,
    milestoneType,
    level: currentLevel,
    timestamp: now,
  });

  // Broadcast to every player village
  const allVillageIds = database.selectValues({
    sql: 'SELECT id FROM villages WHERE player_id = $playerId',
    bind: { $playerId: PLAYER_ID },
    schema: z.number(),
  });

  for (const villageId of allVillageIds) {
    database.exec({
      sql: `
        INSERT INTO reports (
          type, village_id, target_village_id, timestamp,
          attacker_faction_id, defender_faction_id, data, is_read
        )
        VALUES ($type, $villageId, NULL, $timestamp, NULL, NULL, $data, 0)
      `,
      bind: {
        $type: 'npc_wonder_milestone',
        $villageId: villageId,
        $timestamp: now,
        $data: data,
      },
    });
  }
};

export const saveScoutReports = (
  database: DbFacade,
  data: ScoutReportData,
  villageId: number,
  targetVillageId: number,
  timestamp: number,
  attackerFactionId: number,
  defenderFactionId: number,
): void => {
  const serializedData = JSON.stringify(data);

  const defenderData = {
    ...data,
    resources: undefined,
    crannyCapacity: undefined,
    wallLevel: undefined,
    palaceLevel: undefined,
    troops: undefined,
  };

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
      VALUES
        ('scout-attack', $attackerVillageId, $defenderVillageId, $timestamp, $attackerFactionId, $defenderFactionId, $attackerData, 0),
        ('scout-defence', $defenderVillageId, $attackerVillageId, $timestamp, $attackerFactionId, $defenderFactionId, $defenderData, 0);
    `,
    bind: {
      $attackerVillageId: villageId,
      $defenderVillageId: targetVillageId,
      $timestamp: timestamp,
      $attackerFactionId: attackerFactionId,
      $defenderFactionId: defenderFactionId,
      $attackerData: serializedData,
      $defenderData: JSON.stringify(defenderData),
    },
  });
};
