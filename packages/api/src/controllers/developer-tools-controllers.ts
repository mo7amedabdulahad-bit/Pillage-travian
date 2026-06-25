import { snakeCase } from 'moderndash';
import { z } from 'zod';
import { calculateHeroLevel } from '@pillage-first/game-assets/utils/hero';
import { getNpcVillageDebugInfo } from '../controllers/resolvers/utils/npc-brain/developer-tools';
import { triggerKick } from '../scheduler/scheduler-signal';
import { createController } from '../utils/controller';
import {
  addVillageResourcesAt,
  subtractVillageResourcesAt,
} from '../utils/village';
import { getDeveloperSettingsSchema } from './schemas/developer-tools-schemas';

export const getDeveloperSettings = createController('/developer-settings')(
  ({ database }) => {
    return database.selectObject({
      sql: `
      SELECT
        is_instant_building_construction_enabled,
        is_instant_unit_training_enabled,
        is_instant_unit_improvement_enabled,
        is_instant_unit_research_enabled,
        is_instant_unit_travel_enabled,
        is_free_building_construction_enabled,
        is_free_unit_training_enabled,
        is_free_unit_improvement_enabled,
        is_free_unit_research_enabled,
        is_instant_hero_revive_enabled,
        is_free_hero_revive_enabled,
        is_max_level_upgrade_enabled,
        is_admin_mode_enabled
      FROM
        developer_settings
    `,
      schema: getDeveloperSettingsSchema,
    });
  },
);

export const updateDeveloperSettings = createController(
  '/developer-settings/:developerSettingName',
  'patch',
)(({ database, body: { value }, path: { developerSettingName } }) => {
  const column = snakeCase(developerSettingName);

  database.exec({
    sql: `
      UPDATE developer_settings
      SET
        ${column} = $value
    `,
    bind: {
      $value: value,
    },
  });

  if (value) {
    let eventTypes: string[] = [];

    switch (developerSettingName) {
      case 'isInstantBuildingConstructionEnabled': {
        eventTypes = [
          'buildingLevelChange',
          'buildingScheduledConstruction',
          'buildingConstruction',
          'buildingDestruction',
        ];
        break;
      }
      case 'isInstantUnitTrainingEnabled': {
        eventTypes = ['troopTraining'];
        break;
      }
      case 'isInstantUnitImprovementEnabled': {
        eventTypes = ['unitImprovement'];
        break;
      }
      case 'isInstantUnitResearchEnabled': {
        eventTypes = ['unitResearch'];
        break;
      }
      case 'isInstantUnitTravelEnabled': {
        eventTypes = [
          'troopMovementReinforcements',
          'troopMovementRelocation',
          'troopMovementReturn',
          'troopMovementFindNewVillage',
          'troopMovementAttack',
          'troopMovementRaid',
          'troopMovementAdventure',
        ];
        break;
      }
      case 'isInstantHeroReviveEnabled': {
        eventTypes = ['heroRevival'];
        break;
      }
    }

    if (eventTypes.length > 0) {
      database.exec({
        sql: `
          UPDATE events
          SET
            starts_at = $now,
            duration = 0
          WHERE
            type IN (${eventTypes.map((t) => `'${t}'`).join(', ')})
        `,
        bind: {
          $now: Date.now(),
        },
      });

      triggerKick();
    }
  }
});

export const levelUpHero = createController(
  '/developer-settings/:heroId/level-up',
  'patch',
)(({ database, path: { heroId } }) => {
  const currentExperience = database.selectValue({
    sql: 'SELECT experience FROM heroes WHERE id = $hero_id',
    bind: { $hero_id: heroId },
    schema: z.number(),
  })!;

  const { expToNextLevel } = calculateHeroLevel(currentExperience);

  database.exec({
    sql: `
      UPDATE heroes
      SET
        experience = $nextLevelExp
      WHERE
        id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
      $nextLevelExp: currentExperience + expToNextLevel,
    },
  });
});

export const spawnHeroItem = createController(
  '/developer-settings/:heroId/spawn-item',
  'patch',
)(({ database, body: { itemId, amount = 1 }, path: { heroId } }) => {
  database.exec({
    sql: `
      INSERT INTO
        hero_inventory (hero_id, item_id, amount)
      VALUES
        ($hero_id, $itemId, $amount)
      ON CONFLICT (hero_id, item_id) DO UPDATE SET
        amount = amount + $amount
    `,
    bind: {
      $hero_id: heroId,
      $itemId: itemId,
      $amount: amount,
    },
  });
});

export const updateVillageResources = createController(
  '/developer-settings/:villageId/resources',
  'patch',
)(({ database, body, path: { villageId } }) => {
  const { resource, amount, direction } = body;

  const now = Date.now();

  const resources = [0, 0, 0, 0];
  const resourceIndexMap = {
    wood: 0,
    clay: 1,
    iron: 2,
    wheat: 3,
  };

  resources[resourceIndexMap[resource]] = amount;

  const updaterFn =
    direction === 'add' ? addVillageResourcesAt : subtractVillageResourcesAt;

  updaterFn(database, villageId, now, resources);
});

export const incrementHeroAdventurePoints = createController(
  '/developer-settings/:heroId/increment-adventure-points',
  'patch',
)(({ database, path: { heroId } }) => {
  database.exec({
    sql: `
      UPDATE hero_adventures
      SET
        available = available + 1
      WHERE
        hero_id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
    },
  });
});

export const killHero = createController(
  '/developer-settings/:heroId/kill-hero',
  'patch',
)(({ database, path: { heroId } }) => {
  database.exec({
    sql: `
      UPDATE heroes
      SET health = 0
      WHERE id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
    },
  });
});

export const getNpcVillagesList = createController(
  '/developer-settings/npc-villages',
)(({ database, query }) => {
  try {
    const search = (query?.search as string) ?? '';
    const hasSearch = search.length > 0;

    return database.selectObjects({
      sql: `
        SELECT
          nvs.village_id AS villageId,
          v.name AS villageName,
          nvs.faction_key AS factionKey,
          t.x,
          t.y,
          nvs.aggression_level AS aggressionLevel,
          nvs.loot_at_last_raid AS currentLoot,
          nvs.max_loot_capacity AS maxLoot
        FROM npc_village_state nvs
        JOIN villages v ON v.id = nvs.village_id
        JOIN tiles t ON t.id = v.tile_id
        ${hasSearch ? 'WHERE v.name LIKE $search OR nvs.faction_key LIKE $search OR CAST(nvs.village_id AS TEXT) LIKE $search' : ''}
        ORDER BY nvs.village_id ASC;
      `,
      bind: hasSearch ? { $search: `%${search}%` } : undefined,
      schema: z.object({
        villageId: z.number(),
        villageName: z.string(),
        factionKey: z.string(),
        x: z.number(),
        y: z.number(),
        aggressionLevel: z.number(),
        currentLoot: z.number(),
        maxLoot: z.number(),
      }),
    });
  } catch (e) {
    console.error('[NPC Brain] getNpcVillagesList error:', e);
    return [];
  }
});

export const getNpcVillageDebug = createController(
  '/developer-settings/npc-villages/:villageId',
)(({ database, path: { villageId } }) => {
  try {
    const info = getNpcVillageDebugInfo(database, Number(villageId));
    if (!info) {
      return { error: 'Village not found or not an NPC village' };
    }
    return info;
  } catch (e) {
    return { error: String(e) };
  }
});
