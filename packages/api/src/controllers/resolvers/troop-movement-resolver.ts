import { z } from 'zod';
import { resolveCombat } from '@pillage-first/game-assets/combat/combat-engine';
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
import { getAttackerTroopsWithSmithy } from './utils/combat';
import { resolveTroopMovementCombat } from './utils/combat-resolver.ts';
import { onHeroDeath } from './utils/hero.ts';
import { assessAdventureCountQuestCompletion } from './utils/quests.ts';
import { saveAdventureReport, saveCombatReport } from './utils/reports.ts';
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

export const oasisOccupationMovementResolver: Resolver<
  GameEvent<'troopMovementOasisOccupation'>
> = (database, args) => {
  const { villageId, targetId, resolvesAt, troops: attackerTroopsRaw } = args;

  const oasisData = database.selectObject({
    sql: `
      SELECT
        o.tile_id AS tileId,
        o.village_id AS ownerVillageId,
        o.loyalty,
        v.player_id AS npcPlayerId
      FROM oasis o
      LEFT JOIN villages v ON v.id = o.village_id
      WHERE o.tile_id = $tile_id
    `,
    bind: { $tile_id: targetId },
    schema: z.strictObject({
      tileId: z.number(),
      ownerVillageId: z.number().nullable(),
      loyalty: z.number(),
      npcPlayerId: z.number().nullable(),
    }),
  })!;

  const attackerVillage = database.selectObject({
    sql: `
      SELECT
        v.name AS villageName,
        p.name AS playerName,
        p.faction_id AS factionId,
        ti.tribe AS tribe
      FROM villages v
      JOIN players p ON v.player_id = p.id
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE v.id = $id
    `,
    bind: { $id: villageId },
    schema: z.strictObject({
      villageName: z.string(),
      playerName: z.string(),
      factionId: z.number(),
      tribe: z.string(),
    }),
  })!;

  const heroInTroops = attackerTroopsRaw.some((t) => t.unitId === 'HERO');
  const heroHealth = heroInTroops
    ? database.selectValue({
        sql: 'SELECT health FROM heroes WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id)',
        bind: { $village_id: villageId },
        schema: z.number().nullable(),
      })
    : 0;
  const heroAlive = heroInTroops && heroHealth != null && heroHealth > 0;

  const attackerTroops = getAttackerTroopsWithSmithy(
    database,
    villageId,
    attackerTroopsRaw,
  );

  // Get defender troops (nature animals) - no smithy for nature
  const defenderTroopsRaw = database.selectObjects({
    sql: `
      SELECT u.unit AS unitId, t.amount
      FROM troops t
      JOIN unit_ids u ON t.unit_id = u.id
      WHERE t.tile_id = $tile_id AND t.amount > 0;
    `,
    bind: { $tile_id: targetId },
    schema: z.strictObject({
      unitId: z.string(),
      amount: z.number(),
    }),
  });

  const defenderTroops = defenderTroopsRaw.map((t) => ({
    unitId: t.unitId as import('@pillage-first/types/models/unit').UnitId,
    amount: t.amount,
    smithyLevel: 0,
  }));

  const result = resolveCombat(
    attackerTroops,
    defenderTroops,
    { wallType: null, wallLevel: 0, palaceLevel: 0 },
    [0, 0, 0, 0],
    false,
  );

  const attackerHeroSurvived = result.attackerSurvivors.some(
    ({ unitId }) => unitId === 'HERO',
  );
  const attackerHeroDied = heroInTroops && !attackerHeroSurvived;

  if (attackerHeroDied) {
    database.exec({
      sql: 'UPDATE heroes SET health = 0 WHERE player_id = (SELECT player_id FROM villages WHERE id = $villageId);',
      bind: { $villageId: villageId },
    });
    onHeroDeath(database, resolvesAt);
  }

  // Remove all defender troops and replace with survivors
  database.exec({
    sql: 'DELETE FROM troops WHERE tile_id = $tileId',
    bind: { $tileId: oasisData.tileId },
  });

  const totalDefenderInitial = defenderTroops.reduce(
    (sum, t) => sum + t.amount,
    0,
  );
  const totalDefenderLost = result.defenderLosses.reduce(
    (sum, t) => sum + t.amount,
    0,
  );
  const defenderLossRatio =
    totalDefenderInitial > 0 ? totalDefenderLost / totalDefenderInitial : 0;

  const survivingDefenderTroops = [];
  for (const def of defenderTroopsRaw) {
    const lost = Math.round(def.amount * defenderLossRatio);
    const survived = def.amount - lost;
    if (survived > 0) {
      survivingDefenderTroops.push({
        unitId: def.unitId as import('@pillage-first/types/models/unit').UnitId,
        amount: survived,
        tileId: oasisData.tileId,
        source: oasisData.tileId,
      });
    }
  }
  if (survivingDefenderTroops.length > 0) {
    addTroops(database, survivingDefenderTroops);
  }

  const totalDefenderRemaining = result.defenderSurvivors.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  // Send survivors home
  if (result.attackerSurvivors.length > 0) {
    const sourceTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
      bind: { $villageId: villageId },
      schema: z.number(),
    })!;

    createEvents<'troopMovementReturn'>(database, {
      villageId: villageId,
      targetId: villageId,
      startsAt: resolvesAt,
      troops: result.attackerSurvivors.map((s) => ({
        unitId: s.unitId,
        amount: s.amount,
        tileId: oasisData.tileId,
        source: sourceTileId,
      })),
      type: 'troopMovementReturn',
      originalMovementType: 'oasis-occupation',
    });
  }

  // Calculate loyalty reduction if hero is alive and all defenders dead
  let loyaltyDecrease: number | undefined;
  let newLoyalty: number | undefined;

  if (heroAlive && totalDefenderRemaining === 0) {
    const isNpcOwned = oasisData.npcPlayerId !== null;

    loyaltyDecrease = 20;
    if (isNpcOwned) {
      const npcOasisCount =
        database.selectValue({
          sql: 'SELECT COUNT(*) FROM oasis o JOIN villages v ON o.village_id = v.id WHERE v.player_id = $npcPlayerId',
          bind: { $npcPlayerId: oasisData.npcPlayerId },
          schema: z.number(),
        }) ?? 0;

      if (npcOasisCount >= 3) {
        loyaltyDecrease = 30;
      } else if (npcOasisCount === 2) {
        loyaltyDecrease = 25;
      }
    }

    newLoyalty = Math.max(0, oasisData.loyalty - loyaltyDecrease);

    database.exec({
      sql: 'UPDATE oasis SET loyalty = $loyalty WHERE tile_id = $tile_id',
      bind: { $loyalty: newLoyalty, $tile_id: targetId },
    });
  }

  // Save combat report
  // Use null for defender faction since Nature has no faction (not 0, which would violate FK)
  const reportData = {
    ...result,
    attackerVillageName: attackerVillage.villageName,
    defenderVillageName: 'Oasis',
    attackerPlayerName: attackerVillage.playerName,
    defenderPlayerName: 'Nature',
    attackerTribe: attackerVillage.tribe,
    defenderTribe: 'nature',
    initialAttackerTroops: attackerTroopsRaw,
    initialDefenderTroops: defenderTroopsRaw.map((d) => ({
      unitId: d.unitId,
      amount: d.amount,
    })),
    isRaid: false,
    oasisLoyaltyDecrease: loyaltyDecrease,
    oasisLoyaltyCurrent: newLoyalty,
  };

  saveCombatReport(
    database,
    reportData,
    villageId,
    targetId,
    resolvesAt,
    attackerVillage.factionId,
    null,
  );

  // Skip occupation logic if hero not alive or defenders remain
  if (!heroAlive || totalDefenderRemaining > 0) {
    return;
  }

  // Check for free oasis slots
  const occupiedOases =
    database.selectValue({
      sql: 'SELECT COUNT(*) FROM oasis WHERE village_id = $village_id',
      bind: { $village_id: villageId },
      schema: z.number(),
    }) ?? 0;

  const occupiedOasisSlots =
    database.selectValue({
      sql: `
      SELECT CASE
        WHEN bf.level >= 20 THEN 3
        WHEN bf.level >= 15 THEN 2
        WHEN bf.level >= 10 THEN 1
        ELSE 0
      END
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      WHERE bf.village_id = $village_id AND bi.building = 'HEROS_MANSION'
      LIMIT 1
    `,
      bind: { $village_id: villageId },
      schema: z.number(),
    }) ?? 0;

  if (newLoyalty! <= 0 && occupiedOases < occupiedOasisSlots) {
    // Remove old owner's effects if any
    if (oasisData.ownerVillageId) {
      database.exec({
        sql: 'DELETE FROM effects WHERE source = $source AND village_id = $village_id AND source_specifier = $source_specifier',
        bind: {
          $source: 'oasis',
          $village_id: oasisData.ownerVillageId,
          $source_specifier: targetId,
        },
      });
    }

    // Assign oasis to attacker
    database.exec({
      sql: 'UPDATE oasis SET village_id = $village_id, loyalty = 100 WHERE tile_id = $tile_id',
      bind: { $village_id: villageId, $tile_id: targetId },
    });

    // Add production bonuses
    const oasisBonuses = database.selectObjects({
      sql: 'SELECT resource, bonus FROM oasis WHERE tile_id = $tile_id',
      bind: { $tile_id: targetId },
      schema: z.object({ resource: z.string(), bonus: z.number() }),
    });

    for (const { resource, bonus } of oasisBonuses) {
      const effectId = `${resource}Production`;
      const value = bonus === 25 ? 1.25 : 1.5;

      database.exec({
        sql: `
          INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
          VALUES ((SELECT id FROM effect_ids WHERE effect = $effect_id), $value, $type, $scope, $source, $village_id, $source_specifier)
        `,
        bind: {
          $effect_id: effectId,
          $value: value,
          $type: 'bonus',
          $scope: 'village',
          $source: 'oasis',
          $village_id: villageId,
          $source_specifier: targetId,
        },
      });
    }
  }
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
