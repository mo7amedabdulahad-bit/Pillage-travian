import { z } from 'zod';

export const reportTypeSchema = z.enum([
  'raid',
  'attack',
  'reinforcement',
  'trade',
]);

export const reportListItemSchema = z.strictObject({
  id: z.number(),
  type: reportTypeSchema,
  villageId: z.number(),
  targetVillageId: z.number().nullable(),
  timestamp: z.number(),
  isRead: z.boolean(),
  isArchived: z.boolean(),
});

const sqliteBoolean = z.coerce.number().transform((v) => v === 1);

export const reportListItemDbSchema = reportListItemSchema.extend({
  isRead: sqliteBoolean,
  isArchived: sqliteBoolean,
});

export const reportDetailSchema = reportListItemSchema.extend({
  attackerFactionId: z.number().nullable(),
  defenderFactionId: z.number().nullable(),
  data: z.any(),
});

export const reportDetailDbSchema = reportDetailSchema.extend({
  isRead: sqliteBoolean,
  isArchived: sqliteBoolean,
  data: z
    .string()
    .transform((v) => JSON.parse(v))
    .pipe(z.any()),
});

export const reportsQuerySchema = z.strictObject({
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(20),
  type: reportTypeSchema.optional(),
  isArchived: z.coerce.boolean().optional().default(false),
});

export const bulkReportActionSchema = z.strictObject({
  reportIds: z.array(z.number()),
});
