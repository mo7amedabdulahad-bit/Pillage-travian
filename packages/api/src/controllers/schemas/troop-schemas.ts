import { z } from 'zod';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const troopSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.number().min(0),
});
