import { z } from 'zod';

export const heroGenderSchema = z
  .enum(['male', 'female'])
  .meta({ id: 'HeroGender' });

export type HeroGender = z.infer<typeof heroGenderSchema>;

export const heroAppearanceSchema = z
  .strictObject({
    gender: heroGenderSchema,
    skinColor: z.string(),
    hairColor: z.string(),
    eyeColor: z.string(),
    jawId: z.number(),
    eyesId: z.number(),
    browsId: z.number(),
    noseId: z.number(),
    mouthId: z.number(),
    earsId: z.number(),
    hairId: z.number(),
    beardId: z.number(),
    tattooId: z.number(),
    scarId: z.number(),
    bodyArmor: z.string(),
  })
  .meta({ id: 'HeroAppearance' });

export type HeroAppearance = z.infer<typeof heroAppearanceSchema>;
