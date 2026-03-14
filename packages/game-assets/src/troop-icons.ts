import type { Tribe } from '@pillage-first/types/models/tribe';
import type {
  EgyptianUnitId,
  GaulUnitId,
  HunUnitId,
  NatarUnitId,
  NatureUnitId,
  RomanUnitId,
  SpartanUnitId,
  TeutonUnitId,
} from '@pillage-first/types/models/unit';

export const UNITS_BASE_PATH = '/graphic-packs/day/icons/units' as const;

export const TRIBE_FOLDER_NAMES: Record<Tribe, string> = {
  romans: 'roman',
  teutons: 'teuton',
  gauls: 'gaul',
  egyptians: 'egyptian',
  huns: 'hun',
  spartans: 'spartan',
  natars: 'natar',
  nature: 'nature',
} as const;

export type SpriteUnitId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 901
  | 902
  | 903
  | 904;

export type TroopIconSize = 'small' | 'medium';

export type TroopImageSize = 'section' | 'full';

const ROMAN_UNIT_MAP: Record<RomanUnitId, SpriteUnitId> = {
  LEGIONNAIRE: 1,
  PRAETORIAN: 2,
  IMPERIAN: 3,
  ROMAN_SCOUT: 4,
  EQUITES_IMPERATORIS: 5,
  EQUITES_CAESARIS: 6,
  ROMAN_RAM: 7,
  ROMAN_CATAPULT: 8,
  ROMAN_CHIEF: 9,
  ROMAN_SETTLER: 10,
};

const GAUL_UNIT_MAP: Record<GaulUnitId, SpriteUnitId> = {
  PHALANX: 1,
  SWORDSMAN: 2,
  THEUTATES_THUNDER: 3,
  DRUIDRIDER: 4,
  HAEDUAN: 5,
  GAUL_SCOUT: 6,
  GAUL_RAM: 7,
  GAUL_CATAPULT: 8,
  GAUL_CHIEF: 9,
  GAUL_SETTLER: 10,
};

const TEUTON_UNIT_MAP: Record<TeutonUnitId, SpriteUnitId> = {
  CLUBSWINGER: 1,
  SPEARMAN: 2,
  AXEMAN: 3,
  TEUTONIC_SCOUT: 4,
  PALADIN: 5,
  TEUTONIC_KNIGHT: 6,
  TEUTONIC_RAM: 7,
  TEUTONIC_CATAPULT: 8,
  TEUTONIC_CHIEF: 9,
  TEUTONIC_SETTLER: 10,
};

const HUN_UNIT_MAP: Record<HunUnitId, SpriteUnitId> = {
  MERCENARY: 1,
  BOWMAN: 2,
  STEPPE_RIDER: 3,
  HUN_SCOUT: 4,
  MARKSMAN: 5,
  MARAUDER: 6,
  HUN_RAM: 7,
  HUN_CATAPULT: 8,
  HUN_CHIEF: 9,
  HUN_SETTLER: 10,
};

const EGYPTIAN_UNIT_MAP: Record<EgyptianUnitId, SpriteUnitId> = {
  SLAVE_MILITIA: 1,
  ASH_WARDEN: 2,
  KHOPESH_WARRIOR: 3,
  EGYPTIAN_SCOUT: 4,
  ANHUR_GUARD: 5,
  RESHEPH_CHARIOT: 6,
  EGYPTIAN_RAM: 7,
  EGYPTIAN_CATAPULT: 8,
  EGYPTIAN_CHIEF: 9,
  EGYPTIAN_SETTLER: 10,
};

const SPARTAN_UNIT_MAP: Record<SpartanUnitId, SpriteUnitId> = {
  HOPLITE: 1,
  SHIELDSMAN: 2,
  TWINSTEEL_THERION: 3,
  SPARTAN_SCOUT: 4,
  ELPIDA_RIDER: 5,
  CORINTHIAN_CRUSHER: 6,
  SPARTAN_RAM: 7,
  SPARTAN_CATAPULT: 8,
  SPARTAN_CHIEF: 9,
  SPARTAN_SETTLER: 10,
};

const NATAR_UNIT_MAP: Record<NatarUnitId, SpriteUnitId> = {
  PIKEMAN: 1,
  THORNED_WARRIOR: 2,
  GUARDSMAN: 3,
  NATARIAN_SCOUT: 4,
  AXERIDER: 5,
  NATARIAN_KNIGHT: 6,
  NATARIAN_RAM: 7,
  NATARIAN_CATAPULT: 8,
  NATARIAN_CHIEF: 9,
  NATARIAN_SETTLER: 10,
};

const NATURE_UNIT_MAP: Record<NatureUnitId, SpriteUnitId> = {
  RAT: 1,
  SPIDER: 2,
  SERPENT: 3,
  BAT: 4,
  WILD_BOAR: 5,
  WOLF: 6,
  BEAR: 7,
  CROCODILE: 8,
  TIGER: 9,
  ELEPHANT: 10,
};

export const UNIT_ID_TO_SPRITE_MAP: Record<
  Tribe,
  Record<string, SpriteUnitId>
> = {
  romans: ROMAN_UNIT_MAP,
  teutons: TEUTON_UNIT_MAP,
  gauls: GAUL_UNIT_MAP,
  egyptians: EGYPTIAN_UNIT_MAP,
  huns: HUN_UNIT_MAP,
  spartans: SPARTAN_UNIT_MAP,
  natars: NATAR_UNIT_MAP,
  nature: NATURE_UNIT_MAP,
};

export function getSpriteUnitId(
  tribe: Tribe,
  unitId: string,
): SpriteUnitId | null {
  const tribeMap = UNIT_ID_TO_SPRITE_MAP[tribe];
  return tribeMap[unitId] ?? null;
}

export function getTribeFolderName(tribe: Tribe): string {
  return TRIBE_FOLDER_NAMES[tribe];
}

export function getTroopSpritesheetPath(
  tribe: Tribe,
  size: TroopIconSize = 'small',
): string {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];
  return `${UNITS_BASE_PATH}/${tribeFolder}/spritesheet_${size}.png`;
}

export function getTroopSectionImagePath(
  tribe: Tribe,
  spriteId: SpriteUnitId,
): string {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];
  return `${UNITS_BASE_PATH}/${tribeFolder}/section/t${spriteId}.png`;
}

export function getTroopFullImagePath(
  tribe: Tribe,
  spriteId: SpriteUnitId,
): string {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe];
  return `${UNITS_BASE_PATH}/${tribeFolder}/full/t${spriteId}.png`;
}

export const TROOP_SPRITE_DIMENSIONS: Record<
  'small' | 'medium',
  { width: number; height: number; unitHeight: number }
> = {
  small: { width: 16, height: 160, unitHeight: 16 },
  medium: { width: 26, height: 260, unitHeight: 26 },
} as const;

export const UNITS_IN_SPRITESHEET = 10;

export function getTroopSpritePosition(spriteId: SpriteUnitId): number {
  return spriteId - 1;
}

export function getTroopSpritePositionPercent(spriteId: SpriteUnitId): string {
  const index = getTroopSpritePosition(spriteId);
  if (index >= UNITS_IN_SPRITESHEET) {
    return '0%';
  }
  return `${(index / (UNITS_IN_SPRITESHEET - 1)) * 100}%`;
}

export function isUnitInSpritesheet(spriteId: SpriteUnitId): boolean {
  return spriteId >= 1 && spriteId <= UNITS_IN_SPRITESHEET;
}

export const HERO_SPRITESHEET_PATHS = {
  small: `${UNITS_BASE_PATH}/default/spritesheet_small.png`,
  medium: `${UNITS_BASE_PATH}/default/spritesheet_medium.png`,
} as const;

export function getHeroImagePath(size: TroopIconSize = 'small'): string {
  return HERO_SPRITESHEET_PATHS[size];
}

export const HERO_STATES_BASE_PATH = '/graphic-packs/day/icons/hero/states';

export type HeroState =
  | 'alive'
  | 'dead'
  | 'home'
  | 'away'
  | 'reviving'
  | 'trapped';

export const HERO_STATE_IMAGES: Record<HeroState, string> = {
  alive: `${HERO_STATES_BASE_PATH}/heroHome.png`,
  dead: `${HERO_STATES_BASE_PATH}/heroDead.png`,
  home: `${HERO_STATES_BASE_PATH}/heroHome.png`,
  away: `${HERO_STATES_BASE_PATH}/heroRunning.png`,
  reviving: `${HERO_STATES_BASE_PATH}/heroReviving.png`,
  trapped: `${HERO_STATES_BASE_PATH}/heroTrapped.png`,
};
