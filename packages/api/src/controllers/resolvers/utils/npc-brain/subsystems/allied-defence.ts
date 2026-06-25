import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { reputationLevels } from '@pillage-first/game-assets/reputation';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../../../utils/create-event';
import { isPassiveFaction } from '../npc-brain-types';

/**
 * Allied Defence subsystem.
 *
 * When a player builds a World Wonder, allied NPC factions (reputation >= friendly)
 * send reinforcements to the player's WW village on a scheduled basis.
 *
 * This is a lightweight system: each allied faction sends reinforcements once per
 * in-game day if they have troops available and the player's WW village exists.
 */

const ALLY_THRESHOLD = reputationLevels.get('friendly') ?? 45_000;
const REINFORCEMENT_COOLDOWN_MS = 24 * 3_600_000; // 1 in-game day at 1x speed

export const processAlliedDefence = (
  db: DbFacade,
  now: number,
  speed: number,
): void => {
  // Skip if server has ended
  const endedAt = db.selectValue({
    sql: 'SELECT ended_at FROM servers LIMIT 1',
    schema: z.number().nullable(),
  });
  if (endedAt !== null) {
    return;
  }

  // Find the player's WW village
  const playerWw = db.selectObject({
    sql: `
      SELECT ww.village_id AS villageId, ww.current_level AS currentLevel
      FROM world_wonders ww
      WHERE ww.owner_player_id = $playerId
        AND ww.current_level > 0
      LIMIT 1
    `,
    bind: { $playerId: PLAYER_ID },
    schema: z.strictObject({
      villageId: z.number(),
      currentLevel: z.number(),
    }),
  });

  if (!playerWw) {
    return;
  }

  // Get allied NPC factions (reputation >= friendly)
  const allies = db.selectObjects({
    sql: `
      SELECT
        fi.faction AS factionKey,
        fr.reputation AS rep
      FROM faction_ids fi
      JOIN faction_reputation fr ON fr.target_faction_id = fi.id
      JOIN players p ON p.faction_id = fr.source_faction_id
      WHERE p.id = $playerId
        AND fi.faction != 'player'
        AND fi.faction != 'natars'
        AND fr.reputation >= $threshold
    `,
    bind: { $playerId: PLAYER_ID, $threshold: ALLY_THRESHOLD },
    schema: z.strictObject({
      factionKey: z.string(),
      rep: z.number(),
    }),
  });

  if (allies.length === 0) {
    return;
  }

  for (const ally of allies) {
    if (isPassiveFaction(ally.factionKey)) {
      continue;
    }
    sendAlliedReinforcement(
      db,
      ally.factionKey,
      playerWw.villageId,
      now,
      speed,
    );
  }
};

const sendAlliedReinforcement = (
  db: DbFacade,
  factionKey: string,
  targetVillageId: number,
  now: number,
  speed: number,
): void => {
  // Rate limit: one reinforcement per faction per in-game day
  const lastReinforcement =
    db.selectValue({
      sql: `
      SELECT COALESCE(last_reinforcement_ms, 0)
      FROM npc_faction_state
      WHERE faction_key = $faction
    `,
      bind: { $faction: factionKey },
      schema: z.number(),
    }) ?? 0;

  const cooldownMs = REINFORCEMENT_COOLDOWN_MS / speed;
  if (now - lastReinforcement < cooldownMs) {
    return;
  }

  // Find the faction's strongest village (most troops)
  const sourceVillage = db.selectObject({
    sql: `
      SELECT
        v.id AS villageId,
        v.tile_id AS tileId,
        COALESCE(SUM(t.amount), 0) AS totalTroops
      FROM villages v
      JOIN players p ON p.id = v.player_id
      JOIN faction_ids fi ON fi.id = p.faction_id
      LEFT JOIN troops t ON t.tile_id = v.tile_id AND t.source_tile_id = v.tile_id
      WHERE fi.faction = $faction
      GROUP BY v.id
      HAVING totalTroops > 50
      ORDER BY totalTroops DESC
      LIMIT 1
    `,
    bind: { $faction: factionKey },
    schema: z.strictObject({
      villageId: z.number(),
      tileId: z.number(),
      totalTroops: z.number(),
    }),
  });

  if (!sourceVillage) {
    return;
  }

  // Get home troops (cap at 30% for reinforcement)
  const homeTroops = db.selectObjects({
    sql: `
      SELECT u.unit AS unitId, t.amount
      FROM troops t
      JOIN unit_ids u ON u.id = t.unit_id
      WHERE t.tile_id = $tileId
        AND t.source_tile_id = $tileId
        AND t.amount > 0
    `,
    bind: { $tileId: sourceVillage.tileId },
    schema: z.strictObject({
      unitId: z.string(),
      amount: z.number(),
    }),
  });

  const reinforceTroops: { unitId: string; amount: number }[] = [];
  for (const troop of homeTroops) {
    const amount = Math.max(1, Math.floor(troop.amount * 0.3));
    if (amount > 0) {
      reinforceTroops.push({ unitId: troop.unitId, amount });
    }
  }

  if (reinforceTroops.length === 0) {
    return;
  }

  // Create reinforcement event
  try {
    createEvents<'troopMovementReinforcements'>(db, {
      type: 'troopMovementReinforcements',
      villageId: sourceVillage.villageId,
      targetId: targetVillageId,
      troops: reinforceTroops as any,
      startsAt: now,
    });

    // Update timestamp
    db.exec({
      sql: `
        UPDATE npc_faction_state
        SET last_reinforcement_ms = $now
        WHERE faction_key = $faction
      `,
      bind: { $faction: factionKey, $now: now },
    });
  } catch (_e) {
    // Event creation failed
  }
};
