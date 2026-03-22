CREATE TABLE oasis
(
  id INTEGER PRIMARY KEY,
  tile_id INTEGER NOT NULL,
  village_id INTEGER,
  resource TEXT NOT NULL,
  bonus INTEGER NOT NULL,
  loyalty INTEGER NOT NULL DEFAULT 100,
  animal_spawned_at INTEGER,

  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE,
  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_oasis_bonus_tile_id ON oasis(bonus, tile_id);
CREATE INDEX idx_oasis_village_id ON oasis(village_id);
CREATE INDEX idx_oasis_loyalty ON oasis(loyalty) WHERE village_id IS NOT NULL;
