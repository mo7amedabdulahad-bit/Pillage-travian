CREATE TABLE servers
(
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  seed TEXT NOT NULL,
  speed INTEGER CHECK (speed IN (1, 2, 3, 5, 10, 200)) NOT NULL,
  map_size INTEGER CHECK (map_size IN (25, 50, 75, 100)) NOT NULL,
  player_name TEXT NOT NULL,
  player_tribe TEXT CHECK (player_tribe IN ('romans', 'gauls', 'teutons', 'huns', 'egyptians')) NOT NULL,
  starting_field_combination TEXT CHECK (starting_field_combination IS NULL OR starting_field_combination IN ('4446','5436','5346','4536','3546','4356','3456','4437','4347','3447','3339','11115','00018')),
  difficulty TEXT NOT NULL DEFAULT 'assault' CHECK (difficulty IN ('skirmish', 'assault', 'siege')),
  game_mode TEXT NOT NULL DEFAULT 'standard' CHECK (game_mode IN ('standard', 'blitz')),
  blitz_protection_ends_at INTEGER
) STRICT, WITHOUT ROWID;
