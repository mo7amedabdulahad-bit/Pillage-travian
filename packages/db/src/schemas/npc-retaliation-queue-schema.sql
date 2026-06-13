CREATE TABLE npc_retaliation_queue
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id INTEGER NOT NULL,
  scheduled_at_ms INTEGER NOT NULL,
  execute_at_ms INTEGER NOT NULL,
  aggression_tier INTEGER NOT NULL,
  faction_key TEXT NOT NULL,
  troops_json TEXT NOT NULL,

  FOREIGN KEY (village_id) REFERENCES npc_village_state (village_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_npc_retaliation_execute ON npc_retaliation_queue(execute_at_ms);
CREATE INDEX idx_npc_retaliation_village ON npc_retaliation_queue(village_id);
