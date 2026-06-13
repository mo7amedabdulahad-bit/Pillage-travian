CREATE TABLE npc_village_state
(
  village_id INTEGER PRIMARY KEY,
  last_interacted_at INTEGER NOT NULL DEFAULT 0,
  times_attacked INTEGER NOT NULL DEFAULT 0,

  -- Growth state
  field_growth_accumulator REAL NOT NULL DEFAULT 0,
  last_growth_tick_ms INTEGER NOT NULL DEFAULT 0,
  population_growth_rate REAL NOT NULL DEFAULT 2.0,
  rest_state INTEGER NOT NULL DEFAULT 0,
  rest_threshold_ms INTEGER NOT NULL DEFAULT 172800000,
  rest_stockpile_bonus REAL NOT NULL DEFAULT 0.15,

  -- Troop regeneration
  last_troop_regen_ms INTEGER NOT NULL DEFAULT 0,

  -- Loot recovery
  current_loot_available REAL NOT NULL DEFAULT 1.0,
  max_loot_capacity INTEGER NOT NULL DEFAULT 500,
  loot_recovery_rate REAL NOT NULL DEFAULT 0.08,

  -- Aggression state
  aggression_level INTEGER NOT NULL DEFAULT 0,
  aggression_decay_timer INTEGER NOT NULL DEFAULT 0,
  regional_alert_active INTEGER NOT NULL DEFAULT 0,
  last_aggression_decay_ms INTEGER NOT NULL DEFAULT 0,
  last_raided_ms INTEGER NOT NULL DEFAULT 0,

  -- Faction reference (stored as TEXT key like 'npc1', 'npc2', etc.)
  faction_key TEXT NOT NULL DEFAULT 'npc1',

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
