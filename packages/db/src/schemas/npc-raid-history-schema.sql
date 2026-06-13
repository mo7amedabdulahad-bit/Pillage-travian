CREATE TABLE npc_raid_history
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  loot_wood INTEGER NOT NULL DEFAULT 0,
  loot_clay INTEGER NOT NULL DEFAULT 0,
  loot_iron INTEGER NOT NULL DEFAULT 0,
  loot_wheat INTEGER NOT NULL DEFAULT 0,
  troops_lost_json TEXT NOT NULL DEFAULT '{}',
  player_troops_lost_json TEXT NOT NULL DEFAULT '{}',

  FOREIGN KEY (village_id) REFERENCES npc_village_state (village_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_npc_raid_history_village ON npc_raid_history(village_id);
CREATE INDEX idx_npc_raid_history_timestamp ON npc_raid_history(timestamp);
