import { z } from 'zod';
import { calculateWorldWonderCostForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../../../utils/create-event';
import { saveNpcWonderMilestoneReport } from '../../reports';
import { FACTION_PROFILES } from '../faction-profiles';
import { type FactionKey, isPassiveFaction } from '../npc-brain-types';

/**
 * NPC Wonder Competition subsystem.
 *
 * Handles three phases per NPC faction on each tick:
 * 1. Plan acquisition — attack a Natar village if strong enough
 * 2. WW start — designate strongest village as WW village
 * 3. WW upgrade — queue the next worldWonderUpgrade event
 */
export const processNpcWonderCompetition = (
  db: DbFacade,
  now: number,
  speed: number,
): void => {
  const serverCreated =
    db.selectValue({
      sql: 'SELECT created_at FROM servers LIMIT 1',
      schema: z.number(),
    }) ?? now;

  // Minimum time before NPC factions start competing (24h standard, 10min blitz)
  const gameMode =
    db.selectValue({
      sql: 'SELECT game_mode FROM servers LIMIT 1',
      schema: z.string(),
    }) ?? 'standard';
  const warmupMs = gameMode === 'blitz' ? 10 * 60 * 1000 : 24 * 3_600_000;
  if (now - serverCreated < warmupMs / speed) {
    return;
  }

  // Skip if server has ended
  const endedAt = db.selectValue({
    sql: 'SELECT ended_at FROM servers LIMIT 1',
    schema: z.number().nullable(),
  });
  if (endedAt !== null) {
    return;
  }

  // Get all NPC factions (excluding natars and player)
  const factions = db.selectObjects({
    sql: `
      SELECT fi.faction AS factionKey
      FROM faction_ids fi
      WHERE fi.faction != 'natars' AND fi.faction != 'player'
    `,
    schema: z.strictObject({ factionKey: z.string() }),
  });

  for (const { factionKey } of factions) {
    if (isPassiveFaction(factionKey)) {
      continue;
    }
    const profile = FACTION_PROFILES[factionKey as FactionKey];
    if (!profile) {
      continue;
    }

    processFaction(db, factionKey as FactionKey, now, speed);
  }
};

const processFaction = (
  db: DbFacade,
  factionKey: FactionKey,
  now: number,
  speed: number,
): void => {
  // Check if this faction already owns a WW
  const existingWw =
    db.selectValue({
      sql: 'SELECT COUNT(*) FROM world_wonders WHERE owner_faction_id = $faction',
      bind: { $faction: factionKey },
      schema: z.number(),
    }) ?? 0;

  if (existingWw > 0) {
    // Faction already has a WW — try to upgrade it
    processNpcWwUpgrade(db, factionKey, now, speed);
    return;
  }

  // Check if faction holds a plan
  const holdsPlan = db.selectValue({
    sql: `
      SELECT nv.village_id
      FROM npc_village_state nv
      WHERE nv.faction_key = $faction AND nv.holds_plan = 1
      LIMIT 1
    `,
    bind: { $faction: factionKey },
    schema: z.number(),
  });

  if (holdsPlan) {
    // Faction has a plan but no WW — start it
    startNpcWorldWonder(db, factionKey, holdsPlan, now);
    return;
  }

  // Try to acquire a plan from a Natar village
  tryAcquirePlan(db, factionKey, now, speed);
};

/**
 * Attempt to acquire a construction plan from a Natar village.
 * Uses a simple power comparison: faction total troops vs Natar garrison.
 */
const tryAcquirePlan = (
  db: DbFacade,
  factionKey: FactionKey,
  now: number,
  speed: number,
): void => {
  // Rate limit: one attempt per faction per in-game day
  const lastAttempt =
    db.selectValue({
      sql: `
      SELECT COALESCE(last_plan_attempt_ms, 0)
      FROM npc_faction_state
      WHERE faction_key = $faction
    `,
      bind: { $faction: factionKey },
      schema: z.number(),
    }) ?? 0;

  const inGameDayMs = (24 * 3_600_000) / speed;
  if (now - lastAttempt < inGameDayMs) {
    return;
  }

  // Update attempt timestamp
  db.exec({
    sql: `
      UPDATE npc_faction_state
      SET last_plan_attempt_ms = $now
      WHERE faction_key = $faction
    `,
    bind: { $faction: factionKey, $now: now },
  });

  // Find a Natar village with an available plan
  const natarVillage = db.selectObject({
    sql: `
      SELECT nv.village_id AS villageId, nv.garrison_power
      FROM npc_village_state nv
      WHERE nv.faction_key = 'natars'
        AND nv.has_plan = 1
      LIMIT 1
    `,
    schema: z.strictObject({
      villageId: z.number(),
      garrisonPower: z.number(),
    }),
  });

  if (!natarVillage) {
    return;
  }

  // Calculate faction total troop power (sum of all units across all villages)
  const factionPower =
    db.selectValue({
      sql: `
      SELECT COALESCE(SUM(t.amount), 0)
      FROM troops t
      JOIN villages v ON v.tile_id = t.tile_id
      JOIN players p ON p.id = v.player_id
      JOIN faction_ids fi ON fi.id = p.faction_id
      WHERE fi.faction = $faction
        AND t.source_tile_id = t.tile_id
    `,
      bind: { $faction: factionKey },
      schema: z.number(),
    }) ?? 0;

  // Faction must have at least 80% of the garrison power to succeed
  if (factionPower < natarVillage.garrisonPower * 0.8) {
    return;
  }

  // Success — capture the plan
  db.exec({
    sql: `
      UPDATE npc_village_state
      SET has_plan = 0
      WHERE village_id = $villageId
    `,
    bind: { $villageId: natarVillage.villageId },
  });

  // Find the faction's strongest village (the one that will hold the plan)
  const wwVillage = db.selectValue({
    sql: `
      SELECT v.id FROM villages v
      JOIN players p ON p.id = v.player_id
      JOIN faction_ids fi ON fi.id = p.faction_id
      WHERE fi.faction = $faction
      ORDER BY v.total_fields DESC LIMIT 1
    `,
    bind: { $faction: factionKey },
    schema: z.number(),
  });

  if (wwVillage) {
    // Set holds_plan only on the WW village, clear it on all others
    db.exec({
      sql: 'UPDATE npc_village_state SET holds_plan = CASE WHEN village_id = $wwVillage THEN 1 ELSE 0 END WHERE faction_key = $faction',
      bind: { $faction: factionKey, $wwVillage: wwVillage },
    });
  }

  // Save milestone report: STARTED
  saveNpcWonderMilestoneReport(db, factionKey, 'started');
};

/**
 * Designate the strongest village as the WW village and create the WW row.
 */
const startNpcWorldWonder = (
  db: DbFacade,
  factionKey: FactionKey,
  _planHolderVillageId: number,
  now: number,
): void => {
  // Find the faction's highest-population village
  const strongestVillage = db.selectObject({
    sql: `
      SELECT v.id AS villageId
      FROM villages v
      JOIN players p ON p.id = v.player_id
      JOIN faction_ids fi ON fi.id = p.faction_id
      WHERE fi.faction = $faction
      ORDER BY v.total_fields DESC
      LIMIT 1
    `,
    bind: { $faction: factionKey },
    schema: z.strictObject({ villageId: z.number() }),
  });

  if (!strongestVillage) {
    return;
  }

  const villageId = strongestVillage.villageId;

  // Check if already a WW village
  const isWw = db.selectValue({
    sql: 'SELECT is_world_wonder_village FROM villages WHERE id = $villageId',
    bind: { $villageId: villageId },
    schema: z.number(),
  });

  if (isWw === 1) {
    return;
  }

  // Get the NPC player id for this faction
  const npcPlayerId = db.selectValue({
    sql: `
      SELECT p.id
      FROM players p
      JOIN faction_ids fi ON fi.id = p.faction_id
      WHERE fi.faction = $faction AND p.is_npc = 1
      LIMIT 1
    `,
    bind: { $faction: factionKey },
    schema: z.number(),
  });

  if (!npcPlayerId) {
    return;
  }

  // Create world_wonders row
  db.exec({
    sql: `
      INSERT INTO world_wonders (village_id, owner_player_id, owner_faction_id, current_level, started_at)
      VALUES ($villageId, $playerId, $faction, 0, $startedAt)
    `,
    bind: {
      $villageId: villageId,
      $playerId: npcPlayerId,
      $faction: factionKey,
      $startedAt: now,
    },
  });

  db.exec({
    sql: 'UPDATE villages SET is_world_wonder_village = 1 WHERE id = $villageId',
    bind: { $villageId: villageId },
  });

  // Queue the first upgrade (L0 → L1)
  queueNextNpcWwUpgrade(db, factionKey, villageId, 0, now);

  // Consume the plan
  db.exec({
    sql: `
      UPDATE npc_village_state
      SET holds_plan = 0
      WHERE faction_key = $faction
    `,
    bind: { $faction: factionKey },
  });
};

/**
 * If no pending upgrade event exists, queue the next level.
 */
const processNpcWwUpgrade = (
  db: DbFacade,
  factionKey: FactionKey,
  now: number,
  _speed: number,
): void => {
  const ww = db.selectObject({
    sql: `
      SELECT ww.village_id AS villageId, ww.current_level AS currentLevel
      FROM world_wonders ww
      WHERE ww.owner_faction_id = $faction
    `,
    bind: { $faction: factionKey },
    schema: z.strictObject({
      villageId: z.number(),
      currentLevel: z.number(),
    }),
  });

  if (!ww) {
    return;
  }
  if (ww.currentLevel >= 20) {
    return; // Already maxed
  }

  // Check if there's already a pending upgrade event for this village
  const pendingEvent =
    db.selectValue({
      sql: `
      SELECT COUNT(*)
      FROM events
      WHERE village_id = $villageId
        AND type = 'worldWonderUpgrade'
    `,
      bind: { $villageId: ww.villageId },
      schema: z.number(),
    }) ?? 0;

  if (pendingEvent > 0) {
    return;
  }

  // Check if faction has enough resources (check the WW village's resources)
  const nextLevel = ww.currentLevel + 1;
  const cost = calculateWorldWonderCostForLevel(nextLevel);

  const villageResources = db.selectObject({
    sql: `
      SELECT
        COALESCE(SUM(CASE WHEN rf.resource = 'lumber' THEN rf.amount ELSE 0 END), 0) AS lumber,
        COALESCE(SUM(CASE WHEN rf.resource = 'clay' THEN rf.amount ELSE 0 END), 0) AS clay,
        COALESCE(SUM(CASE WHEN rf.resource = 'iron' THEN rf.amount ELSE 0 END), 0) AS iron,
        COALESCE(SUM(CASE WHEN rf.resource = 'crop' THEN rf.amount ELSE 0 END), 0) AS crop
      FROM resource_fields rf
      WHERE rf.village_id = $villageId
    `,
    bind: { $villageId: ww.villageId },
    schema: z.strictObject({
      lumber: z.number(),
      clay: z.number(),
      iron: z.number(),
      crop: z.number(),
    }),
  });

  if (
    !villageResources ||
    villageResources.lumber < cost[0] ||
    villageResources.clay < cost[1] ||
    villageResources.iron < cost[2] ||
    villageResources.crop < cost[3]
  ) {
    return; // Not enough resources — wait
  }

  queueNextNpcWwUpgrade(db, factionKey, ww.villageId, ww.currentLevel, now);
};

/**
 * Create a worldWonderUpgrade event for the next NPC WW level.
 */
const queueNextNpcWwUpgrade = (
  db: DbFacade,
  factionKey: FactionKey,
  villageId: number,
  currentLevel: number,
  now: number,
): void => {
  const nextLevel = currentLevel + 1;

  // Get NPC player id
  const npcPlayerId = db.selectValue({
    sql: `
      SELECT p.id
      FROM players p
      JOIN faction_ids fi ON fi.id = p.faction_id
      WHERE fi.faction = $faction AND p.is_npc = 1
      LIMIT 1
    `,
    bind: { $faction: factionKey },
    schema: z.number(),
  });

  if (!npcPlayerId) {
    return;
  }

  try {
    createEvents<'worldWonderUpgrade'>(db, {
      villageId,
      type: 'worldWonderUpgrade',
      targetLevel: nextLevel,
      ownerPlayerId: npcPlayerId,
      ownerFactionId: factionKey,
      startsAt: now,
    } as any);
  } catch (_e) {
    // Event creation failed (e.g. missing resources, prerequisite failed)
  }
};
