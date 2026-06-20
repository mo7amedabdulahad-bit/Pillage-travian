import { z } from 'zod';
import { resourceFieldCompositionSchema } from './resource-field-composition';
import { playableTribeSchema } from './tribe';

export const mapSizeSchema = z
  .union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)])
  .meta({ id: 'ServerMapSize' });

export const speedSchema = z
  .union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(10),
  ])
  .meta({ id: 'ServerSpeed' });

export const difficultySchema = z
  .enum(['skirmish', 'assault', 'siege'])
  .meta({ id: 'Difficulty' });

export type Difficulty = z.infer<typeof difficultySchema>;

export const gameModeSchema = z
  .enum(['standard', 'blitz'])
  .meta({ id: 'GameMode' });

export type GameMode = z.infer<typeof gameModeSchema>;

export const serverDbSchema = z
  .strictObject({
    id: z.string(),
    version: z.string(),
    name: z.string(),
    slug: z.string(),
    created_at: z.number(),
    seed: z.string(),
    map_size: mapSizeSchema,
    speed: speedSchema,
    player_name: z.string(),
    player_tribe: playableTribeSchema,
    starting_field_combination: resourceFieldCompositionSchema
      .nullable()
      .optional(),
    difficulty: difficultySchema.optional(),
    game_mode: gameModeSchema.optional(),
  })
  .transform((t) => {
    return {
      id: t.id,
      version: t.version,
      name: t.name,
      slug: t.slug,
      createdAt: t.created_at,
      seed: t.seed,
      configuration: {
        mapSize: t.map_size,
        speed: t.speed,
      },
      playerConfiguration: {
        name: t.player_name,
        tribe: t.player_tribe,
      },
      startingFieldCombination: t.starting_field_combination ?? undefined,
      difficulty: t.difficulty ?? 'assault',
      gameMode: t.game_mode ?? 'standard',
    };
  })
  .meta({ id: 'ServerDb' });

export const serverSchema = z
  .strictObject({
    id: z.string(),
    version: z.string(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.number(),
    seed: z.string(),
    configuration: z.strictObject({
      mapSize: mapSizeSchema,
      speed: speedSchema,
    }),
    playerConfiguration: z.strictObject({
      name: z.string(),
      tribe: playableTribeSchema,
    }),
    startingFieldCombination: resourceFieldCompositionSchema.optional(),
    difficulty: difficultySchema.optional(),
    gameMode: gameModeSchema.optional(),
  })
  .meta({ id: 'Server' });

export type Server = z.infer<typeof serverSchema>;
