CREATE TABLE world_wonders
(
  village_id INTEGER PRIMARY KEY,
  owner_player_id INTEGER,
  owner_faction_id TEXT NOT NULL,
  current_level INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  name TEXT DEFAULT NULL,
  last_attack_at INTEGER,
  next_attack_at INTEGER,

  FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
