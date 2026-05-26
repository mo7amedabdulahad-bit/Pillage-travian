CREATE TABLE hero_appearance
(
  hero_id    INTEGER PRIMARY KEY,
  gender     TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female')),
  skin_color TEXT NOT NULL DEFAULT 'skin1',
  hair_color TEXT NOT NULL DEFAULT 'black',
  eye_color  TEXT NOT NULL DEFAULT 'brown',
  jaw_id     INTEGER NOT NULL DEFAULT 1,
  eyes_id    INTEGER NOT NULL DEFAULT 1,
  brows_id   INTEGER NOT NULL DEFAULT 1,
  nose_id    INTEGER NOT NULL DEFAULT 1,
  mouth_id   INTEGER NOT NULL DEFAULT 1,
  ears_id    INTEGER NOT NULL DEFAULT 1,
  hair_id    INTEGER NOT NULL DEFAULT 1,
  beard_id   INTEGER NOT NULL DEFAULT 0,
  tattoo_id  INTEGER NOT NULL DEFAULT 0,
  scar_id    INTEGER NOT NULL DEFAULT 0,
  body_armor TEXT NOT NULL DEFAULT 'teuton',
  FOREIGN KEY (hero_id) REFERENCES heroes (id) ON DELETE CASCADE
) STRICT;
