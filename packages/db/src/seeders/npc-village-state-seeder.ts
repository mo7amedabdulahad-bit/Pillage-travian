import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';

/**
 * Initializes npc_village_state for all NPC villages.
 * Sets last_interacted_at to 0 (never interacted) and times_attacked to 0.
 */
export const npcVillageStateSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO npc_village_state (village_id, last_interacted_at, times_attacked)
      SELECT v.id, 0, 0
      FROM villages v
      WHERE v.player_id != $player_id;
    `,
    bind: {
      $player_id: PLAYER_ID,
    },
  });
};
