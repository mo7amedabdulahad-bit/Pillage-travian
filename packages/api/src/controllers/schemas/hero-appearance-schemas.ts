import { z } from 'zod';
import { heroGenderSchema } from '@pillage-first/types/models/hero-appearance';

export const getHeroAppearanceSchema = z
  .strictObject({
    gender: heroGenderSchema,
    skin_color: z.string(),
    hair_color: z.string(),
    eye_color: z.string(),
    jaw_id: z.number(),
    eyes_id: z.number(),
    brows_id: z.number(),
    nose_id: z.number(),
    mouth_id: z.number(),
    ears_id: z.number(),
    hair_id: z.number(),
    beard_id: z.number(),
    tattoo_id: z.number(),
    scar_id: z.number(),
    body_armor: z.string(),
  })
  .transform((t) => ({
    gender: t.gender,
    skinColor: t.skin_color,
    hairColor: t.hair_color,
    eyeColor: t.eye_color,
    jawId: t.jaw_id,
    eyesId: t.eyes_id,
    browsId: t.brows_id,
    noseId: t.nose_id,
    mouthId: t.mouth_id,
    earsId: t.ears_id,
    hairId: t.hair_id,
    beardId: t.beard_id,
    tattooId: t.tattoo_id,
    scarId: t.scar_id,
    bodyArmor: t.body_armor,
  }))
  .pipe(
    z.strictObject({
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
    }),
  )
  .meta({ id: 'GetHeroAppearance' });
