CREATE TABLE natar_villages
(
  village_id INTEGER PRIMARY KEY,
  server_slug TEXT NOT NULL,
  is_ww_village INTEGER NOT NULL DEFAULT 0,
  ww_level INTEGER NOT NULL DEFAULT 0,
  construction_plan_available INTEGER NOT NULL DEFAULT 1,
  plan_holder_player_id INTEGER,
  attack_block_until INTEGER DEFAULT NULL,
  last_attacked_at INTEGER DEFAULT NULL,

  FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
