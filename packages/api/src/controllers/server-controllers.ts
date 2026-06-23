import { serverDbSchema } from '@pillage-first/types/models/server';
import { createController } from '../utils/controller';
import { endServer } from './resolvers/world-wonder-resolvers';

export const getServer = createController('/server')(({ database }) => {
  return database.selectObject({
    sql: `
      SELECT
        id,
        version,
        name,
        slug,
        created_at,
        seed,
        speed,
        map_size,
        player_name,
        player_tribe,
        ended_at,
        winner_player_id,
        winner_type,
        win_condition_met_at
      FROM
        servers;
    `,
    schema: serverDbSchema,
  })!;
});

export { endServer };
