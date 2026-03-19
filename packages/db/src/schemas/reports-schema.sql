CREATE TABLE reports
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  village_id INTEGER NOT NULL,
  target_village_id INTEGER,
  timestamp INTEGER NOT NULL,
  attacker_faction_id INTEGER,
  defender_faction_id INTEGER,
  data TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (attacker_faction_id) REFERENCES faction_ids (id),
  FOREIGN KEY (defender_faction_id) REFERENCES faction_ids (id)
) STRICT;

CREATE INDEX idx_reports_village_id ON reports(village_id);
CREATE INDEX idx_reports_timestamp ON reports(timestamp);
CREATE INDEX idx_reports_type ON reports(type);
