CREATE TABLE players
(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tribe_id INTEGER NOT NULL,
  faction_id INTEGER NOT NULL,
  personality TEXT NOT NULL DEFAULT 'balanced',

  FOREIGN KEY (tribe_id) REFERENCES tribe_ids (id),
  FOREIGN KEY (faction_id) REFERENCES faction_ids (id)
) STRICT;
