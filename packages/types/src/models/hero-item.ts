import { z } from 'zod';
import type { Effect } from './effect';

export type HeroItemTier = 1 | 2 | 3;
export type HeroItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type HeroItemCategory =
  | 'helmet'
  | 'armour'
  | 'boots'
  | 'left-hand'
  | 'right-hand'
  | 'horse'
  | 'consumable'
  | 'artifact'
  | 'construction_plan';

export type HeroItemSlot =
  | 'head'
  | 'torso'
  | 'boots'
  | 'right-hand'
  | 'left-hand'
  | 'horse'
  | 'consumable'
  | 'non-equipable';

export type HeroItemTribe =
  | 'romans'
  | 'gauls'
  | 'teutons'
  | 'huns'
  | 'egyptians'
  | 'spartans'
  | 'vikings'
  | 'any';

export type HeroBonus = {
  attribute:
    | 'power'
    | 'speed'
    | 'experience'
    | 'health'
    | 'culturePoints'
    | 'infantryTraining'
    | 'cavalryTraining'
    | 'damageReduction'
    | 'troopSpeed'
    | 'heroSpeed'
    | 'crannyReduction'
    | 'returnSpeed'
    | 'ownVillageSpeed'
    | 'allianceSpeed'
    | 'natarBonus'
    | 'unitAttack'
    | 'unitDefence';
  value: number;
  unit?: string;
};

export type HeroItem = {
  id: number;
  imageId: number;
  name: string;
  displayName: string;
  description: string;
  slot: HeroItemSlot;
  tier?: HeroItemTier;
  rarity: HeroItemRarity;
  category: HeroItemCategory;
  tribe: HeroItemTribe;
  basePrice: number | null;
  effects?: Omit<Effect, 'sourceSpecifier' | 'villageId'>[];
  heroBonus?: HeroBonus[];
  consumable?: boolean;
  stackable?: boolean;
};

export const heroItemSchema = z
  .strictObject({
    id: z.number(),
    amount: z.number().int().positive(),
  })
  .meta({ id: 'HeroItem' });
