import { z } from 'zod';
import { newVillageUnitResearchFactory } from '@pillage-first/game-assets/factories/unit-research';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { newVillageQuestsFactory } from '@pillage-first/game-assets/quests';
import { unitsMap } from '@pillage-first/game-assets/units';
import { buildingFieldsFactory } from '@pillage-first/game-assets/village';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
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
import { saveAdventureReport, saveScoutReports } from './utils/reports.ts';
import { addTroops } from './utils/troops.ts';

const isScoutUnit = (unitId: string) =>
  unitsMap.get(unitId as UnitId)?.tier === 'scout';

const calculateScoutStrength = (
  troops: { unitId: string; amount: number }[],
  mode: 'attack' | 'defence',
) => {
  return troops.reduce((total, troop) => {
    const unit = unitsMap.get(troop.unitId as UnitId);

    if (!unit) {
      return total;
    }

    return (
      total +
      (mode === 'attack' ? unit.attack : unit.infantryDefence) * troop.amount
    );
  }, 0);
};

const applyScoutLosses = (
  troops: { unitId: string; amount: number }[],
  casualtyPercent: number,
) => {
  const survivors: { unitId: string; amount: number }[] = [];
  const losses: { unitId: string; amount: number }[] = [];

  for (const troop of troops) {
    const lost = Math.min(
      troop.amount,
      Math.round(troop.amount * casualtyPercent),
    );
    const survived = troop.amount - lost;

    if (lost > 0) {
      losses.push({ unitId: troop.unitId, amount: lost });
    }
    if (survived > 0) {
      survivors.push({ unitId: troop.unitId, amount: survived });
    }
  }

  return { survivors, losses };
};

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
> = (_database, _args) => {};

export const scoutMovementResolver: Resolver<
  GameEvent<'troopMovementScout'>
> = (database, args) => {
  const { villageId, targetId, resolvesAt, troops } = args;

  const attackerVillage = database.selectObject({
    sql: `
      SELECT v.tile_id AS tileId, v.name AS villageName, p.name AS playerName, p.faction_id AS factionId, ti.tribe AS tribe
      FROM villages v
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE v.id = $villageId
    `,
    bind: { $villageId: villageId },
    schema: z.strictObject({
      tileId: z.number(),
      villageName: z.string(),
      playerName: z.string(),
      factionId: z.number(),
      tribe: z.string(),
    }),
  })!;

  const defenderVillage = database.selectObject({
    sql: `
      SELECT v.tile_id AS tileId, v.name AS villageName, p.name AS playerName, p.faction_id AS factionId, ti.tribe AS tribe
      FROM villages v
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE v.id = $villageId
    `,
    bind: { $villageId: targetId },
    schema: z.strictObject({
      tileId: z.number(),
      villageName: z.string(),
      playerName: z.string(),
      factionId: z.number(),
      tribe: z.string(),
    }),
  })!;

  const defenderScouts = database
    .selectObjects({
      sql: `
      SELECT u.unit AS unitId, t.amount, t.tile_id AS tileId, t.source_tile_id AS source
      FROM troops t
      JOIN unit_ids u ON u.id = t.unit_id
      WHERE t.tile_id = $tileId
        AND t.amount > 0
    `,
      bind: { $tileId: defenderVillage.tileId },
      schema: z.strictObject({
        unitId: z.string(),
        amount: z.number(),
        tileId: z.number(),
        source: z.number(),
      }),
    })
    .filter((troop) => isScoutUnit(troop.unitId));

  const attackerStrength = calculateScoutStrength(troops, 'attack');
  const defenderStrength = calculateScoutStrength(defenderScouts, 'defence');
  const attackerWins =
    attackerStrength > defenderStrength || defenderScouts.length === 0;

  const attackerCasualtyPercent =
    defenderStrength <= 0
      ? 0
      : attackerWins
        ? Math.min(0.8, defenderStrength / Math.max(attackerStrength, 1))
        : 1;
  const defenderCasualtyPercent =
    attackerStrength <= 0
      ? 0
      : attackerWins
        ? 1
        : Math.min(0.8, attackerStrength / Math.max(defenderStrength, 1));

  const attackerOutcome = applyScoutLosses(troops, attackerCasualtyPercent);
  const defenderOutcome = applyScoutLosses(
    defenderScouts,
    defenderCasualtyPercent,
  );

  for (const loss of defenderOutcome.losses) {
    const matchingTroops = defenderScouts.filter(
      (troop) => troop.unitId === loss.unitId,
    );
    let remaining = loss.amount;

    for (const troop of matchingTroops) {
      if (remaining <= 0) {
        break;
      }

      const toRemove = Math.min(remaining, troop.amount);
      remaining -= toRemove;

      database.exec({
        sql: `
          DELETE FROM troops
          WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)
            AND tile_id = $tileId
            AND source_tile_id = $sourceTileId
            AND amount <= $amount;
        `,
        bind: {
          $unitId: troop.unitId,
          $tileId: troop.tileId,
          $sourceTileId: troop.source,
          $amount: toRemove,
        },
      });
      database.exec({
        sql: `
          UPDATE troops
          SET amount = amount - $amount
          WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)
            AND tile_id = $tileId
            AND source_tile_id = $sourceTileId
            AND amount > $amount;
        `,
        bind: {
          $unitId: troop.unitId,
          $tileId: troop.tileId,
          $sourceTileId: troop.source,
          $amount: toRemove,
        },
      });
    }
  }

  const defenderResources = database.selectObject({
    sql: `
      SELECT wood, clay, iron, wheat
      FROM resource_sites
      WHERE tile_id = $tileId
    `,
    bind: { $tileId: defenderVillage.tileId },
    schema: z.strictObject({
      wood: z.number(),
      clay: z.number(),
      iron: z.number(),
      wheat: z.number(),
    }),
  });

  const wallAndPalace = database.selectObjects({
    sql: `
      SELECT b.building AS buildingId, bf.level
      FROM building_fields bf
      JOIN building_ids b ON b.id = bf.building_id
      WHERE bf.village_id = $villageId
        AND b.building IN (
          'ROMAN_WALL', 'GAUL_WALL', 'TEUTONIC_WALL', 'EGYPTIAN_WALL', 'HUN_WALL', 'SPARTAN_WALL', 'NATAR_WALL', 'NATURE_WALL',
          'RESIDENCE', 'COMMAND_CENTER'
        )
    `,
    bind: { $villageId: targetId },
    schema: z.strictObject({
      buildingId: z.string(),
      level: z.number(),
    }),
  });

  const wallLevel = wallAndPalace.find(({ buildingId }) =>
    buildingId.endsWith('_WALL'),
  )?.level;
  const palaceLevel = wallAndPalace
    .filter(
      ({ buildingId }) =>
        buildingId === 'RESIDENCE' || buildingId === 'COMMAND_CENTER',
    )
    .reduce((max, building) => Math.max(max, building.level), 0);

  const defenderTroops = database.selectObjects({
    sql: `
      SELECT u.unit AS unitId, t.amount
      FROM troops t
      JOIN unit_ids u ON u.id = t.unit_id
      WHERE t.tile_id = $tileId
        AND t.amount > 0
    `,
    bind: { $tileId: defenderVillage.tileId },
    schema: z.strictObject({ unitId: z.string(), amount: z.number() }),
  });

  saveScoutReports(
    database,
    {
      attackerVillageName: attackerVillage.villageName,
      defenderVillageName: defenderVillage.villageName,
      attackerPlayerName: attackerVillage.playerName,
      defenderPlayerName: defenderVillage.playerName,
      attackerTribe: attackerVillage.tribe,
      defenderTribe: defenderVillage.tribe,
      attackerScouts: troops.map(({ unitId, amount }) => ({ unitId, amount })),
      defenderScouts: defenderScouts.map(({ unitId, amount }) => ({
        unitId,
        amount,
      })),
      attackerLosses: attackerOutcome.losses,
      defenderLosses: defenderOutcome.losses,
      attackerSurvivors: attackerOutcome.survivors,
      defenderSurvivors: defenderOutcome.survivors,
      wasDetected: defenderScouts.length > 0,
      resources:
        attackerOutcome.survivors.length > 0 &&
        attackerWins &&
        defenderResources
          ? [
              defenderResources.wood,
              defenderResources.clay,
              defenderResources.iron,
              defenderResources.wheat,
            ]
          : undefined,
      wallLevel,
      palaceLevel,
      troops:
        attackerOutcome.survivors.length > 0 && attackerWins
          ? defenderTroops.map(({ unitId, amount }) => ({ unitId, amount }))
          : undefined,
    },
    villageId,
    targetId,
    resolvesAt,
    attackerVillage.factionId,
    defenderVillage.factionId,
  );

  if (attackerOutcome.survivors.length > 0) {
    createEvents<'troopMovementReturn'>(database, {
      villageId: targetId,
      targetId: villageId,
      startsAt: resolvesAt,
      troops: attackerOutcome.survivors.map(({ unitId, amount }) => ({
        unitId: unitId as UnitId,
        amount,
        tileId: defenderVillage.tileId,
        source: attackerVillage.tileId,
      })),
      type: 'troopMovementReturn',
      originalMovementType: 'scout',
    });
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
