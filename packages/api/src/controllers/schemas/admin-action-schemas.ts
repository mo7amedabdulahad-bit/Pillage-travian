import { z } from 'zod';

const troopEntry = z.strictObject({
  unitId: z.string(),
  amount: z.number().min(0),
});

export const adminSpawnTroopsSchema = z.strictObject({
  villageId: z.number(),
  troops: z.array(troopEntry),
});

export const adminRemoveTroopsSchema = z.strictObject({
  villageId: z.number(),
  troops: z.array(troopEntry),
});

export const adminSetResourcesSchema = z.strictObject({
  villageId: z.number(),
  lumber: z.number().min(0),
  clay: z.number().min(0),
  iron: z.number().min(0),
  crop: z.number().min(0),
});

export const adminAddResourcesSchema = z.strictObject({
  villageId: z.number(),
  lumber: z.number(),
  clay: z.number(),
  iron: z.number(),
  crop: z.number(),
});

export const adminUpgradeBuildingSchema = z.strictObject({
  villageId: z.number(),
  fieldId: z.number(),
  targetLevel: z.number().min(1).max(100),
});

export const adminDowngradeBuildingSchema = z.strictObject({
  villageId: z.number(),
  fieldId: z.number(),
  targetLevel: z.number().min(0).max(100),
});

export const adminSpawnHeroItemSchema = z.strictObject({
  heroId: z.number(),
  itemId: z.number(),
  amount: z.number().min(1).default(1),
});

export const adminSetHeroHealthSchema = z.strictObject({
  heroId: z.number(),
  health: z.number().min(0),
});

export const adminLevelUpHeroSchema = z.strictObject({
  heroId: z.number(),
  levels: z.number().min(1).default(1),
});

export const adminCreateNatarVillageSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
  garrisonStrength: z.number().min(0).default(0),
});

export const adminGrantConstructionPlanSchema = z.strictObject({
  heroId: z.number(),
});

export const adminStartWorldWonderSchema = z.strictObject({
  villageId: z.number(),
});

export const adminSetWorldWonderLevelSchema = z.strictObject({
  villageId: z.number(),
  level: z.number().min(0).max(20),
});

export const adminEndServerSchema = z.strictObject({
  winnerType: z.enum(['player', 'natars']),
});

export const adminTriggerNpcBrainTickSchema = z.strictObject({});

export const adminSetGameSpeedSchema = z.strictObject({
  speed: z.number().min(0.5).max(10),
});

export const adminSetNpcAggressionSchema = z.strictObject({
  villageId: z.number(),
  aggressionLevel: z.number().min(0).max(5),
});

export const adminCancelRetaliationSchema = z.strictObject({
  retaliationId: z.number(),
});

export const adminCancelEventSchema = z.strictObject({
  eventId: z.number(),
});

export const adminTeleportVillageSchema = z.strictObject({
  villageId: z.number(),
  x: z.number(),
  y: z.number(),
});

export const adminRenameVillageSchema = z.strictObject({
  villageId: z.number(),
  name: z.string().min(1).max(50),
});

export const adminDeleteVillageSchema = z.strictObject({
  villageId: z.number(),
});

export const adminActionResponseSchema = z.strictObject({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});
