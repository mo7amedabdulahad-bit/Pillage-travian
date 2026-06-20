import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const serverSeeder = (database: DbFacade, server: Server): void => {
  const {
    id,
    seed,
    createdAt,
    slug,
    name,
    version,
    configuration,
    playerConfiguration,
    startingFieldCombination,
    difficulty,
    gameMode,
  } = server;
  const { speed, mapSize } = configuration;
  const { name: playerName, tribe } = playerConfiguration;

  // For Blitz mode, set protection to end 30 real-time minutes after creation
  const blitzProtectionEndsAt =
    gameMode === 'blitz' ? createdAt + 30 * 60 * 1000 : null;

  database.exec({
    sql: `
      INSERT INTO
        servers
      (id, version, name, slug, created_at, seed, speed, map_size, player_name, player_tribe, starting_field_combination, difficulty, game_mode, blitz_protection_ends_at)
      VALUES
        ($id, $version, $name, $slug, $created_at, $seed, $speed, $map_size, $player_name, $player_tribe, $starting_field_combination, $difficulty, $game_mode, $blitz_protection_ends_at);
    `,
    bind: {
      $id: id,
      $version: version,
      $name: name,
      $slug: slug,
      $created_at: createdAt,
      $seed: seed,
      $speed: speed,
      $map_size: mapSize,
      $player_name: playerName,
      $player_tribe: tribe,
      $starting_field_combination: startingFieldCombination ?? null,
      $difficulty: difficulty ?? 'assault',
      $game_mode: gameMode ?? 'standard',
      $blitz_protection_ends_at: blitzProtectionEndsAt,
    },
  });
};
