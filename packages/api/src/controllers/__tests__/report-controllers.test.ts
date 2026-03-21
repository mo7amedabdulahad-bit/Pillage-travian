import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createTroopMovementRaidEventMock } from '@pillage-first/mocks/event';
import {
  archiveReports,
  deleteReports,
  getReport,
  getReports,
  markReportsAsRead,
} from '../report-controllers';
import { raidMovementResolver } from '../resolvers/troop-movement-resolver';
import { saveCombatReport } from '../resolvers/utils/reports';
import { reportsQuerySchema } from '../schemas/report-schemas';
import { createControllerArgs } from './utils/controller-args';

describe('report-controllers', () => {
  const villageId = 1;
  const targetVillageId = 2;

  test('should manage reports', async () => {
    const database = await prepareTestDatabase();

    // 1. Manually insert a report
    database.exec({
      sql: `
        INSERT INTO reports (type, village_id, target_village_id, timestamp, attacker_faction_id, defender_faction_id, data, is_read)
        VALUES ('raid', $villageId, $targetVillageId, $timestamp, 1, 2, $data, 0)
      `,
      bind: {
        $villageId: villageId,
        $targetVillageId: targetVillageId,
        $timestamp: Date.now(),
        $data: JSON.stringify({
          isRaid: true,
          attackerVillageName: 'Attacker',
        }),
      },
    });

    // 2. Get reports list
    const reports = getReports(
      database,
      createControllerArgs<'/villages/:villageId/reports'>({
        path: { villageId },
        query: { page: 1, pageSize: 10, isArchived: false },
      }),
    );

    expect(reports.items).toHaveLength(1);
    expect(reports.total).toBe(1);
    const reportId = reports.items[0].id;

    // 3. Get individual report and verify it's marked as read
    const report = getReport(
      database,
      createControllerArgs<'/reports/:reportId'>({
        path: { reportId },
      }),
    );

    expect(report.id).toBe(reportId);
    expect(report.data.isRaid).toBe(true);

    const updatedReports = getReports(
      database,
      createControllerArgs<'/villages/:villageId/reports'>({
        path: { villageId },
        query: { page: 1, pageSize: 10, isArchived: false },
      }),
    );
    expect(updatedReports.items[0].isRead).toBe(true);

    // 4. Mark as unread (not implemented as a controller but as a test of logic)
    database.exec({
      sql: 'UPDATE reports SET is_read = 0 WHERE id = $reportId',
      bind: { $reportId: reportId },
    });

    // 5. Bulk mark as read
    markReportsAsRead(
      database,
      createControllerArgs<'/reports/mark-read', 'post'>({
        body: { reportIds: [reportId] },
      }),
    );

    const readReports = getReports(
      database,
      createControllerArgs<'/villages/:villageId/reports'>({
        path: { villageId },
        query: { page: 1, pageSize: 10, isArchived: false },
      }),
    );
    expect(readReports.items[0].isRead).toBe(true);

    // 6. Archive report
    archiveReports(
      database,
      createControllerArgs<'/reports/archive', 'post'>({
        body: { reportIds: [reportId] },
      }),
    );

    const archivedReports = getReports(
      database,
      createControllerArgs<'/villages/:villageId/reports'>({
        path: { villageId },
        query: { isArchived: true, page: 1, pageSize: 10 },
      }),
    );
    expect(archivedReports.items).toHaveLength(1);

    // 7. Delete report
    deleteReports(
      database,
      createControllerArgs<'/reports', 'delete'>({
        body: { reportIds: [reportId] },
      }),
    );

    const deletedReports = getReports(
      database,
      createControllerArgs<'/villages/:villageId/reports'>({
        path: { villageId },
        query: { isArchived: true, page: 1, pageSize: 10 },
      }),
    );
    expect(deletedReports.items).toHaveLength(0);
  });

  test('should save attacker and defender combat reports', async () => {
    const database = await prepareTestDatabase();

    saveCombatReport(
      database,
      {
        attackerWins: true,
        attackerSurvivors: [{ unitId: 'LEGIONNAIRE', amount: 8 }],
        defenderSurvivors: [],
        attackerLosses: [{ unitId: 'LEGIONNAIRE', amount: 2 }],
        defenderLosses: [{ unitId: 'LEGIONNAIRE', amount: 10 }],
        wallDamage: 0,
        loot: [10, 20, 30, 40],
        attackerVillageName: 'Origin',
        defenderVillageName: 'Target',
        attackerPlayerName: 'Player',
        defenderPlayerName: 'Enemy',
        attackerTribe: 'romans',
        defenderTribe: 'teutons',
        initialAttackerTroops: [{ unitId: 'LEGIONNAIRE', amount: 10 }],
        initialDefenderTroops: [{ unitId: 'LEGIONNAIRE', amount: 10 }],
        isRaid: false,
      },
      villageId,
      targetVillageId,
      Date.now(),
      1,
      2,
    );

    const attackerReports = getReports(
      database,
      createControllerArgs<'/villages/:villageId/reports'>({
        path: { villageId },
        query: { page: 1, pageSize: 10, isArchived: false },
      }),
    );
    const defenderReports = getReports(
      database,
      createControllerArgs<'/villages/:villageId/reports'>({
        path: { villageId: targetVillageId },
        query: { page: 1, pageSize: 10, isArchived: false },
      }),
    );

    expect(
      attackerReports.items.some((report) => report.type === 'attack'),
    ).toBe(true);
    expect(
      defenderReports.items.some((report) => report.type === 'defence'),
    ).toBe(true);
  });

  test('should apply type filter to total count', async () => {
    const database = await prepareTestDatabase();

    database.exec({
      sql: `
        INSERT INTO reports (type, village_id, target_village_id, timestamp, attacker_faction_id, defender_faction_id, data, is_read)
        VALUES
          ('attack', $villageId, $targetVillageId, $timestamp, 1, 2, $attackData, 0),
          ('defence', $villageId, $targetVillageId, $timestamp, 1, 2, $defenceData, 0)
      `,
      bind: {
        $villageId: villageId,
        $targetVillageId: targetVillageId,
        $timestamp: Date.now(),
        $attackData: JSON.stringify({ attackerVillageName: 'A' }),
        $defenceData: JSON.stringify({ defenderVillageName: 'B' }),
      },
    });

    const filtered = getReports(
      database,
      createControllerArgs<'/villages/:villageId/reports'>({
        path: { villageId },
        query: { page: 1, pageSize: 10, type: 'attack', isArchived: false },
      }),
    );

    expect(filtered.items).toHaveLength(1);
    expect(filtered.total).toBe(1);
    expect(filtered.items[0]?.type).toBe('attack');
  });

  test('should treat isArchived=false query param as false', async () => {
    expect(reportsQuerySchema.parse({ isArchived: 'false' }).isArchived).toBe(
      false,
    );
    expect(reportsQuerySchema.parse({ isArchived: 'true' }).isArchived).toBe(
      true,
    );
  });

  test('raid combat should be visible in attacker village reports', async () => {
    const database = await prepareTestDatabase();
    const npcVillage = database.selectObject({
      sql: `
        SELECT v.id, v.tile_id AS tileId
        FROM npc_village_state nvs
        JOIN villages v ON v.id = nvs.village_id
        LIMIT 1;
      `,
      schema: z.strictObject({ id: z.number(), tileId: z.number() }),
    })!;

    database.exec({
      sql: 'DELETE FROM troops WHERE tile_id = $tileId;',
      bind: { $tileId: npcVillage.tileId },
    });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1);

    raidMovementResolver(
      database,
      createTroopMovementRaidEventMock({
        villageId,
        targetId: npcVillage.id,
        troops: [{ unitId: 'LEGIONNAIRE', amount: 200, tileId: 1, source: 1 }],
      }),
    );

    const reports = getReports(
      database,
      createControllerArgs<'/villages/:villageId/reports'>({
        path: { villageId },
        query: { page: 1, pageSize: 10, isArchived: false },
      }),
    );

    expect(reports.items.some((report) => report.type === 'raid')).toBe(true);

    randomSpy.mockRestore();
  });
});
