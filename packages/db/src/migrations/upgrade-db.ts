import type { DbFacade } from '@pillage-first/utils/facades/database';

// This function should only contain db upgrades between app's minor version bumps. At that point, these DB changes
// should already be part of the new schema, so contents of this function should be deleted
export const upgradeDb = (database: DbFacade): void => {
  // Reports table
  try {
    database.exec({
      sql: `
      CREATE TABLE IF NOT EXISTS reports (
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
    `,
    });
    database.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_reports_village_id ON reports(village_id);',
    });
    database.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON reports(timestamp);',
    });
    database.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);',
    });
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Migration logs are useful
    console.warn('Migration: Reports table failed or already exists', e);
  }

  // NPC Village State table
  try {
    database.exec({
      sql: `
      CREATE TABLE IF NOT EXISTS npc_village_state (
        village_id INTEGER PRIMARY KEY,
        last_interacted_at INTEGER NOT NULL DEFAULT 0,
        times_attacked INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
      ) STRICT, WITHOUT ROWID;
    `,
    });
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Migration logs are useful
    console.warn(
      'Migration: npc_village_state table failed or already exists',
      e,
    );
  }

  // troops_meta column in farm_list_tiles
  try {
    database.exec({
      sql: 'ALTER TABLE farm_list_tiles ADD COLUMN troops_meta TEXT;',
    });
  } catch (_e) {
    // Column might already exist, SQLite doesn't have ADD COLUMN IF NOT EXISTS
  }

  // oasis loyalty column
  try {
    database.exec({
      sql: 'ALTER TABLE oasis ADD COLUMN loyalty INTEGER NOT NULL DEFAULT 100;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // oasis animal_spawned_at column
  try {
    database.exec({
      sql: 'ALTER TABLE oasis ADD COLUMN animal_spawned_at INTEGER;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // oasis loyalty_updated_at column
  try {
    database.exec({
      sql: 'ALTER TABLE oasis ADD COLUMN loyalty_updated_at INTEGER;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // villages loyalty column
  try {
    database.exec({
      sql: 'ALTER TABLE villages ADD COLUMN loyalty INTEGER NOT NULL DEFAULT 100;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // villages loyalty_updated_at column
  try {
    database.exec({
      sql: 'ALTER TABLE villages ADD COLUMN loyalty_updated_at INTEGER;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // developer_settings is_max_level_upgrade_enabled column
  try {
    database.exec({
      sql: 'ALTER TABLE developer_settings ADD COLUMN is_max_level_upgrade_enabled INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // villages tribe_id column — stores the village's tribe independently of player_id
  try {
    database.exec({
      sql: 'ALTER TABLE villages ADD COLUMN tribe_id INTEGER;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // Populate tribe_id for existing villages from their player's tribe
  try {
    database.exec({
      sql: `UPDATE villages SET tribe_id = (
              SELECT p.tribe_id FROM players p WHERE p.id = villages.player_id
            ) WHERE tribe_id IS NULL;`,
    });
  } catch (_e) {
    // May fail if tribe_id column doesn't exist yet
  }

  // ─── NPC Brain: New columns on npc_village_state ───
  const npcBrainColumns = [
    ['field_growth_accumulator', 'REAL NOT NULL DEFAULT 0'],
    ['last_growth_tick_ms', 'INTEGER NOT NULL DEFAULT 0'],
    ['population_growth_rate', 'REAL NOT NULL DEFAULT 2.0'],
    ['rest_state', 'INTEGER NOT NULL DEFAULT 0'],
    ['rest_threshold_ms', 'INTEGER NOT NULL DEFAULT 172800000'],
    ['rest_stockpile_bonus', 'REAL NOT NULL DEFAULT 0.15'],
    ['last_troop_regen_ms', 'INTEGER NOT NULL DEFAULT 0'],
    ['loot_at_last_raid', 'REAL NOT NULL DEFAULT 1.0'],
    ['max_loot_capacity', 'INTEGER NOT NULL DEFAULT 500'],
    ['loot_recovery_rate', 'REAL NOT NULL DEFAULT 0.08'],
    ['aggression_level', 'INTEGER NOT NULL DEFAULT 0'],
    ['aggression_decay_timer', 'INTEGER NOT NULL DEFAULT 0'],
    ['regional_alert_active', 'INTEGER NOT NULL DEFAULT 0'],
    ['last_aggression_decay_ms', 'INTEGER NOT NULL DEFAULT 0'],
    ['last_raided_ms', 'INTEGER NOT NULL DEFAULT 0'],
    ['faction_key', "TEXT NOT NULL DEFAULT 'npc1'"],
    ['needs_tick', 'INTEGER NOT NULL DEFAULT 1'],
  ];

  for (const [colName, colDef] of npcBrainColumns) {
    try {
      database.exec({
        sql: `ALTER TABLE npc_village_state ADD COLUMN ${colName} ${colDef};`,
      });
    } catch (_e) {
      // Column might already exist
    }
  }

  // ─── NPC Brain: Sync loot_at_last_raid from current_loot_available for existing rows ───
  // Existing databases have loot values in current_loot_available. The new loot_at_last_raid
  // column defaults to 1.0, which would incorrectly make all villages appear fully stocked.
  try {
    database.exec({
      sql: `
        UPDATE npc_village_state
        SET loot_at_last_raid = current_loot_available
        WHERE loot_at_last_raid = 1.0 AND current_loot_available != 1.0;
      `,
    });
  } catch (_e) {
    // Columns may not exist yet
  }

  // ─── NPC Brain: npc_raid_history table ───
  try {
    database.exec({
      sql: `
        CREATE TABLE IF NOT EXISTS npc_raid_history (
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
      `,
    });
    database.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_npc_raid_history_village ON npc_raid_history(village_id);',
    });
    database.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_npc_raid_history_timestamp ON npc_raid_history(timestamp);',
    });
  } catch (_e) {}

  // ─── NPC Brain: npc_retaliation_queue table ───
  try {
    database.exec({
      sql: `
        CREATE TABLE IF NOT EXISTS npc_retaliation_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          village_id INTEGER NOT NULL,
          scheduled_at_ms INTEGER NOT NULL,
          execute_at_ms INTEGER NOT NULL,
          aggression_tier INTEGER NOT NULL,
          faction_key TEXT NOT NULL,
          troops_json TEXT NOT NULL,
          FOREIGN KEY (village_id) REFERENCES npc_village_state (village_id) ON DELETE CASCADE
        ) STRICT;
      `,
    });
    database.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_npc_retaliation_execute ON npc_retaliation_queue(execute_at_ms);',
    });
    database.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_npc_retaliation_village ON npc_retaliation_queue(village_id);',
    });
  } catch (_e) {}

  // ─── NPC Brain: Add npc9 to faction_ids ───
  try {
    database.exec({
      sql: `INSERT OR IGNORE INTO faction_ids (faction) VALUES ('npc9');`,
    });
  } catch (_e) {
    // May fail if faction_ids table constraint doesn't include npc9 yet
  }

  // ─── NPC Brain: Populate npc_village_state for missing NPC villages ───
  // Uses INSERT OR IGNORE + NOT IN so existing rows are never wiped.
  try {
    database.exec({
      sql: `
        INSERT OR IGNORE INTO npc_village_state (
          village_id, last_interacted_at, times_attacked,
          field_growth_accumulator, last_growth_tick_ms, population_growth_rate,
          rest_state, rest_threshold_ms, rest_stockpile_bonus,
          last_troop_regen_ms, current_loot_available, loot_at_last_raid, max_loot_capacity,
          loot_recovery_rate, aggression_level, aggression_decay_timer,
          regional_alert_active, last_aggression_decay_ms, last_raided_ms,
          faction_key, needs_tick, next_build_check_ms
        )
        SELECT
          v.id, 0, 0, 0, 0, 2.0, 0, 172800000, 0.15,
          0, 1.0, 1.0, 500, 0.08, 0, 0, 0, 0, 0,
          COALESCE(fi.faction, 'npc1'), 1, 0
        FROM villages v
        JOIN players p ON v.player_id = p.id
        LEFT JOIN faction_ids fi ON fi.id = p.faction_id
        WHERE v.player_id != 1
          AND v.id NOT IN (SELECT village_id FROM npc_village_state);
      `,
    });
  } catch (_e) {
    // May fail if table structure is not yet migrated
  }

  // ─── NPC Brain: needs_tick flag for performance gating ───
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN needs_tick INTEGER NOT NULL DEFAULT 1;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // ─── NPC Brain: revenge intent columns for deferred retaliation ───
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN revenge_intent_target_village_id INTEGER DEFAULT NULL;',
    });
  } catch (_e) {
    // Column might already exist
  }

  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN revenge_intent_armed_at_ms INTEGER DEFAULT NULL;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // ─── NPC Brain: importance tier columns ───
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN simulation_tier INTEGER NOT NULL DEFAULT 2;',
    });
  } catch (_e) {
    // Column might already exist
  }

  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN next_simulation_due INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // ─── NPC Brain: building_budget for persistent build resource accumulation ───
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN building_budget REAL NOT NULL DEFAULT 0;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // ─── NPC Brain: next_build_check_ms for rotating build queue ───
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN next_build_check_ms INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // ─── NPC Brain: Fix faction_key for rows stuck on default 'npc1' ───
  try {
    database.exec({
      sql: `
        UPDATE npc_village_state
        SET faction_key = (
          SELECT COALESCE(fi.faction, 'npc1')
          FROM villages v
          JOIN players p ON p.id = v.player_id
          LEFT JOIN faction_ids fi ON fi.id = p.faction_id
          WHERE v.id = npc_village_state.village_id
        )
        WHERE faction_key = 'npc1';
      `,
    });
  } catch (_e) {}

  // ─── NPC Brain: Reset needs_tick for all villages (was being cleared too aggressively) ───
  try {
    database.exec({
      sql: 'UPDATE npc_village_state SET needs_tick = 1 WHERE needs_tick = 0;',
    });
  } catch (_e) {}

  // ─── Phase 2: Difficulty column on servers table ───
  try {
    database.exec({
      sql: "ALTER TABLE servers ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'assault' CHECK (difficulty IN ('skirmish', 'assault', 'siege'));",
    });
  } catch (_e) {
    // Column might already exist
  }

  // ─── Phase 2: Proactive attack timestamp on npc_village_state ───
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN last_proactive_attack_ms INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // ─── Phase 3: Game mode and blitz protection columns on servers table ───
  try {
    database.exec({
      sql: "ALTER TABLE servers ADD COLUMN game_mode TEXT NOT NULL DEFAULT 'standard' CHECK (game_mode IN ('standard', 'blitz'));",
    });
  } catch (_e) {
    // Column might already exist
  }

  try {
    database.exec({
      sql: 'ALTER TABLE servers ADD COLUMN blitz_protection_ends_at INTEGER;',
    });
  } catch (_e) {
    // Column might already exist
  }

  // ─── Phase 2 Fix: npc_faction_state table ───
  try {
    database.exec({
      sql: `
        CREATE TABLE IF NOT EXISTS npc_faction_state (
          faction_key TEXT PRIMARY KEY NOT NULL,
          last_faction_attack_ms INTEGER NOT NULL DEFAULT 0,
          current_wave_stage INTEGER NOT NULL DEFAULT 0,
          wave_locked_until_ms INTEGER NOT NULL DEFAULT 0
        ) STRICT;
      `,
    });
  } catch (_e) {}

  // ─── Phase 2 Fix: staggered cold-start offset on npc_village_state ───
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN proactive_attack_offset_ms INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}

  // ─── Phase 4: Server endgame columns ───
  for (const [colName, colDef] of [
    ['ended_at', 'INTEGER'],
    ['winner_player_id', 'INTEGER'],
    [
      'winner_type',
      "TEXT CHECK (winner_type IS NULL OR winner_type IN ('player', 'natars'))",
    ],
    ['win_condition_met_at', 'INTEGER'],
  ] as const) {
    try {
      database.exec({
        sql: `ALTER TABLE servers ADD COLUMN ${colName} ${colDef};`,
      });
    } catch (_e) {
      // Column might already exist
    }
  }

  // ─── Phase 4: Village endgame columns ───
  for (const [colName, colDef] of [
    ['is_world_wonder_village', 'INTEGER NOT NULL DEFAULT 0'],
    ['world_wonder_level', 'INTEGER NOT NULL DEFAULT 0'],
    ['construction_plan_held', 'INTEGER NOT NULL DEFAULT 0'],
  ] as const) {
    try {
      database.exec({
        sql: `ALTER TABLE villages ADD COLUMN ${colName} ${colDef};`,
      });
    } catch (_e) {
      // Column might already exist
    }
  }

  // ─── Phase 4: natar_villages table ───
  try {
    database.exec({
      sql: `
        CREATE TABLE IF NOT EXISTS natar_villages (
          village_id INTEGER PRIMARY KEY,
          server_slug TEXT NOT NULL,
          construction_plan_available INTEGER NOT NULL DEFAULT 1,
          plan_holder_player_id INTEGER,
          FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
        ) STRICT, WITHOUT ROWID;
      `,
    });
  } catch (_e) {}

  // ─── Phase 4: world_wonders table ───
  try {
    database.exec({
      sql: `
        CREATE TABLE IF NOT EXISTS world_wonders (
          village_id INTEGER PRIMARY KEY,
          owner_player_id INTEGER,
          owner_faction_id TEXT NOT NULL,
          current_level INTEGER NOT NULL DEFAULT 0,
          started_at INTEGER NOT NULL,
          name TEXT DEFAULT NULL,
          last_attack_at INTEGER,
          next_attack_at INTEGER,
          FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE
        ) STRICT, WITHOUT ROWID;
      `,
    });
  } catch (_e) {}

  // ─── Phase 4: Add 'natars' to faction_ids (rebuild table for CHECK constraint) ───
  try {
    database.exec({
      sql: `
        CREATE TABLE IF NOT EXISTS faction_ids_new (
          id INTEGER PRIMARY KEY,
          faction TEXT NOT NULL UNIQUE CHECK (faction IN ('player', 'npc1', 'npc2', 'npc3', 'npc4', 'npc5', 'npc6', 'npc7', 'npc8', 'npc9', 'natars'))
        ) STRICT;
      `,
    });
    database.exec({
      sql: 'INSERT OR IGNORE INTO faction_ids_new (id, faction) SELECT id, faction FROM faction_ids;',
    });
    database.exec({
      sql: `INSERT OR IGNORE INTO faction_ids_new (faction) VALUES ('natars');`,
    });
    database.exec({ sql: 'DROP TABLE faction_ids;' });
    database.exec({
      sql: 'ALTER TABLE faction_ids_new RENAME TO faction_ids;',
    });
    database.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_faction_ids_faction ON faction_ids(faction);',
    });
  } catch (_e) {
    // Table may already be up to date
  }

  // ─── Phase 4: Add 'WORLD_WONDER' to building_ids (rebuild table for CHECK constraint) ───
  try {
    database.exec({
      sql: `
        CREATE TABLE IF NOT EXISTS building_ids_new (
          id INTEGER PRIMARY KEY,
          building TEXT NOT NULL UNIQUE CHECK (building IN ('BARRACKS', 'GREAT_BARRACKS', 'STABLE', 'GREAT_STABLE', 'WORKSHOP', 'HOSPITAL', 'CLAY_PIT', 'WHEAT_FIELD', 'WOODCUTTER', 'IRON_MINE', 'BAKERY', 'BRICKYARD', 'GRAIN_MILL', 'GRANARY', 'GREAT_GRANARY', 'IRON_FOUNDRY', 'SAWMILL', 'WAREHOUSE', 'GREAT_WAREHOUSE', 'WATERWORKS', 'ACADEMY', 'ROMAN_WALL', 'TEUTONIC_WALL', 'HEROS_MANSION', 'HUN_WALL', 'GAUL_WALL', 'RALLY_POINT', 'EGYPTIAN_WALL', 'TRAPPER', 'BREWERY', 'COMMAND_CENTER', 'CRANNY', 'HORSE_DRINKING_TROUGH', 'MAIN_BUILDING', 'MARKETPLACE', 'RESIDENCE', 'TOURNAMENT_SQUARE', 'TRADE_OFFICE', 'SMITHY', 'TOWN_HALL', 'EMBASSY', 'TREASURY', 'SPARTAN_WALL', 'NATAR_WALL', 'NATURE_WALL', 'VIKING_WALL', 'WORLD_WONDER'))
        ) STRICT;
      `,
    });
    database.exec({
      sql: 'INSERT OR IGNORE INTO building_ids_new (id, building) SELECT id, building FROM building_ids;',
    });
    database.exec({ sql: 'DROP TABLE building_ids;' });
    database.exec({
      sql: 'ALTER TABLE building_ids_new RENAME TO building_ids;',
    });
    database.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_building_ids_building ON building_ids(building);',
    });
  } catch (_e) {
    // Table may already be up to date
  }

  // ─── Phase 4G: NPC wonder competition columns ───
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN holds_plan INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN has_plan INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}
  try {
    database.exec({
      sql: 'ALTER TABLE npc_village_state ADD COLUMN garrison_power INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}
  try {
    database.exec({
      sql: 'ALTER TABLE npc_faction_state ADD COLUMN last_plan_attempt_ms INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}
  try {
    database.exec({
      sql: 'ALTER TABLE npc_faction_state ADD COLUMN last_reinforcement_ms INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}

  // ─── Admin Dashboard: is_admin_mode_enabled developer setting ───
  try {
    database.exec({
      sql: 'ALTER TABLE developer_settings ADD COLUMN is_admin_mode_enabled INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}

  // ─── Phase 5: World Wonder System — natar_villages WW columns ───
  try {
    database.exec({
      sql: 'ALTER TABLE natar_villages ADD COLUMN is_ww_village INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}
  try {
    database.exec({
      sql: 'ALTER TABLE natar_villages ADD COLUMN ww_level INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}
  try {
    database.exec({
      sql: 'ALTER TABLE natar_villages ADD COLUMN attack_block_until INTEGER DEFAULT NULL;',
    });
  } catch (_e) {}
  try {
    database.exec({
      sql: 'ALTER TABLE natar_villages ADD COLUMN last_attacked_at INTEGER DEFAULT NULL;',
    });
  } catch (_e) {}

  // ─── Phase 5: World Wonder System — servers global WW tracking ───
  try {
    database.exec({
      sql: 'ALTER TABLE servers ADD COLUMN ww_level INTEGER NOT NULL DEFAULT 0;',
    });
  } catch (_e) {}
  try {
    database.exec({
      sql: 'ALTER TABLE servers ADD COLUMN ww_tribe_id INTEGER DEFAULT NULL;',
    });
  } catch (_e) {}
};
