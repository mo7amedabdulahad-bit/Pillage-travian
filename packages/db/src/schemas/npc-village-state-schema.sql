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
  loot_at_last_raid REAL NOT NULL DEFAULT 1.0,
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

  -- Performance: skip villages that don't need tick processing
  needs_tick INTEGER NOT NULL DEFAULT 1,

  -- Revenge intent: deferred retaliation when village lacks troops
  revenge_intent_target_village_id INTEGER DEFAULT NULL,
  revenge_intent_armed_at_ms INTEGER DEFAULT NULL,

  -- Importance tier: controls simulation frequency
  simulation_tier INTEGER NOT NULL DEFAULT 2,
  next_simulation_due INTEGER NOT NULL DEFAULT 0,

  -- Build budget: accumulated resources for building decisions
  building_budget REAL NOT NULL DEFAULT 0,

  -- Build scheduling: next time this village is eligible for a build check
  next_build_check_ms INTEGER NOT NULL DEFAULT 0,

  -- NPC wonder competition
  holds_plan INTEGER NOT NULL DEFAULT 0,
  has_plan INTEGER NOT NULL DEFAULT 0,
  garrison_power INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
