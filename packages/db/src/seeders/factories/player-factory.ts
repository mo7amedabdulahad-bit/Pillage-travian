import { type PRNGFunction, prngMulberry32 } from 'ts-seedrandom';
import {
  PLAYER_ID,
  usernameAdjectives,
  usernameNouns,
} from '@pillage-first/game-assets/player';
import type { Player } from '@pillage-first/types/models/player';
import type { Server } from '@pillage-first/types/models/server';
import type { PlayableTribe } from '@pillage-first/types/models/tribe';
import { calculateGridLayout } from '@pillage-first/utils/map';
import { seededRandomArrayElement } from '@pillage-first/utils/random';

type PlayerFactoryProps = {
  prng: PRNGFunction;
  id: number;
  factionId: number;
};

type PlayerModel = Omit<Player, 'slug' | 'faction'> & {
  factionId: number;
  personality: NpcPersonality;
};

export type NpcPersonality =
  | 'passive'
  | 'defensive'
  | 'balanced'
  | 'aggressive'
  | 'warlike';

const weightedPersonalities: [number, NpcPersonality][] = [
  [15, 'passive'],
  [45, 'defensive'],
  [75, 'balanced'],
  [95, 'aggressive'],
  [100, 'warlike'],
];

const pickPersonality = (prng: PRNGFunction): NpcPersonality => {
  const roll = Math.floor(prng() * 100) + 1;
  for (const [threshold, personality] of weightedPersonalities) {
    if (roll <= threshold) {
      return personality;
    }
  }
  return 'balanced';
};

const npcPlayerFactory = ({
  prng,
  id,
  factionId,
}: PlayerFactoryProps): PlayerModel => {
  const adjective = seededRandomArrayElement(prng, usernameAdjectives);
  const noun = seededRandomArrayElement(prng, usernameNouns);

  const paddedDiscriminator = `${id % 10_000}`.padStart(4, '0');

  const tribe = seededRandomArrayElement<PlayableTribe>(prng, [
    'romans',
    'gauls',
    'teutons',
    'egyptians',
    'huns',
  ]);

  const personality = pickPersonality(prng);

  return {
    id,
    name: `${adjective}${noun}#${paddedDiscriminator}`,
    tribe,
    factionId,
    personality,
  };
};

export const playerFactory = (
  server: Server,
  factionId: number,
): PlayerModel => {
  const {
    playerConfiguration: { name, tribe },
  } = server;

  return {
    id: PLAYER_ID,
    name,
    tribe,
    factionId,
    personality: 'balanced',
  };
};

export const generateNpcPlayers = (
  server: Server,
  npcFactionIds: number[],
): PlayerModel[] => {
  const prng = prngMulberry32(server.seed);

  const { mapSize } = server.configuration;

  // Players per tile. Is roughly equal to 1100 players per 100x100 map, 4200 for 200x000, 8500 for 300x300
  const playerDensity = 0.046;

  const { totalTiles } = calculateGridLayout(mapSize);

  const totalPlayerCount =
    Math.round((playerDensity * totalTiles + 1) / 100) * 100;

  // Subtract 1 player to account for player
  const npcCount = totalPlayerCount - 1;

  return Array.from({ length: npcCount }, (_, index) => {
    const factionId = seededRandomArrayElement(prng, npcFactionIds);
    // We do +2 because user's player always has the id of 1
    return npcPlayerFactory({ prng, id: index + 2, factionId });
  });
};
