import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { Resolver } from '../../types/resolver';
import {
  consumeConstructionPlan,
  hasConstructionPlan,
} from '../hero-controllers';

/**
 * Resolves a worldWonderUpgrade event.
 *
 * When the event fires the WW level has already been incremented at event
 * creation time (resource deduction + level bump). This resolver finalises
 * the level-up in the DB and triggers side effects.
 */
export const worldWonderUpgradeResolver: Resolver<
  GameEvent<'worldWonderUpgrade'>
> = (database, args) => {
  const { villageId, targetLevel, ownerPlayerId, resolvesAt } = args;

  // 1. Update world_wonders table
  database.exec({
    sql: 'UPDATE world_wonders SET current_level = $level WHERE village_id = $villageId',
    bind: { $level: targetLevel, $villageId: villageId },
  });

  // 2. Update villages denormalised column
  database.exec({
    sql: 'UPDATE villages SET world_wonder_level = $level WHERE id = $villageId',
    bind: { $level: targetLevel, $villageId: villageId },
  });

  // 3. At Level 1: consume the Construction Plan from the hero's inventory
  if (targetLevel === 1 && ownerPlayerId !== null) {
    const heroRow = database.selectObject({
      sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
      bind: { $playerId: ownerPlayerId },
      schema: z.strictObject({ id: z.number() }),
    });

    if (heroRow && hasConstructionPlan(database, heroRow.id)) {
      consumeConstructionPlan(database, heroRow.id);
    }

    // Mark the Natar village's plan as consumed (if this player got it from one)
    database.exec({
      sql: 'UPDATE villages SET construction_plan_held = 0 WHERE id = $villageId',
      bind: { $villageId: villageId },
    });
  }

  // 4. At Level 20: trigger server end (player wins)
  if (targetLevel === 20 && ownerPlayerId !== null) {
    endServer(database, 'player', ownerPlayerId, resolvesAt);
  }
};

/**
 * Ends the game. Sets endgame columns on the servers table and saves a
 * server_end report for every player.
 */
export const endServer = (
  database: DbFacade,
  winnerType: 'player' | 'natars',
  winnerPlayerId: number | null,
  timestamp: number,
): void => {
  const alreadyEnded = database.selectValue({
    sql: 'SELECT ended_at FROM servers LIMIT 1',
    schema: z.object({ ended_at: z.number().nullable() }),
  });

  if (alreadyEnded?.ended_at !== null) {
    return;
  }

  database.exec({
    sql: `
      UPDATE servers
      SET ended_at = $endedAt,
          winner_player_id = $winnerPlayerId,
          winner_type = $winnerType,
          win_condition_met_at = $winConditionMetAt
    `,
    bind: {
      $endedAt: timestamp,
      $winnerPlayerId: winnerPlayerId,
      $winnerType: winnerType,
      $winConditionMetAt: timestamp,
    },
  });

  // Save a server_end report for every player village
  const allVillageIds = database.selectValues({
    sql: 'SELECT id FROM villages',
    schema: z.number(),
  });

  for (const villageId of allVillageIds) {
    database.exec({
      sql: `
        INSERT INTO reports (type, village_id, target_village_id, timestamp, attacker_faction_id, defender_faction_id, data, is_read)
        VALUES ('server_end', $villageId, NULL, $timestamp, NULL, NULL, $data, 0)
      `,
      bind: {
        $villageId: villageId,
        $timestamp: timestamp,
        $data: JSON.stringify({ winnerType, winnerPlayerId, timestamp }),
      },
    });
  }
};
