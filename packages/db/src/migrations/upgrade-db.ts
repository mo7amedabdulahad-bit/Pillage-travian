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
    ['current_loot_available', 'REAL NOT NULL DEFAULT 1.0'],
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
};
