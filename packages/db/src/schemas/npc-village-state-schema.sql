CREATE TABLE npc_village_state
(
  village_id INTEGER PRIMARY KEY,
  last_interacted_at INTEGER NOT NULL DEFAULT 0,
  times_attacked INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
