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
};
