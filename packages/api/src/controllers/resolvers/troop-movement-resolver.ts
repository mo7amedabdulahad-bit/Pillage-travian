import { z } from 'zod';
import { newVillageUnitResearchFactory } from '@pillage-first/game-assets/factories/unit-research';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { newVillageQuestsFactory } from '@pillage-first/game-assets/quests';
import { buildingFieldsFactory } from '@pillage-first/game-assets/village';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { Resolver } from '../../types/resolver';
import { updateHeroEffectsVillageIdQuery } from '../../utils/queries/effect-queries';
import {
  addVillageResourcesAt,
  updateVillageResourcesAt,
} from '../../utils/village.ts';
import { createEvents } from '../utils/create-event';
import { resolveTroopMovementCombat } from './utils/combat-resolver.ts';
import { onHeroDeath } from './utils/hero.ts';
import { assessAdventureCountQuestCompletion } from './utils/quests.ts';
import { saveAdventureReport } from './utils/reports.ts';
import { addTroops } from './utils/troops.ts';

export const adventureMovementResolver: Resolver<
  GameEvent<'troopMovementAdventure'>
> = (database, args) => {
  const { villageId, resolvesAt } = args;

  const village = database.selectObject({
    sql: `
      SELECT
        v.name AS villageName,
        p.name AS playerName,
        p.faction_id AS factionId
      FROM villages v
      JOIN players p ON p.id = v.player_id
      WHERE v.id = $village_id
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      villageName: z.string(),
      playerName: z.string(),
      factionId: z.number(),
    }),
  })!;

  const heroBefore = database.selectObject({
    sql: `
      SELECT id AS heroId, health
      FROM heroes
      WHERE player_id = (
        SELECT player_id
        FROM villages
        WHERE id = $village_id
      )
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      heroId: z.number(),
      health: z.number(),
    }),
  })!;

  const { heroId, health } = database.selectObject({
    sql: `
      UPDATE heroes
      SET
        health = MAX(0, health - MAX(0, 5 - damage_reduction)),
        experience = experience + CASE
            WHEN MAX(0, health - MAX(0, 5 - damage_reduction)) > 0
              THEN (
                     SELECT completed + 1
                     FROM
                       hero_adventures
                     WHERE
                       hero_id = heroes.id
                     ) * 10
            ELSE 0
          END
      WHERE
        player_id = (
          SELECT player_id
          FROM
            villages
          WHERE
            id = $village_id
          )
      RETURNING
        id AS heroId,
        health
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      heroId: z.number(),
      health: z.number(),
    }),
  })!;

  const damageTaken = Math.max(0, heroBefore.health - health);

  if (health === 0) {
    onHeroDeath(database, resolvesAt);

    database.exec({
      sql: 'UPDATE hero_adventures SET available = available - 1 WHERE hero_id = $hero_id;',
      bind: {
        $hero_id: heroId,
      },
    });

    saveAdventureReport(
      database,
      {
        villageName: village.villageName,
        playerName: village.playerName,
        health,
        damageTaken,
        completed: database.selectValue({
          sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $hero_id;',
          bind: { $hero_id: heroId },
          schema: z.number(),
        })!,
        heroDied: true,
      },
      villageId,
      resolvesAt,
      village.factionId,
    );

    return;
  }

  database.exec({
    sql: 'UPDATE hero_adventures SET completed = completed + 1, available = available - 1 WHERE hero_id = $hero_id;',
    bind: {
      $hero_id: heroId,
    },
  });

  assessAdventureCountQuestCompletion(database, resolvesAt);

  saveAdventureReport(
    database,
    {
      villageName: village.villageName,
      playerName: village.playerName,
      health,
      damageTaken,
      completed: database.selectValue({
        sql: 'SELECT completed FROM hero_adventures WHERE hero_id = $hero_id;',
        bind: { $hero_id: heroId },
        schema: z.number(),
      })!,
      heroDied: false,
    },
    villageId,
    resolvesAt,
    village.factionId,
  );

  createEvents<'troopMovementReturn'>(database, {
    ...args,
    startsAt: resolvesAt,
    targetId: villageId,
    type: 'troopMovementReturn',
    originalMovementType: 'adventure',
  });
};

export const findNewVillageMovementResolver: Resolver<
  GameEvent<'troopMovementFindNewVillage'>
> = (database, args) => {
  const { targetId, resolvesAt } = args;

  // targetId here represents a tile_id where the new village will be founded
  const { resourceFieldComposition, tribe } = database.selectObject({
    sql: `
      SELECT
        rfc.resource_field_composition AS resourceFieldComposition,
        ti.tribe
      FROM
        tiles t
          JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
          CROSS JOIN players p
          JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE
        t.id = $tile_id
        AND p.id = $player_id;
    `,
    bind: {
      $tile_id: targetId,
      $player_id: PLAYER_ID,
    },
    schema: z.strictObject({
      resourceFieldComposition: resourceFieldCompositionSchema,
      tribe: playableTribeSchema,
    }),
  })!;

  // Create village with incremental slug v-{n}
  const { newVillageId } = database.selectObject({
    sql: `
      WITH
        next_slug AS (
          SELECT 'v-' || (COUNT(*) + 1) AS slug
          FROM
            villages
          WHERE
            player_id = $player_id
          )
      INSERT
      INTO
        villages (name, slug, tile_id, player_id)
      SELECT
        $name,
        (
          SELECT slug
          FROM
            next_slug
          ),
        $tile_id,
        $player_id
          RETURNING id AS newVillageId;
    `,
    bind: {
      $name: 'New village',
      $tile_id: targetId,
      $player_id: PLAYER_ID,
    },
    schema: z.strictObject({ newVillageId: z.number() }),
  })!;

  const buildingIdRows = database.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.strictObject({ id: z.number(), building: z.string() }),
  });

  const buildingIdMap = new Map<string, number>(
    buildingIdRows.map((b) => [b.building, b.id]),
  );

  const buildingFields = buildingFieldsFactory(
    'player',
    tribe,
    resourceFieldComposition,
  );

  for (const { field_id, building_id, level } of buildingFields) {
    database.exec({
      sql: `
        INSERT INTO
          building_fields (village_id, field_id, building_id, level)
        VALUES
          ($village_id, $field_id, $buildingId, $level);
      `,
      bind: {
        $village_id: newVillageId,
        $field_id: field_id,
        $buildingId: buildingIdMap.get(building_id)!,
        $level: level,
      },
    });
  }

  // Initialize resource site for the new village (fresh-settlement baseline similar to starting village)
  database.exec({
    sql: `
      INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
      VALUES ($tile_id, 750, 750, 750, 750, $updatedAt)
      ON CONFLICT(tile_id) DO NOTHING;
    `,
    bind: { $tile_id: targetId, $updatedAt: resolvesAt },
  });

  const quests = newVillageQuestsFactory(newVillageId, tribe);

  for (const quest of quests) {
    database.exec({
      sql: `
        INSERT INTO quests (quest_id, completed_at, collected_at, village_id)
        VALUES ($questId, NULL, NULL, $village_id);
      `,
      bind: {
        $questId: quest.id,
        $village_id: newVillageId,
      },
    });
  }

  const [tier1UnitId, settlerUnitId] = newVillageUnitResearchFactory(tribe);

  database.exec({
    sql: `
      INSERT INTO
        unit_research (village_id, unit_id)
      SELECT
        $village_id,
        u.id
      FROM
        unit_ids u
      WHERE
        u.unit IN ($tier1Unit, $settlerUnit);
    `,
    bind: {
      $village_id: newVillageId,
      $tier1Unit: tier1UnitId,
      $settlerUnit: settlerUnitId,
    },
  });
};

export const returnMovementResolver: Resolver<
  GameEvent<'troopMovementReturn'>
> = (database, args) => {
  const { targetId, troops, resolvesAt, loot } = args;

  // Guard: if the target village no longer exists, use the troops' source tile
  const villageExists = database.selectValue({
    sql: 'SELECT EXISTS(SELECT 1 FROM villages WHERE id = $targetId)',
    bind: { $targetId: targetId },
    schema: z.number(),
  });

  if (!villageExists) {
    // Find the home village via the troops' source tile
    if (troops.length > 0) {
      const homeVillageId = database.selectValue({
        sql: 'SELECT id FROM villages WHERE tile_id = $tileId LIMIT 1',
        bind: { $tileId: troops[0].source },
        schema: z.number(),
      });

      if (homeVillageId) {
        const homeTileId = database.selectValue({
          sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
          bind: { $villageId: homeVillageId },
          schema: z.number(),
        })!;

        updateVillageResourcesAt(database, homeVillageId, resolvesAt);
        addTroops(
          database,
          troops.map((troop) => ({
            ...troop,
            tileId: homeTileId,
          })),
        );

        if (loot) {
          addVillageResourcesAt(database, homeVillageId, resolvesAt, loot);
        }
      }
    }
    return;
  }

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetId;',
    bind: { $targetId: targetId },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  updateVillageResourcesAt(database, targetId, resolvesAt);
  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );

  if (loot) {
    addVillageResourcesAt(database, targetId, resolvesAt, loot);
  }
};

export const relocationMovementResolver: Resolver<
  GameEvent<'troopMovementRelocation'>
> = (database, args) => {
  const { targetId, troops, resolvesAt, villageId } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetId;',
    bind: { $targetId: targetId },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
      source: targetTileId,
    })),
  );

  // If hero is relocated, update effects as well
  if (troops.some(({ unitId }) => unitId === 'HERO')) {
    // Update resources in both villages, due to effects changing
    updateVillageResourcesAt(database, villageId, resolvesAt);
    updateVillageResourcesAt(database, targetId, resolvesAt);

    database.exec({
      sql: updateHeroEffectsVillageIdQuery,
      bind: {
        $player_id: PLAYER_ID,
        $targetId: targetId,
      },
    });

    database.exec({
      sql: 'UPDATE heroes SET village_id = $targetId WHERE player_id = $player_id;',
      bind: {
        $player_id: PLAYER_ID,
        $targetId: targetId,
      },
    });
  }
};

export const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovementReinforcements'>
> = (database, args) => {
  const { targetId, troops } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetId;',
    bind: { $targetId: targetId },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );
};

export const attackMovementResolver: Resolver<
  GameEvent<'troopMovementAttack'>
> = (database, args) => {
  resolveTroopMovementCombat(database, args, false);
};

export const raidMovementResolver: Resolver<GameEvent<'troopMovementRaid'>> = (
  database,
  args,
) => {
  resolveTroopMovementCombat(database, args, true);
};

export const settleMovementResolver: Resolver<
  GameEvent<'troopMovementSettle'>
> = (database, args) => {
  const { villageId, targetTileId, resolvesAt, troops } = args;

  // 1. Check tile is still empty (no village or oasis on it)
  const tileOccupied = database.selectValue({
    sql: `SELECT EXISTS(
      SELECT 1 FROM villages WHERE tile_id = $tileId
      UNION
      SELECT 1 FROM oasis WHERE tile_id = $tileId
    )`,
    bind: { $tileId: targetTileId },
    schema: z.number(),
  });

  if (tileOccupied) {
    // Tile taken — return settlers home
    const sourceTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    createEvents<'troopMovementReturn'>(database, {
      villageId: villageId,
      targetId: villageId,
      startsAt: resolvesAt,
      troops: troops.map((t) => ({
        ...t,
        tileId: targetTileId,
        source: sourceTileId,
      })),
      type: 'troopMovementReturn',
      originalMovementType: 'settle',
    });
    return;
  }

  // 2. Get player info from source village
  const playerInfo = database.selectObject({
    sql: `
      SELECT p.id AS playerId, p.tribe_id AS tribeId, ti.tribe
      FROM villages v
      JOIN players p ON v.player_id = p.id
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE v.id = $village_id
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      playerId: z.number(),
      tribeId: z.number(),
      tribe: playableTribeSchema,
    }),
  })!;

  // 3. Get tile coordinates and resource field composition for naming
  const tileInfo = database.selectObject({
    sql: `
      SELECT t.x, t.y, rfc.resource_field_composition AS resourceFieldComposition
      FROM tiles t
      LEFT JOIN resource_field_composition_ids rfc
        ON t.resource_field_composition_id = rfc.id
      WHERE t.id = $tile_id
    `,
    bind: { $tile_id: targetTileId },
    schema: z.strictObject({
      x: z.number(),
      y: z.number(),
      resourceFieldComposition: resourceFieldCompositionSchema.nullable(),
    }),
  })!;

  // 4. Create the village record with incremental slug and tribe_id
  const { newVillageId } = database.selectObject({
    sql: `
      WITH
        next_slug AS (
          SELECT 'v-' || (COUNT(*) + 1) AS slug
          FROM villages
          WHERE player_id = $player_id
        )
      INSERT INTO villages (name, slug, tile_id, player_id, tribe_id, loyalty, loyalty_updated_at)
      SELECT $name, (SELECT slug FROM next_slug), $tile_id, $player_id, $tribe_id, 100, $now
      RETURNING id AS newVillageId;
    `,
    bind: {
      $name: `Village (${tileInfo.x}|${tileInfo.y})`,
      $tile_id: targetTileId,
      $player_id: playerInfo.playerId,
      $tribe_id: playerInfo.tribeId,
      $now: resolvesAt,
    },
    schema: z.strictObject({ newVillageId: z.number() }),
  })!;

  // 5. Seed default buildings for new village
  const buildingIdRows = database.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.strictObject({ id: z.number(), building: z.string() }),
  });

  const buildingIdMap = new Map<string, number>(
    buildingIdRows.map((b) => [b.building, b.id]),
  );

  const buildingFields = buildingFieldsFactory(
    'player',
    playerInfo.tribe,
    tileInfo.resourceFieldComposition ?? '4446',
  );

  for (const { field_id, building_id, level } of buildingFields) {
    database.exec({
      sql: `
        INSERT INTO building_fields (village_id, field_id, building_id, level)
        VALUES ($village_id, $field_id, $buildingId, $level);
      `,
      bind: {
        $village_id: newVillageId,
        $field_id: field_id,
        $buildingId: buildingIdMap.get(building_id)!,
        $level: level,
      },
    });
  }

  // 6. Seed resource sites at 750 each (starting resources)
  database.exec({
    sql: `
      INSERT INTO resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
      VALUES ($tile_id, 750, 750, 750, 750, $updatedAt)
      ON CONFLICT(tile_id) DO NOTHING;
    `,
    bind: { $tile_id: targetTileId, $updatedAt: resolvesAt },
  });

  // 7. Seed initial quests
  const quests = newVillageQuestsFactory(newVillageId, playerInfo.tribe);
  for (const quest of quests) {
    database.exec({
      sql: `
        INSERT INTO quests (quest_id, completed_at, collected_at, village_id)
        VALUES ($questId, NULL, NULL, $village_id);
      `,
      bind: {
        $questId: quest.id,
        $village_id: newVillageId,
      },
    });
  }

  // 8. Seed unit research (tier 1 unit + settler)
  const [tier1UnitId, settlerUnitId] = newVillageUnitResearchFactory(
    playerInfo.tribe,
  );
  database.exec({
    sql: `
      INSERT INTO unit_research (village_id, unit_id)
      SELECT $village_id, u.id
      FROM unit_ids u
      WHERE u.unit IN ($tier1Unit, $settlerUnit);
    `,
    bind: {
      $village_id: newVillageId,
      $tier1Unit: tier1UnitId,
      $settlerUnit: settlerUnitId,
    },
  });

  // 9. Settlers are consumed — do NOT create a return event for them
};
