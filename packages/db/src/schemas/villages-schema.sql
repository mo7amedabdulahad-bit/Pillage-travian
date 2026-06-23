CREATE TABLE villages
(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  tile_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  tribe_id INTEGER,
  loyalty INTEGER NOT NULL DEFAULT 100,
  loyalty_updated_at INTEGER,
  is_world_wonder_village INTEGER NOT NULL DEFAULT 0,
  world_wonder_level INTEGER NOT NULL DEFAULT 0,
  construction_plan_held INTEGER NOT NULL DEFAULT 0,

  UNIQUE (tile_id),

  FOREIGN KEY (tile_id) REFERENCES tiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (tribe_id) REFERENCES tribe_ids (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) STRICT;
