import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const farmListTroopSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.number().min(1),
});

export const farmListSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
});

export const farmListTileSchema = z
  .strictObject({
    tile_id: z.number(),
    troops_meta: z
      .string()
      .nullable()
      .transform((v) => (v ? JSON.parse(v) : []))
      .pipe(z.array(farmListTroopSchema)),
  })
  .transform((t) => ({
    tileId: t.tile_id,
    troops: t.troops_meta as z.infer<typeof farmListTroopSchema>[],
  }))
  .pipe(
    z.strictObject({
      tileId: z.number(),
      troops: z.array(farmListTroopSchema),
    }),
  );

export const createFarmListSchema = z.strictObject({
  name: z.string().min(1),
});

export const addTileToFarmListSchema = z.strictObject({
  tileId: z.number(),
  troops: z.array(farmListTroopSchema).optional(),
});
