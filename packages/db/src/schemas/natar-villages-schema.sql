CREATE TABLE natar_villages
(
  village_id INTEGER PRIMARY KEY,
  server_slug TEXT NOT NULL,
  construction_plan_available INTEGER NOT NULL DEFAULT 1,
  plan_holder_player_id INTEGER,

  FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
