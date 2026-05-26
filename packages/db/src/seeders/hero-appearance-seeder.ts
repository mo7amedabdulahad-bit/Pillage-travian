import type { DbFacade } from '@pillage-first/utils/facades/database';

export const heroAppearanceSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO hero_appearance (hero_id)
      SELECT id FROM heroes;
    `,
  });
};
