import { clsx } from 'clsx';
import { type AnchorHTMLAttributes, use, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import {
  getWallBottomPath,
  getWallTopPath,
} from '@pillage-first/game-assets/village-page-assets';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField as BuildingFieldType } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import type { TimeOfDay } from '@pillage-first/types/models/preferences';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { Tribe } from '@pillage-first/types/models/tribe';
import buildingFieldStyles from 'app/(game)/(village-slug)/(village)/components/occupied-building-field.module.scss';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { BuildingUpgradeIndicator } from 'app/(game)/(village-slug)/components/building-upgrade-indicator';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useBookmarks } from 'app/(game)/(village-slug)/hooks/use-bookmarks';
import { useBuildingUpgradeStatus } from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import {
  BuildingUpgradeStatusContext,
  BuildingUpgradeStatusContextProvider,
} from 'app/(game)/(village-slug)/providers/building-upgrade-status-provider';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { useLongPress } from 'app/hooks/use-long-press';

const TRIBE_FOLDER_NAMES: Record<Tribe, string> = {
  teutons: 'teuton',
  gauls: 'gaul',
  romans: 'roman',
  egyptians: 'egyptian',
  huns: 'hun',
  spartans: 'spartan',
  natars: 'natar',
  nature: 'nature',
};

const AVAILABLE_BUILDING_GIDS = [
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '32',
  '32Top',
  '32Bottom',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '40_0',
  '40_1',
  '40_2',
  '40_3',
  '40_4',
  '40_5',
  '46',
  '49',
];

const GID_MAP: Record<string, string> = {
  SAWMILL: '5',
  BRICKYARD: '6',
  IRON_FOUNDRY: '7',
  GRAIN_MILL: '8',
  BAKERY: '9',
  WAREHOUSE: '10',
  GRANARY: '11',
  BLACKSMITH: '12',
  ARMOURY: '13',
  STABLE: '14',
  WORKSHOP: '21',
  TOURNAMENT_SQUARE: '16',
  MAIN_BUILDING: '15',
  EMBASSY: '18',
  MARKETPLACE: '17',
  BARRACKS: '19',
  ACADEMY: '22',
  CRANNY: '23',
  TOWN_HALL: '24',
  RESIDENCE: '25',
  PALACE: '26',
  TREASURY: '27',
  TRADE_OFFICE: '28',
  GREAT_BARRACKS: '29',
  GREAT_STABLE: '30',
  CITY_WALL: '32',
  EARTH_WALL: '32',
  STONE_WALL: '32',
  PALISADE: '32',
  ST_MASONS_LODGE: '34',
  HORSE_DRINKING_TROUGH: '35',
  GREAT_WAREHOUSE: '36',
  GREAT_GRANARY: '37',
  WORLD_WONDER: '40',
  RALLY_POINT: '16',
  HOSPITAL: '21',
  WATERWORKS: '38',
  TRAPPER: '39',
  BREWERY: '41',
  COMMAND_CENTER: '42',
  SMITHY: '13',
  ROMAN_WALL: '32',
  SPARTAN_WALL: '32',
  TEUTONIC_WALL: '32',
  HEROS_MANSION: '37',
  HUN_WALL: '32',
  GAUL_WALL: '32',
  EGYPTIAN_WALL: '32',
  NATURE_WALL: '0',
  NATAR_WALL: '32',
  CLAY_PIT: '2',
  WHEAT_FIELD: '4',
  WOODCUTTER: '1',
  IRON_MINE: '3',
};

const WALL_BUILDING_IDS = [
  'CITY_WALL',
  'EARTH_WALL',
  'STONE_WALL',
  'PALISADE',
  'ROMAN_WALL',
  'SPARTAN_WALL',
  'TEUTONIC_WALL',
  'HUN_WALL',
  'GAUL_WALL',
  'EGYPTIAN_WALL',
  'NATAR_WALL',
];

const HOVER_PATHS: Record<string, string> = {
  '23': 'M42.75 60c15.31-2.35 28.15-7.84 36.45-19.1 9.52 10.65 14.52 22.67 14.54 36.22l-8.47 18.09-3.27 7.33a29.35 29.35 0 00-14.17 9.28L47 110.68c-9.42-2.14-17.73-5.76-23.78-12.38L24 82.83l4.24-12.55z', // Cranny
  '10': 'M18.77 51.59a4.36 4.36 0 00-.57 1.91c-.1 1.4.3 2.5.8 2.5s1 7.1 1 18.8v18.7l9.3 4.7a93.79 93.79 0 008.81 3.8c8.23 3.27 11.08 11.26 23.46 8.73.23-.05 18.13-10.38 19.83-9.68 2.4.9 6.6.3 6.6-.9.1-.3.3-5.4.6-11.2l.6-10.7S82 69.14 84 57.5c1.8-1.1 1-2.2-3.7-4.9-5.1-2.8-7.2-4.1-11.3-6.7-2.44-1.58-4.72-2.49-6-2.26-12.49 2.36-24.83-1.79-25.43-1.59-2.39.78-18.49 9.13-18.8 9.54z', // Warehouse
  '11': 'M49.8 34c-9.91 4.2-17.86 10.08-23.66 17.82l1.72 51.07A60.59 60.59 0 0059 115.1a131 131 0 0029.21-19.79 76.16 76.16 0 00-.08-15C78.64 72.77 69.9 64.4 65.65 51.09 64.14 46.12 58.09 40.27 49.8 34z', // Granary
  '17': 'M20.9 53.6l-3 3.27s-5 10.23-5.64 10.43S8 84.7 8 86.3c0 1.84.28 3 1 3.75 1 .88 10.4 5.85 10.4 6.85 0 3.6 9.87 12.06 10.16 12.15s15.35 7.06 17.27 7.06 26.57 1.09 26.57 1.09 13.3-1.2 16.2-2.6a8.07 8.07 0 002.57-1.6c.64-.72 4.9-9.85 5.2-10.24.44-.57 6.23-10 6.43-11.43s1.5-2.6 3.7-3.4c4.3-1.6 6.3-5.6 4.4-9-1.5-2.9-3.4-4.9-4.7-4.9-.5 0-1.7-.9-2.8-2.1S96.47 62.39 89.07 59L75.9 52.6c-4.48-1.6-18.59-2.72-23.05-7.68.49 1.84-31.49 10.51-31.95 8.68z', // Marketplace
  '18': 'M103.76 44.06c-6-.57-6.44-6.44-17.43-7.42v-.15.2l-5.66 7.6S37.7 50 37.1 50s-3.3 2.15-3.46 2.4S23.6 66.75 23.12 67a2.45 2.45 0 00-1 1.78c-.3 1.2-2.1 3.1-4 4.3l-3.3 2 .5 8.7c.5 8 .3 9.2-1.9 12.7a24.4 24.4 0 00-2.4 4.8c0 .4 3.9 2.6 8.6 4.7l8.5 4s9.2-1 24.9 3c.58.15 9.4 5.2 10 5.5 1.38.12.68 0 2.48 0 5.13-7.66 8.67-10.16 19.79-15.72a68.4 68.4 0 0113.93-.73c-.33-4.56-.09-2.85-.25-11.41.94-11.42 4.83-30.64 5.13-39.74a18 18 0 00-.08-2.7 9.11 9.11 0 00-.26-4.12z', // Embassy
  '15': 'M31.7 24.8c-.8.9-4.35 5.35-5.35 5.25-1.73 1.73-8 10.85-10.85 16.45C6.7 63.9.67 65.06.38 65.16S2.4 83.1 2.7 86.6l.6 6.5 9.4 4.8 9.5 4.9s7-4.42 40.76 7.45c9.77-1 18.44 3.75 21 3.75 1.71 0 2.14-.2 2.65-.76 6.06-6.74 17.13-4.35 16.35-11.54-.73-6.66-4.46-28.08-4.26-28.25.42-.31-6.3-7.45-6.3-7.45S81.2 54.7 81.09 49.16C64.15 43.3 51.3 35.1 49.5 30.6c-1.3-3.2-1.9-3.6-5.1-3.6a19.09 19.09 0 01-7.3-2c-3.6-1.8-4-1.8-5.4-.2z', // Main Building
  '22': 'M47 45.3c-4.9 1.1-5.8 1.8-9.7 6.7-2.3 3-6.1 9.5-8.4 10.5-4.3 2-14.4 14.8-14.4 14.8l.2 9.5.1 9.6 10.6 5.3c8.5 4.3 10 10.67 13.2 13.2 2 1.6 4.1 2.1 8.6 2.1 4.16 0 7.16-.61 8.86-1.75s10.64-3.15 14.24-4.35c2.2-.7 4.4-2.1 5.1-3.2 1.4-2.4 7.8-5.7 11.1-5.7 4 0 10.5-3.7 10.5-6 0-1-.39-6.8-.09-13.4l.17-7.5-4.28-3.5c-1.5-1-2.8-2.3-2.8-3s-2-2.2-4.5-3.4c-3.8-1.8-4.5-2.6-4.5-5s-.7-3.2-4.2-4.8a59.61 59.61 0 01-9.2-5.3c-4.3-2.9-12.5-6.3-14.5-6-.3 0-3.1.6-6.1 1.2z', // Academy
  '19': 'M35.39 53.28c-3.72.23-9 14.86-22.26 16.06C12.88 69.36 6 96.4 6.2 96.5s8.2 4.4 17.9 9.4c16.7 8.6 17.7 9 20.7 7.9a9.92 9.92 0 015.2-.4l2-2.2c1.2-1.2 2.5-2.2 3-2.2s6.3-2.9 7.3-4.5C71.91 94.61 91.24 94 91.24 94s12.45-10 12.61-10.26c.27-.39-1.85-9.45-1.85-10.25 0-1.6-5.55-11-7.5-21.68-2.61.49-4.09-1.26-4.5-.82-3.9 4.16-25.88 2.51-37.22-1.88a27.08 27.08 0 01-17.39 4.17z', // Barracks
  '34': 'M47.42 30.81l-4.34 1.08C39 48.6 34.59 64.61 25.16 70.77c0 0-7.48 4.76-8.25 10.1-.73 5 .62 11.75.21 11.73l7.5 5.86 11.29 4.35c11.37-.83 21.31.67 28.56 6.51L74.9 107c1.5 0 27.4-11.66 29-12.27s-4.61-20.29-6.3-20.63c-10.8-6-17.4-15.06-18.89-27.91-13.32-3.38-24.81-7.89-31.29-15.38z', // Stonemason
  '16': 'M52 9.5L21.31 63.09c14.93 24 22.14 50.29 22.79 79.31 1.87 6.17 4.37 11.29 9.3 12.41l7.82 3.58c9.2.27 16.44-1.88 22.31-5.7 22-13.95 27.27-23.51 29.47-32.29-1.41-23.73-1.43-45.93.67-65.78C82.93 38.54 68.22 29.06 52 9.5z', // Rally Point
  '32_bottom':
    'M704 288v3.5c0 2.4-.6 3.7-2 4.5-1.6.9-2 2.1-2.1 6.8a33.68 33.68 0 01-1.2 9.2 8.66 8.66 0 01-3.9 4.8c-2.5 1.2-2.8 1.9-2.8 6a33.25 33.25 0 01-1.5 9 35 35 0 01-4.5 8 18.53 18.53 0 00-1.49 2.2l-.25-.22-32.84 37.54.41.36c-.46.43-.91.87-1.33 1.32a61.05 61.05 0 01-8.5 7c-3 2.1-6.1 4.8-6.8 6.2a9.42 9.42 0 01-4.3 3.5c-2.3.9-2.9 1.7-2.9 4.2s-.6 3.4-4 5.1a29.3 29.3 0 00-5.7 3.9 10.21 10.21 0 01-3.8 2.3 3 3 0 00-2.3 2.3c-.2 1.4-2.9 3.3-8.6 6.3-4.5 2.3-9.1 4.2-10.1 4.2a6.37 6.37 0 00-3.5 1.5c-.9.9-4.1 2.1-6.9 2.9s-6.1 1.2-7.1.9-2.4.4-3.3 1.7-3.7 2.7-7.3 3.6a51.43 51.43 0 00-10.3 4.1c-3.6 2.1-4.8 2.4-6.3 1.4a8 8 0 00-3.3-1.1c-.9 0-2 1.1-2.5 2.4-.7 2-1.9 2.6-5.7 3.2-2.6.3-8.3 2-12.7 3.6-6.4 2.5-8.2 2.8-10.2 1.9s-2.8-.7-4.9 1.3-4 2.5-12.8 3.1c-5.6.4-12.7.9-15.7 1s-8.8.8-12.8 1.4-8.3 1.6-9.4 2.2c-1.3.7-4.6.9-8.8.5-5.1-.5-6.9-.4-7.2.6-.3.8-3.6 1.6-8.9 2.1-4.6.5-13.6 1-19.9 1.2s-16.4.5-22.5.8-15.8.9-21.7 1.3c-10.6.7-10.8.7-10.8-1.5 0-1.4-.6-2.1-2-2.1a4.21 4.21 0 00-3.1 2.1c-1 1.9-1.7 2.1-7.2 1.5-3.4-.3-9.8-.6-14.2-.8-5.1-.1-8.6-.7-9.7-1.6a2.87 2.87 0 00-3.5-.4c-1.1.6-6.8.6-14.7.1-10.1-.7-13.1-1.2-14-2.5s-1.9-1.4-3.7-.8a9.82 9.82 0 01-3.4.5c-.5-.2-6.6-.7-13.5-1l-12.5-.6-.3-3.3c-.3-2.6-.7-3.2-2.8-3.2-1.9 0-2.4.5-2.4 2.4 0 1.4-.4 2.8-1 3.1a3.94 3.94 0 01-3-.5 46 46 0 00-9.5-2.5 55.05 55.05 0 01-11.8-3.7c-2.3-1.2-5.4-2.1-6.9-1.9s-4.8-.9-7.5-2.2a94.44 94.44 0 00-10.2-4.2c-2.9-.9-6.2-2.6-7.3-3.7a4.56 4.56 0 00-4-1.5c-1.1.3-4.8-.7-8.2-2.2s-7.4-3.3-8.9-3.9l-.61-.26h-.11c-.18-.07-.37-.14-.57-.2a13.63 13.63 0 00-1.43-.37L118.4 401.4c-1.8-1.9-3.7-3.4-4.2-3.4s-3.6-2.8-7-6.3-7.3-7.4-8.7-8.8-2.5-3.6-2.5-4.8a3.25 3.25 0 00-2.4-3c-1.3-.5-3.6-2.5-5.2-4.4a53.63 53.63 0 00-6.1-5.7c-2.6-1.8-3.3-3.1-3.3-5.6a18.8 18.8 0 00-.6-4.8c-.4-.9-1.8-1.6-3.4-1.6-2.4 0-3.3-.9-6.1-5.8-2.6-4.4-3.4-7.3-3.9-13-.4-4.6-1.2-7.7-2-8.2s-1.7-.7-2.1-.4-1.6-1.1-2.7-2.8c-1.3-2-2.3-6.1-2.8-10.6-.6-6.4-.9-7.3-3-7.8-1.8-.5-2.5-1.6-3.3-5.7a35.93 35.93 0 01-.9-7.2 34.67 34.67 0 00-1-7c-.6-2.8-1.4-7.1-1.7-9.7s-.1-4.9.4-5.3 1.3-2.7 1.7-5.3a47.79 47.79 0 012-7.9 26.56 26.56 0 001.4-8.8 62.76 62.76 0 012.5-14.1c1.4-4.7 2.5-9.4 2.5-9.4H33s-1.5 4-2.5 7a93.32 93.32 0 01-4.6 11.1 60 60 0 00-4 12.4c-.8 4.6-.8 7-.1 7.7s.8 2.4.5 4.2a27.15 27.15 0 00.5 7.3c.8 3.6.6 4.7-1.4 8.3-1.9 3.3-2.3 5-1.8 8.3.4 2.3 1.1 4.8 1.7 5.4s.6 2.7.3 4.5a91.19 91.19 0 00-1 10.5c-.2 4-.3 7.3-.1 7.3s1.6-.5 3.1-1c2.1-.8 2.9-.8 3.6.2a10.75 10.75 0 01.8 4.2 9.48 9.48 0 01-2.2 5.4l-2.3 2.5 2.3-.6c1.6-.4 2.5.1 3.4 1.6.7 1.2 1.1 4.4 1 7s.2 4.5.8 4.2 1.4.4 2 1.5c.9 1.7.8 2.7-.4 4.5a9.55 9.55 0 00-1.6 3.4c0 .5.8.8 1.7.7 1.4-.1 1.9 1.1 2.6 6.1.7 5.2 1.2 6.2 3.1 6.7a6 6 0 013.4 3.1 14.76 14.76 0 011.2 5.6c0 2.2.4 2.9 1.6 2.7 1-.2 2.3 1 3.5 3.1a25.16 25.16 0 002.9 4.5 7.6 7.6 0 011 4.1 9.28 9.28 0 00.8 4 11 11 0 002.7 2.1 11.14 11.14 0 013.5 4.1 29.81 29.81 0 004.5 6.1 58.42 58.42 0 015.3 6c1.2 1.7 2.2 3.9 2.2 5.1a16.89 16.89 0 001.6 5.5c1.4 2.8 2.4 3.5 5.6 4 2.2.4 3.6 1.1 3.3 1.6s.2 1 1.3 1a5.67 5.67 0 013.5 1.8 7.36 7.36 0 011.7 4.5c0 1.5.5 2.7 1 2.7a11.58 11.58 0 013.9 2.1c.26.19.52.36.78.52l.14.09c.25.15.5.28.74.4l52.28 31.65v.08c.08.15.17.29.25.42l.09.15.2.31.09.13c.1.13.19.25.28.35a5.45 5.45 0 003.7 1.8 2.42 2.42 0 01.45 0 3.11 3.11 0 01.49.11l3.11 1.89c1 1.1 4.2 3.1 7.2 4.5s5.3 3 5.3 3.5 1.5 1 3.3 1a16.57 16.57 0 016.1 1.5 13.06 13.06 0 004.5 1.5 4.37 4.37 0 012.4.6c.4.4 3 .9 5.9 1.1a37.48 37.48 0 0111.5 3.5c4.2 2 7.1 2.9 8.9 2.5 1.5-.3 6.4.1 10.8.9s9.6 2.1 11.5 3c2.8 1.3 3.7 1.4 5.7.4 1.6-.9 2.7-1 3.6-.3a12.08 12.08 0 003.6 1.8c1.6.5 3.1 0 5.3-1.9 1.7-1.4 3.4-2.6 3.9-2.6s2.1 1.1 3.7 2.4c2.2 1.9 3.1 2.1 4.5 1.3s2.2-.7 4.1 1.1c1.3 1.2 3.1 2.2 4 2.2a2.58 2.58 0 012.3 1.5 3 3 0 002.5 1.5 7.72 7.72 0 003.8-1.2c1.5-.9 2.4-.6 5.3 1.5 1.9 1.5 3.9 2.7 4.5 2.7a6.31 6.31 0 002.8-2c1.3-1.5 3.1-2 6.5-2 2.5 0 5 .4 5.5.9s3.6 1.1 6.7 1.4c4.8.5 6.2.2 8.3-1.5 2.3-1.7 3-1.9 5.5-.8s3 1.9 3 4.4c0 1.7.4 2.6.8 2.1a45.51 45.51 0 013.9-3.9c2.7-2.4 3.5-2.7 4.8-1.6.8.7 1.5 2.8 1.5 5 0 2 .3 3.9.6 4.2s1.7 0 3.2-.8a12 12 0 014.5-1.4c.9 0 3.1-1.4 4.9-3s3.9-3 4.8-3a4.71 4.71 0 013.1 1.6 3.28 3.28 0 003.6.9 6.67 6.67 0 014.9 1.2c2.2 1.4 2.7 1.4 3.5.2a9.09 9.09 0 00.9-4 5.79 5.79 0 011.5-3.9c1.2-1 2-.9 4.2.6a20 20 0 003.3 1.9 5.9 5.9 0 011.9.9c.9.6 1.74 0 2.34-1.12.5-.9 2.26-2 3.86-2.88s3.7-1.3 4.5-1a5.87 5.87 0 013.26 3 18.1 18.1 0 01.91 7.89c-.2 2.7-.43 3.58.07 2.18s2.86-2.73 6.06-4.43c3.5-2 5.8-2.7 6.5-2.1s3.5 1.1 6.3 1.2c4.2.2 5.8-.2 8.5-2.3a16.71 16.71 0 015.4-3c1.4-.2 2.62-1.76 2.2 2.4.2 1.6.8 2.8 1.3 2.8a.9.9 0 00.9-.9c0-.5 1.3-1.2 2.9-1.6a14 14 0 005.6-3.2l2.07-2.46-3-2c-2.1-1.7-1.57-2.62-.77-3.52a4.39 4.39 0 013.31-1c1.8.2 3.16.7 3.16 2.6a4.86 4.86 0 001.62 3.59c1.2.9 5 1.31 15.17 1 11.2-.3 15.2-.7 17.9-2.1a26.38 26.38 0 018.7-2.2c3-.3 5.6-.8 5.9-1.3s1.8-.9 3.3-.9a25.38 25.38 0 006.2-1.1 19.11 19.11 0 005-2.6c1.4-1.1 2-1 4.2.7a10.56 10.56 0 005.5 2c2.3 0 3.8-1 6.6-4.3l3.5-4.2 3.3 1.8a19.85 19.85 0 007.8 1.8 53.07 53.07 0 005.8 0c.7-.1 2.6-1.5 4.2-3.3 2.6-2.9 3.2-3 5.5-2a13 13 0 004.9 1.2c1.3 0 2.6-.6 2.9-1.4s2.9-1.6 6.2-2.1q5.55-.6 7.5-2.7a4 4 0 014.5-1.4c2 .5 2.7.2 3.4-1.6.5-1.3 2.9-4 5.4-6s5.2-3.8 6.1-3.8a2.06 2.06 0 011.8 1c.2.6 1.2.3 2.3-.7a10.39 10.39 0 015-2.2 6.63 6.63 0 004.3-2.2c.7-1 1.8-1.9 2.3-1.9a13.79 13.79 0 003.9-2.1c2.3-1.8 3.7-2 7-1.5 4.1.6 4.2.6 3.6-1.8a8.93 8.93 0 010-4A2.65 2.65 0 01633 450a6.07 6.07 0 003.5-2 6 6 0 012.9-2c.6-.1 2.2-1.8 3.6-3.9s8.1-9.8 15-17c8.2-8.7 13.1-13.1 14.3-12.9 1 .2 2.2-.7 3-2.2a4.37 4.37 0 013.8-2.6 11.4 11.4 0 003.8-.8 1.38 1.38 0 00.26-.23l.06-.07a2.35 2.35 0 00.19-.25l.05-.07a3.56 3.56 0 00.37-.84L709.5 365a3.93 3.93 0 001-3.9c-.4-1.2-.2-2.1.4-2.1s1.1-2.1 1.1-4.9c0-3.1.5-5.3 1.5-6.1a18.49 18.49 0 003-4.3 16.6 16.6 0 001.5-6.2c0-1.7.4-3.5 1-4.1s.6-2.4 0-4.9a47.11 47.11 0 01-1-8.6c0-2.9.6-5.1 1.5-5.9a3.51 3.51 0 013.1-.6 4.21 4.21 0 012.1 2.7c.5 1.8.9 1.3 2.4-2.6a18.55 18.55 0 001.2-9.6c-.5-3.9-.3-4.9.9-4.9a5.34 5.34 0 003.1-1.8c1-1 1.7-3.5 1.7-5.5V288z',
  '32_top':
    'M733.7 282a43 43 0 00-1.8-5.5 18.59 18.59 0 01-1.3-4 14.3 14.3 0 00-2.3-4.8 7.75 7.75 0 01-1.9-4.2c-.2-1.8.2-2.5 1.4-2.5 1.4 0 1.7-.9 1.6-4.8a20.82 20.82 0 00-.7-6.2c-.3-.8-1.5-4.7-2.6-8.7a54 54 0 01-2.1-8.8c0-.9.5-1.3 1-1s1 0 1-.7-2.3-4.2-5-7.7-5-7.4-5-8.5a6.54 6.54 0 00-1.3-3.5 46.87 46.87 0 01-3.7-7.1 81.32 81.32 0 00-4.7-9c-1.3-1.9-2.3-4.2-2.3-5.1s-3.6-5.7-8.1-10.5-9.8-11.2-11.9-13.9a146.36 146.36 0 00-12.7-13c-4.8-4.4-12.8-11.2-17.7-15s-9.7-7.8-10.7-8.8a9.55 9.55 0 00-2.5-1.7c-.4 0-2.3-1.4-4.3-3s-4-3.4-4.6-3.8a8.42 8.42 0 00-2.5-1.3l-60.3-33.2a29.21 29.21 0 00-8.7-3.6c-3-.8-9.5-2.7-14.5-4.3s-11.2-3.9-14-5.2a69.07 69.07 0 00-13-4.1c-4.4-1-9-2.1-10.3-2.6a15 15 0 00-4.5-.9c-1.2 0-4.6-1-7.7-2.1s-7.3-3-9.6-4a20.27 20.27 0 00-7.3-1.9 22.83 22.83 0 01-8.1-2.5c-4.6-2.3-6-2.5-18.8-2.5-7.6 0-14.2-.4-14.8-.9a31 31 0 00-6.3-2.5 34 34 0 00-11.5-1.5c-4.5.2-7-.2-9.6-1.6-3.1-1.7-6.1-1.9-26-2.1-12.4-.1-23.2.1-24 .6s-9.4 1.1-19 1.5c-12.6.5-19.1 1.2-23 2.5a65.57 65.57 0 01-13 2.4 111.73 111.73 0 00-13.3 2.2 87.81 87.81 0 01-9.5 1.9c-2 .2-10.1 1.8-18 3.4s-17.6 3.9-21.7 5a53.78 53.78 0 01-10 2.1c-1.3 0-2.6.4-2.9.9s-2.7 1.4-5.3 2.1-7.7 2.4-11.3 3.8-9.2 3.3-12.5 4.4a55.1 55.1 0 00-10 4.6c-2.2 1.5-4.4 3.2-5 3.7a7.45 7.45 0 00-1.3 2.5c-.2.8-57.49 31.6-57.49 31.6-1.38.53-3 1.12-4.71 1.7a156.15 156.15 0 00-15.9 6.7c-4.6 2.3-10 5.6-11.9 7.3S88.1 140 85 143s-7.1 7.5-9.1 10a95.24 95.24 0 00-6.1 9 113.61 113.61 0 01-8.5 12c-3.2 4.1-8.3 11.5-11.4 16.5s-8.1 14-11.2 20.1A133.35 133.35 0 0033 224h23s5.1-5.6 7.2-8.1 3.8-5.1 3.8-5.6 1.6-2.3 3.5-4.2 3.5-4.2 3.5-5.3 2.4-4.4 5.3-7.2a38.78 38.78 0 016.9-5.9c.9-.3 2.6-2.6 3.7-5.1 1.3-3 3-5 4.8-5.8a24.55 24.55 0 005.6-3.7c1.5-1.3 2.7-3 2.7-3.6s1.5-2.5 3.3-4.2a19.2 19.2 0 015-3.6 2.75 2.75 0 001.7-2 4.67 4.67 0 011.8-2.9 17.72 17.72 0 015.7-2.8 25 25 0 005.5-2.4 32.3 32.3 0 016-3.3 41.25 41.25 0 018.1-2.8c2.1-.3 4.2-1.2 4.9-2a5.36 5.36 0 013.5-1.5 40.33 40.33 0 005.4-.6 7.61 7.61 0 004-2.31c10.78-5.5 35.64-18.62 36.9-19.19 1.7-.7 3.3-2.1 3.5-3.1a4.26 4.26 0 011.48-1.88l1.42-.82a13.06 13.06 0 004.2-3 7 7 0 015.1-2.1c2.3 0 3.4-.5 3.8-1.9.2-1 1.9-2.6 3.7-3.5a18.88 18.88 0 017.1-1.6c2.1 0 4.1-.5 4.5-1.1s2.1-.9 4.4-.5c2.8.4 4.1.2 5.1-1a3.65 3.65 0 013.1-1.1 7.54 7.54 0 004.6-.9 13.07 13.07 0 015.1-1.4 8 8 0 004.4-1.7c1.3-1.2 3.8-1.9 8-2a95.94 95.94 0 0010.5-.9c2.3-.3 4.5-1 4.8-1.5s2-.9 3.7-.9a14.62 14.62 0 005.9-1.4c1.8-1 5.3-1.3 10.7-1.2 4.5.2 8.4.6 8.8.9a2.74 2.74 0 001.9.7c.8 0 4.3-1.4 7.9-3 5.9-2.7 7.5-3 16.8-3 6.1 0 10.7.4 11.4 1.1s1.7.7 3.4-.2c1.5-.8 8.9-1.6 19.8-2 9.9-.4 18.2-.4 19.1.1a18.49 18.49 0 005.4 1.3 14.14 14.14 0 014 .8c.3.3 5.1.1 10.8-.3 6.4-.5 11.4-.4 13.2.2a19.55 19.55 0 005.7 1c1.6 0 3 .6 3 1.2a8.07 8.07 0 010 2.2c-.1.5 1 .5 2.6 0s9.5-.8 17.6-.9c11 0 15 .3 15.6 1.3.4.7 2.1 1.2 3.7 1.1s6.1.8 10 1.9a50 50 0 0010 2.2 18.8 18.8 0 016.9 2 21.87 21.87 0 009.2 2c2.8 0 5.4.4 5.7.9a9.09 9.09 0 004 1.4c1.8.3 7.1 2.4 11.7 4.7s11.4 5.8 15.1 7.8 7.7 4.5 9.1 5.5a6.08 6.08 0 002.32 1.12l58.16 28a1.36 1.36 0 001.22.58 4.57 4.57 0 013 1.5 4.31 4.31 0 002.4 1.5c.7 0 2.5 1.4 4.2 3.1a23.26 23.26 0 006.2 4.5 14.57 14.57 0 015.2 3.6 9.49 9.49 0 012 4.4c0 1.7.8 2.3 3.4 2.8a11.17 11.17 0 004.8.1 3.15 3.15 0 013 1.2 8.2 8.2 0 011.9 3.7c.3 1.4 1.8 2.3 5.3 3.2a19.3 19.3 0 018.2 4.5c1.9 1.8 3.4 3.9 3.4 4.7s1.7 3.2 3.8 5.2a64.44 64.44 0 017 8.8c1.7 2.9 3.2 6 3.2 7.1a4.8 4.8 0 001.5 3.1 5.1 5.1 0 011.5 3.4c0 1.2 1.4 3.5 3 5.1 2 1.9 3 3.9 3 5.8s1.2 4.5 3.5 7.3a34.28 34.28 0 014.5 6.9 22.23 22.23 0 011 6.1c0 2 1.2 6.5 2.6 10.1a40.22 40.22 0 012.9 10.7 29.47 29.47 0 001 5.9c.4 1 .4 4.5.1 7.8S704 288 704 288h30a22.94 22.94 0 00-.3-6z',
  '0': 'M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z', // Empty Site
};

const getGidFromBuildingId = (bid: string): string => {
  return GID_MAP[bid] || '0';
};

const isWallBuilding = (bid: string): boolean => {
  return WALL_BUILDING_IDS.includes(bid);
};

const getVillageBuildingImagePath = (
  tribe: Tribe,
  gid: string,
  theme: TimeOfDay,
): string => {
  const tribeFolder = TRIBE_FOLDER_NAMES[tribe] || 'teuton';

  if (AVAILABLE_BUILDING_GIDS.includes(gid)) {
    if (gid === '32') {
      return `/graphic-packs/${theme}/buildings/${tribeFolder}/g32Top.png`;
    }
    return `/graphic-packs/${theme}/buildings/${tribeFolder}/g${gid}.png`;
  }

  const fallbackGids = ['15', '16', '17', '18', '19', '22', '23', '26', '34'];
  const fallbackGid =
    fallbackGids.find((fg) => AVAILABLE_BUILDING_GIDS.includes(fg)) || '26';

  return `/graphic-packs/${theme}/buildings/${tribeFolder}/g${fallbackGid}.png`;
};

const transformBuildingIdIntoCssClass = (
  buildingId: Building['id'],
): string => {
  return buildingId.toLowerCase().replaceAll('_', '-');
};

type DynamicCellClassesArgs = {
  buildingField: BuildingFieldType;
  resourceFieldComposition: ResourceFieldComposition;
};

const dynamicCellClasses = ({
  buildingField,
  resourceFieldComposition,
}: DynamicCellClassesArgs): string => {
  const { buildingId, id } = buildingField;
  const isResourceField = id <= 18;

  if (isResourceField) {
    return clsx(
      buildingFieldStyles.building,
      `rfc-${resourceFieldComposition}`,
      buildingFieldStyles['building-resource'],
      buildingFieldStyles[`building-resource-${id}`],
    );
  }

  const buildingIdToCssClass = transformBuildingIdIntoCssClass(buildingId);

  return clsx(
    buildingFieldStyles.building,
    buildingFieldStyles[`building-village-${buildingIdToCssClass}`],
  );
};

type OccupiedBuildingFieldProps = {
  buildingField: BuildingFieldType;
};

export const OccupiedBuildingField = ({
  buildingField,
}: OccupiedBuildingFieldProps) => {
  const { t } = useTranslation();
  const { currentVillageBuildingEvents } = use(
    CurrentVillageBuildingQueueContext,
  );
  const { bookmarks } = useBookmarks();

  const { id: buildingFieldId, buildingId, level } = buildingField;

  const buildingDefinition = getBuildingDefinition(buildingId);
  const isMaxLevel = buildingDefinition.maxLevel === level;

  const tab = bookmarks[buildingId] ?? 'default';

  const currentBuildingFieldBuildingEvent = useMemo(() => {
    return currentVillageBuildingEvents.find(
      ({ buildingFieldId: buildingEventBuildingFieldId }) =>
        buildingEventBuildingFieldId === buildingFieldId,
    );
  }, [currentVillageBuildingEvents, buildingFieldId]);

  const content = (
    <OccupiedBuildingFieldContent
      buildingField={buildingField}
      currentBuildingFieldBuildingEvent={currentBuildingFieldBuildingEvent}
      tab={tab}
      canUpgrade={!isMaxLevel}
    />
  );

  if (isMaxLevel) {
    const status = {
      variant: 'blue' as const,
      errors: [t("Building can't be upgraded any further")],
    };

    return (
      <BuildingUpgradeStatusContext value={status}>
        {content}
      </BuildingUpgradeStatusContext>
    );
  }

  return (
    <OccupiedBuildingFieldActive
      buildingField={buildingField}
      currentBuildingFieldBuildingEvent={currentBuildingFieldBuildingEvent}
      tab={tab}
    />
  );
};

type OccupiedBuildingFieldActiveProps = {
  buildingField: BuildingFieldType;
  currentBuildingFieldBuildingEvent: BuildingEvent | undefined;
  tab: string;
};

const OccupiedBuildingFieldActive = ({
  buildingField,
  currentBuildingFieldBuildingEvent,
  tab,
}: OccupiedBuildingFieldActiveProps) => {
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const { id: buildingFieldId, buildingId } = buildingField;

  const { errors } = useBuildingUpgradeStatus(buildingField);
  const { upgradeBuilding } = useBuildingActions(buildingId, buildingFieldId);

  const onLongPress = () => {
    if (errors.length === 0) {
      upgradeBuilding();
    }
  };

  const longPress = useLongPress(onLongPress, 1000);

  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <BuildingUpgradeStatusContextProvider buildingField={buildingField}>
      <OccupiedBuildingFieldContent
        buildingField={buildingField}
        currentBuildingFieldBuildingEvent={currentBuildingFieldBuildingEvent}
        tab={tab}
        canUpgrade={errors.length === 0}
        {...(isWiderThanLg
          ? {
              onMouseEnter: () => setIsHovered(true),
              onMouseLeave: () => setIsHovered(false),
              onFocus: () => setIsHovered(true),
              onBlur: (e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsHovered(false);
                }
              },
            }
          : longPress)}
        isHovered={isHovered}
      />
    </BuildingUpgradeStatusContextProvider>
  );
};

type OccupiedBuildingFieldContentProps = {
  buildingField: BuildingFieldType;
  currentBuildingFieldBuildingEvent: BuildingEvent | undefined;
  tab: string;
  isHovered?: boolean;
  canUpgrade?: boolean;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const OccupiedBuildingFieldContent = ({
  buildingField,
  currentBuildingFieldBuildingEvent,
  tab,
  isHovered = false,
  canUpgrade = true,
  ...props
}: OccupiedBuildingFieldContentProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const tribe = useTribe();

  const { id: buildingFieldId, buildingId, level } = buildingField;
  const _hasEvent = !!currentBuildingFieldBuildingEvent;
  const isVillageBuilding = buildingFieldId >= 19;

  const getTribeClass = (tribeValue: Tribe): string => {
    const tribeMap: Record<Tribe, string> = {
      teutons: 'teuton',
      gauls: 'gaul',
      romans: 'roman',
      egyptians: 'egyptian',
      huns: 'hun',
      spartans: 'spartan',
      nature: 'nature',
      natars: 'natars',
    };
    return tribeMap[tribeValue] || 'teuton';
  };

  const dorf2Classes = isVillageBuilding
    ? clsx(
        'level',
        'colorLayer',
        canUpgrade ? 'good' : 'notNow',
        `aid${buildingFieldId}`,
        `g${getGidFromBuildingId(buildingId)}`,
        getTribeClass(tribe),
      )
    : '';

  return (
    <Link
      to={{
        pathname: `${buildingFieldId}`,
        search: `tab=${tab}`,
      }}
      aria-label={t(`BUILDINGS.${buildingId}.NAME`)}
      data-building-field-id={buildingFieldId}
      data-aid={buildingFieldId}
      data-gid={getGidFromBuildingId(buildingId)}
      data-level={level}
      data-building-id={buildingFieldId}
      data-name={t(`BUILDINGS.${buildingId}.NAME`)}
      tabIndex={0}
      className={clsx(
        'group',
        // size handles standard vs non standard
        isVillageBuilding && 'building-slot',
        dorf2Classes,
        buildingFieldId <= 18 &&
          dynamicCellClasses({
            buildingField,
            resourceFieldComposition: currentVillage.resourceFieldComposition,
          }),
        isVillageBuilding
          ? 'absolute inset-0 w-full h-full select-none focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring'
          : 'absolute inset-0 size-10 lg:size-16 select-none focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring',
      )}
      {...props}
    >
      {isVillageBuilding && !isWallBuilding(buildingId) && (
        <>
          <img
            src={getVillageBuildingImagePath(
              tribe,
              getGidFromBuildingId(buildingId),
              'day',
            )}
            alt={t(`BUILDINGS.${buildingId}.NAME`)}
            className={clsx(
              'absolute max-w-none transition-all duration-200 pointer-events-none group-hover:brightness-125',
              `g${getGidFromBuildingId(buildingId)}`,
              getTribeClass(tribe),
            )}
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            className="absolute inset-0 buildingShape w-full h-full pointer-events-none"
          >
            <title>{t(`BUILDINGS.${buildingId}.NAME`)}</title>
            <g className="hoverShape transition-colors duration-150">
              <path
                d={
                  HOVER_PATHS[getGidFromBuildingId(buildingId)] ||
                  HOVER_PATHS['0']
                }
                className="fill-transparent pointer-events-auto transition-colors duration-150"
              />
            </g>
          </svg>
        </>
      )}
      {isVillageBuilding && isWallBuilding(buildingId) && (
        <>
          <img
            src={getWallBottomPath(tribe, 'default', 'day')}
            alt={t(`BUILDINGS.${buildingId}.NAME`)}
            className={clsx(
              'absolute inset-0 max-w-none transition-all duration-200 pointer-events-none group-hover:brightness-125',
              'g32Bottom',
              getTribeClass(tribe),
            )}
            style={{
              zIndex: 42,
              width: '100%',
              height: '100%',
            }}
          />
          <img
            src={getWallTopPath(tribe, 'default', 'day')}
            alt={t(`BUILDINGS.${buildingId}.NAME`)}
            className={clsx(
              'absolute inset-0 max-w-none transition-all duration-200 pointer-events-none group-hover:brightness-125',
              'g32Top',
              getTribeClass(tribe),
            )}
            style={{
              zIndex: 0,
              width: '100%',
              height: '100%',
            }}
          />
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 794 540"
            className="absolute inset-0 buildingShape g32Bottom pointer-events-none z-[43]"
            preserveAspectRatio="xMidYMid meet"
          >
            <title>{t(`BUILDINGS.${buildingId}.NAME`)}</title>
            <g className="hoverShape transition-colors duration-150 fill-transparent pointer-events-auto">
              <path d={HOVER_PATHS['32_bottom']} />
              <path d={HOVER_PATHS['32_top']} />
            </g>
          </svg>
        </>
      )}
      <div
        className={clsx(
          'absolute z-20',
          isWallBuilding(buildingId)
            ? 'top-[10%] left-[45%]'
            : 'absolute-centering',
        )}
      >
        <BuildingUpgradeIndicator
          isHovered={isHovered}
          buildingField={buildingField}
          buildingEvent={currentBuildingFieldBuildingEvent}
        />
      </div>
    </Link>
  );
};
