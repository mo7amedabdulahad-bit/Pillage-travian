import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  archiveReports,
  deleteReports,
  getReport,
  getReports,
  markReportsAsRead,
} from '../report-controllers';
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
        query: { isArchived: true },
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
        query: { isArchived: true },
      }),
    );
    expect(deletedReports.items).toHaveLength(0);
  });
});
