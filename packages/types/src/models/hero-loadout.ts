import { z } from 'zod';

export const heroLoadoutSlotSchema = z
  .enum([
    'head',
    'horse',
    'torso',
    'boots',
    'right-hand',
    'left-hand',
    'consumable',
  ])
  .meta({ id: 'HeroLoadoutSlot' });

export type HeroLoadoutSlot = z.infer<typeof heroLoadoutSlotSchema>;

export const heroLoadoutSchema = z
  .strictObject({
    itemId: z.number(),
    slot: heroLoadoutSlotSchema,
    amount: z.number().min(1),
  })
  .meta({ id: 'HeroLoadout' });
