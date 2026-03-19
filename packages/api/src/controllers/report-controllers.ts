import { z } from 'zod';
import { createController } from '../utils/controller';
import {
  reportDetailDbSchema,
  reportListItemDbSchema,
} from './schemas/report-schemas';

export const getReports = createController('/villages/:villageId/reports')(
  ({
    database,
    path: { villageId },
    query: { page = 1, pageSize = 20, type, isArchived = false },
  }) => {
    const offset = (page - 1) * pageSize;
    let sql = `
      SELECT id, type, village_id as villageId, target_village_id as targetVillageId, timestamp, is_read as isRead, is_archived as isArchived
      FROM reports
      WHERE village_id = $villageId AND is_archived = $isArchived
    `;
    const bind: Record<string, any> = {
      $villageId: villageId,
      $isArchived: isArchived ? 1 : 0,
    };

    if (type) {
      sql += ' AND type = $type';
      bind.$type = type;
    }

    sql += ' ORDER BY timestamp DESC LIMIT $limit OFFSET $offset';
    bind.$limit = pageSize;
    bind.$offset = offset;

    const items = database.selectObjects({
      sql,
      bind,
      schema: reportListItemDbSchema,
    });

    const total = database.selectValue({
      sql: 'SELECT COUNT(*) FROM reports WHERE village_id = $villageId AND is_archived = $isArchived',
      bind: { $villageId: villageId, $isArchived: isArchived ? 1 : 0 },
      schema: z.number(),
    })!;

    return {
      items,
      total,
      page,
      pageSize,
    };
  },
);

export const getReport = createController('/reports/:reportId')(
  ({ database, path: { reportId } }) => {
    const report = database.selectObject({
      sql: `
        SELECT id, type, village_id as villageId, target_village_id as targetVillageId, timestamp, is_read as isRead, is_archived as isArchived, attacker_faction_id as attackerFactionId, defender_faction_id as defenderFactionId, data
        FROM reports
        WHERE id = $reportId
      `,
      bind: { $reportId: reportId },
      schema: reportDetailDbSchema,
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Mark as read when opened
    database.exec({
      sql: 'UPDATE reports SET is_read = 1 WHERE id = $reportId',
      bind: { $reportId: reportId },
    });

    return report;
  },
);

export const markReportsAsRead = createController(
  '/reports/mark-read',
  'post',
)(({ database, body: { reportIds } }) => {
  if (reportIds.length === 0) {
    return;
  }

  const placeholders = reportIds.map((_, i) => `$id${i}`).join(',');
  const bind = reportIds.reduce(
    (acc, id, i) => ({ ...acc, [`$id${i}`]: id }),
    {},
  );

  database.exec({
    sql: `UPDATE reports SET is_read = 1 WHERE id IN (${placeholders})`,
    bind,
  });
});

export const deleteReports = createController(
  '/reports',
  'delete',
)(({ database, body: { reportIds } }) => {
  if (reportIds.length === 0) {
    return;
  }

  const placeholders = reportIds.map((_, i) => `$id${i}`).join(',');
  const bind = reportIds.reduce(
    (acc, id, i) => ({ ...acc, [`$id${i}`]: id }),
    {},
  );

  database.exec({
    sql: `DELETE FROM reports WHERE id IN (${placeholders})`,
    bind,
  });
});

export const archiveReports = createController(
  '/reports/archive',
  'post',
)(({ database, body: { reportIds } }) => {
  if (reportIds.length === 0) {
    return;
  }

  const placeholders = reportIds.map((_, i) => `$id${i}`).join(',');
  const bind = reportIds.reduce(
    (acc, id, i) => ({ ...acc, [`$id${i}`]: id }),
    {},
  );

  database.exec({
    sql: `UPDATE reports SET is_archived = 1 WHERE id IN (${placeholders})`,
    bind,
  });
});
