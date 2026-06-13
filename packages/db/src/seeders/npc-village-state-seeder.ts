import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';

/**
 * Initializes npc_village_state for all NPC villages.
 * Sets faction_key from the player's faction, and initializes
 * timestamps to current time for first simulation tick.
 */
export const npcVillageStateSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO npc_village_state (
        village_id,
        last_interacted_at,
        times_attacked,
        field_growth_accumulator,
        last_growth_tick_ms,
        population_growth_rate,
        rest_state,
        rest_threshold_ms,
        rest_stockpile_bonus,
        last_troop_regen_ms,
        current_loot_available,
        max_loot_capacity,
        loot_recovery_rate,
        aggression_level,
        aggression_decay_timer,
        regional_alert_active,
        last_aggression_decay_ms,
        last_raided_ms,
        faction_key
      )
      SELECT
        v.id,
        0,
        0,
        0,
        0,
        2.0,
        0,
        172800000,
        0.15,
        0,
        1.0,
        500,
        0.08,
        0,
        0,
        0,
        0,
        0,
        fi.faction
      FROM villages v
      JOIN players p ON v.player_id = p.id
      JOIN faction_ids fi ON fi.id = p.faction_id
      WHERE v.player_id != $player_id;
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
  });
};
