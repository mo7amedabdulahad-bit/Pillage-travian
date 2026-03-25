import type { SqlValue } from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { unitsMap } from '@pillage-first/game-assets/units';
import { calculateAdventurePointIncreaseEventDuration } from '@pillage-first/game-assets/utils/adventures';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDurationForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import {
  calculateHealthRegenerationEventDuration,
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '@pillage-first/game-assets/utils/hero';
import {
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
  getUnitDefinition,
} from '@pillage-first/game-assets/utils/units';
import type {
  GameEvent,
  TroopMovementEvent,
} from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import { troopSchema } from '@pillage-first/types/models/troop';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import {
  isAdventurePointIncreaseEvent,
  isAdventureTroopMovementEvent,
  isBuildingConstructionEvent,
  isBuildingDestructionEvent,
  isBuildingLevelUpEvent,
  isFindNewVillageTroopMovementEvent,
  isHeroHealthRegenerationEvent,
  isHeroRevivalEvent,
  isOasisReleaseEvent,
  isReturnTroopMovementEvent,
  isScheduledBuildingEvent,
  isSettleTroopMovementEvent,
  isTroopMovementEvent,
  isTroopTrainingEvent,
  isUnitImprovementEvent,
  isUnitResearchEvent,
} from '@pillage-first/utils/guards/event';
import { calculateDistanceBetweenPoints } from '@pillage-first/utils/math';
import { selectAllRelevantEffectsByIdQuery } from '../../utils/queries/effect-queries';
import { selectAllVillageEventsByTypeQuery } from '../../utils/queries/event-queries';
import { calculateVillageResourcesAt } from '../../utils/village';
import { apiEffectSchema } from '../../utils/zod/effect-schemas';
import { eventSchema } from '../../utils/zod/event-schemas';
import { removeTroops } from '../resolvers/utils/troops.ts';
import { calculateAdventureDuration } from './adventures.ts';

const validateTroopMovementPayload = (
  database: DbFacade,
  event: TroopMovementEvent,
) => {
  const troops = z.array(troopSchema).parse(event.troops);

  if (troops.length === 0) {
    throw new Error('At least one troop must be sent');
  }

  const village = database.selectObject({
    sql: 'SELECT tile_id AS tileId, player_id AS playerId FROM villages WHERE id = $villageId;',
    bind: { $villageId: event.villageId },
    schema: z.strictObject({ tileId: z.number(), playerId: z.number() }),
  });

  if (!village) {
    throw new Error('Source village not found');
  }

  const villageTargetMovementTypes = new Set([
    'troopMovementReinforcements',
    'troopMovementRelocation',
    'troopMovementAttack',
    'troopMovementRaid',
  ]);

  // Check if target is an oasis tile
  const isTargetOasis = database.selectValue({
    sql: 'SELECT EXISTS(SELECT 1 FROM oasis WHERE tile_id = $tile_id) AS is_oasis',
    bind: { $tile_id: event.targetId },
    schema: z.number(),
  });

  const targetVillage =
    villageTargetMovementTypes.has(event.type) && !isTargetOasis
      ? (database.selectObject({
          sql: `
          SELECT
            v.id,
            v.player_id AS playerId,
            fi.faction,
            fr.reputation
          FROM villages v
          LEFT JOIN players p ON p.id = v.player_id
          LEFT JOIN faction_ids fi ON fi.id = p.faction_id
          LEFT JOIN faction_reputation fr
            ON fr.source_faction_id = (SELECT faction_id FROM players WHERE id = $playerId)
            AND fr.target_faction_id = p.faction_id
          WHERE v.id = $targetId;
        `,
          bind: {
            $targetId: event.targetId,
            $playerId: village.playerId,
          },
          schema: z.strictObject({
            id: z.number(),
            playerId: z.number().nullable(),
            faction: z.string().nullable(),
            reputation: z.number().nullable(),
          }),
        }) ?? null)
      : null;

  if (
    villageTargetMovementTypes.has(event.type) &&
    !targetVillage &&
    !isTargetOasis
  ) {
    throw new Error('Target village not found');
  }

  // NOTE: Ally/reputation-based restrictions are handled at the game event/reputation layer, not here.

  if (
    event.scoutMode !== undefined &&
    troops.some((troop) => unitsMap.get(troop.unitId)?.tier !== 'scout')
  ) {
    throw new Error('Only scout units can be sent on scout missions');
  }

  if (
    event.type === 'troopMovementRelocation' &&
    targetVillage?.playerId !== village.playerId
  ) {
    throw new Error('Relocation can only target your own villages');
  }

  if (!isReturnTroopMovementEvent(event)) {
    for (const troop of troops) {
      if (troop.tileId !== village.tileId) {
        throw new Error('Troops must be sent from the source village tile');
      }

      const availableAmount =
        database.selectValue({
          sql: `
            SELECT amount
            FROM troops
            WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)
              AND tile_id = $tileId
              AND source_tile_id = $sourceTileId;
          `,
          bind: {
            $unitId: troop.unitId,
            $tileId: troop.tileId,
            $sourceTileId: troop.source,
          },
          schema: z.number(),
        }) ?? 0;

      if (availableAmount < troop.amount) {
        throw new Error(`Not enough ${troop.unitId} troops available`);
      }
    }
  }
};

export const insertEvents = (database: DbFacade, events: GameEvent[]): void => {
  const requiredEventProperties = new Set([
    'type',
    'startsAt',
    'duration',
    'villageId',
  ]);
  // We add + 1 for the `meta` column
  const amountOfColumnsToInsert = requiredEventProperties.size + 1;

  const sqlTemplate = `
    INSERT INTO
      events (type, starts_at, duration, village_id, meta)
    VALUES
      (?, ?, ?, ?, ?)
  `;

  const amountOfEvents = events.length;

  const sql = `${sqlTemplate}${',(?, ?, ?, ?, ?)'.repeat(amountOfEvents - 1)};`;

  const params: SqlValue[] = Array.from({
    length: events.length * amountOfColumnsToInsert,
  });

  // We intentionally skip object destructuring assignment in favor of this manual approach,
  // due to this approach being ~ 1.5x faster, which adds when potentially creating thousands of events.
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    const base = i * amountOfColumnsToInsert;

    params[base] = event.type;
    params[base + 1] = event.startsAt;
    params[base + 2] = event.duration;
    params[base + 3] = event.villageId ?? null;

    let metaObj: Record<string, SqlValue> | undefined;
    for (const property in event) {
      if (requiredEventProperties.has(property)) {
        continue;
      }

      // Lazy object initialization
      if (!metaObj) {
        metaObj = {};
      }

      metaObj[property] = event[property as keyof GameEvent];
    }

    params[base + 4] = metaObj ? JSON.stringify(metaObj) : null;
  }

  const stmt = database.prepare({ sql });
  stmt.bind(params).stepReset();
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const validateEventCreationPrerequisites = (
  database: DbFacade,
  event: GameEvent,
): void => {
  if (isTroopMovementEvent(event)) {
    validateTroopMovementPayload(database, event);
  }

  if (isUnitImprovementEvent(event)) {
    const { villageId, level } = event;

    if (level > 20) {
      throw new Error('Unit upgrade level cannot exceed 20');
    }

    const smithyLevel = database.selectValue({
      sql: `
        SELECT
          COALESCE(
            (
              SELECT
                bf.level
              FROM
                building_fields bf
                  JOIN building_ids bi ON bi.id = bf.building_id
              WHERE
                bf.village_id = $village_id
                AND bi.building = 'SMITHY'
              LIMIT 1
            ),
            0
          ) AS smithy_level;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    if (smithyLevel < level) {
      throw new Error('Smithy level is too low for this unit upgrade');
    }

    const hasOngoingUnitImprovementEventsInThisVillage = database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              events
            WHERE
              type = 'unitImprovement'
              AND village_id = $village_id
            ) AS event_exists;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    });

    if (hasOngoingUnitImprovementEventsInThisVillage) {
      throw new Error('Smithy is busy');
    }

    const currentUnitUpgradeLevel = database.selectValue({
      sql: `
        SELECT
          COALESCE(
            (
              SELECT
                level
              FROM
                unit_improvements
              WHERE
                player_id = (
                  SELECT
                    player_id
                  FROM
                    villages
                  WHERE
                    id = $village_id
                )
                AND unit_id = (
                  SELECT
                    id
                  FROM
                    unit_ids
                  WHERE
                    unit = $unit_id
                )
            ),
            0
          ) AS current_level;
      `,
      bind: {
        $village_id: villageId,
        $unit_id: event.unitId,
      },
      schema: z.number(),
    })!;

    if (currentUnitUpgradeLevel >= level) {
      throw new Error('Unit upgrade level already exists');
    }
  }

  if (isUnitResearchEvent(event)) {
    const { unitId, villageId } = event;

    const hasOngoingUnitResearchEventsInThisVillage = !!database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              events
            WHERE
              type = 'unitResearch'
              AND village_id = $village_id
            ) AS event_exists;
      `,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    });

    if (hasOngoingUnitResearchEventsInThisVillage) {
      throw new Error('Academy is busy');
    }

    const hasAlreadyResearchedUnitsWithSameIdAndVillage =
      !!database.selectValue({
        sql: `
          SELECT
            EXISTS
            (
              SELECT 1
              FROM
                unit_research
              WHERE
                village_id = $village_id
                AND unit_id = (
                  SELECT id
                  FROM
                    unit_ids
                  WHERE
                    unit = $unit_id
                  )
              ) AS is_researched;
        `,
        bind: {
          $village_id: villageId,
          $unit_id: unitId,
        },
        schema: z.number(),
      });

    if (hasAlreadyResearchedUnitsWithSameIdAndVillage) {
      throw new Error('Unit is already researched');
    }
  }

  if (isTroopTrainingEvent(event)) {
    const { villageId, unitId, buildingId } = event;

    const isUnitResearched = !!database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              unit_research
            WHERE
              village_id = $village_id
              AND unit_id = (
                SELECT id
                FROM
                  unit_ids
                WHERE
                  unit = $unit_id
                )
            ) AS is_researched;`,
      bind: {
        $village_id: villageId,
        $unit_id: unitId,
      },
      schema: z.number(),
    });

    if (!isUnitResearched) {
      throw new Error('Unit is not researched');
    }

    const doesUnitTrainingBuildingExist = !!database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              building_fields
            WHERE
              village_id = $village_id
              AND building_id = (
                SELECT id
                FROM
                  building_ids
                WHERE
                  building = $building_id
                )
              AND level > 0
            ) AS building_exists;
      `,
      bind: {
        $village_id: villageId,
        $building_id: buildingId,
      },
      schema: z.number(),
    });

    if (!doesUnitTrainingBuildingExist) {
      throw new Error('Unit training building does not exist');
    }
  }

  if (isBuildingLevelUpEvent(event)) {
    const { buildingId, level } = event;
    const { maxLevel } = getBuildingDefinition(buildingId);

    if (level > maxLevel) {
      throw new Error('Building level cannot exceed max level');
    }
  }

  if (isBuildingConstructionEvent(event)) {
    const { villageId, buildingFieldId } = event;

    const isBuildingFieldOccupied = !!database.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              building_fields
            WHERE
              village_id = $village_id
              AND field_id = $building_field_id
              AND level > 0
          ) AS is_occupied;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
      },
      schema: z.number(),
    });

    if (isBuildingFieldOccupied) {
      throw new Error('Building field is already occupied');
    }
  }

  if (isScheduledBuildingEvent(event)) {
  }

  if (isHeroRevivalEvent(event)) {
    const isHeroAlive = !!database.selectValue({
      sql: 'SELECT health > 0 FROM heroes WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    if (isHeroAlive) {
      throw new Error('Hero is already alive');
    }
  }

  if (isAdventureTroopMovementEvent(event)) {
    const hasAvailableAdventurePoints = !!database.selectValue({
      sql: `
        SELECT
          COALESCE(ha.available, 0) > 0 AS has_available_adventure_points
        FROM
          heroes h
            LEFT JOIN hero_adventures ha ON ha.hero_id = h.id
        WHERE
          h.player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    if (!hasAvailableAdventurePoints) {
      throw new Error('No adventure points available');
    }
  }
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const validateEventCreationResources = (
  database: DbFacade,
  event: GameEvent,
  eventCost: number[],
): boolean => {
  const { villageId, startsAt } = event;
  const [woodCost, clayCost, ironCost, wheatCost] = eventCost;
  const { currentWood, currentClay, currentIron, currentWheat } =
    calculateVillageResourcesAt(database, villageId, startsAt);

  return !(
    woodCost > currentWood ||
    clayCost > currentClay ||
    ironCost > currentIron ||
    wheatCost > currentWheat
  );
};

export const runEventCreationSideEffects = (
  database: DbFacade,
  events: GameEvent[],
) => {
  const [event] = events;

  if (isTroopMovementEvent(event)) {
    const troopMovementEvents = events as TroopMovementEvent[];

    for (const { troops } of troopMovementEvents) {
      removeTroops(database, troops);
    }
  }

  // Settle events have troops but use a different type (targetTileId instead of targetId)
  if (isSettleTroopMovementEvent(event)) {
    for (const { troops } of events as GameEvent<'troopMovementSettle'>[]) {
      removeTroops(database, troops);
    }
  }
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const getEventCost = (
  database: DbFacade,
  event: GameEvent,
): number[] => {
  if (isBuildingLevelUpEvent(event)) {
    const isFreeBuildingConstructionEnabled = database.selectValue({
      sql: 'SELECT is_free_building_construction_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeBuildingConstructionEnabled) {
      return [0, 0, 0, 0];
    }

    const { buildingId, level } = event;
    return calculateBuildingCostForLevel(buildingId, level);
  }

  if (isUnitResearchEvent(event)) {
    const isFreeUnitResearchEnabled = database.selectValue({
      sql: 'SELECT is_free_unit_research_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeUnitResearchEnabled) {
      return [0, 0, 0, 0];
    }

    const { unitId } = event;
    return calculateUnitResearchCost(unitId);
  }

  if (isUnitImprovementEvent(event)) {
    const isFreeUnitImprovementEnabled = database.selectValue({
      sql: 'SELECT is_free_unit_improvement_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeUnitImprovementEnabled) {
      return [0, 0, 0, 0];
    }

    const { unitId, level } = event;
    return calculateUnitUpgradeCostForLevel(unitId, level);
  }

  if (isTroopTrainingEvent(event)) {
    const isFreeUnitTrainingEnabled = database.selectValue({
      sql: 'SELECT is_free_unit_training_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeUnitTrainingEnabled) {
      return [0, 0, 0, 0];
    }

    const { unitId, buildingId, amount } = event;
    const { baseRecruitmentCost } = getUnitDefinition(unitId);

    const costModifier =
      buildingId === 'GREAT_BARRACKS' || buildingId === 'GREAT_STABLE' ? 3 : 1;

    return baseRecruitmentCost.map((cost) => cost * costModifier * amount);
  }

  if (isHeroRevivalEvent(event)) {
    const isFreeHeroReviveEnabled = database.selectValue({
      sql: 'SELECT is_free_hero_revive_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isFreeHeroReviveEnabled) {
      return [0, 0, 0, 0];
    }

    const { experience, tribe } = database.selectObject({
      sql: `
        SELECT h.experience, ti.tribe
        FROM
          heroes h
            JOIN players p ON h.player_id = p.id
            JOIN tribe_ids ti ON p.tribe_id = ti.id
        WHERE
          h.player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        experience: z.number(),
        tribe: playableTribeSchema,
      }),
    })!;

    const { level } = calculateHeroLevel(experience);

    return calculateHeroRevivalCost(tribe, level);
  }

  if (isSettleTroopMovementEvent(event)) {
    // Settling costs 750 of each resource
    return [750, 750, 750, 750];
  }

  return [0, 0, 0, 0];
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const getEventDuration = (
  database: DbFacade,
  event: GameEvent,
): number => {
  if (isBuildingConstructionEvent(event) || isBuildingDestructionEvent(event)) {
    return 0;
  }
  if (isBuildingLevelUpEvent(event) || isScheduledBuildingEvent(event)) {
    const isInstantBuildingConstructionEnabled = database.selectValue({
      sql: 'SELECT is_instant_building_construction_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantBuildingConstructionEnabled) {
      return 0;
    }

    const { villageId, buildingId, level } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'buildingDuration',
        $village_id: villageId,
      },
      schema: apiEffectSchema,
    });

    const { total } = calculateComputedEffect(
      'buildingDuration',
      effects,
      villageId,
    );

    const baseBuildingDuration = calculateBuildingDurationForLevel(
      buildingId,
      level,
    );

    return baseBuildingDuration * total;
  }
  if (isUnitResearchEvent(event)) {
    const isInstantUnitResearchEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_research_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantUnitResearchEnabled) {
      return 0;
    }

    const { villageId, unitId } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'unitResearchDuration',
        $village_id: villageId,
      },
      schema: apiEffectSchema,
    });

    const { total: unitResearchDurationModifier } = calculateComputedEffect(
      'unitResearchDuration',
      effects,
      villageId,
    );

    return unitResearchDurationModifier * calculateUnitResearchDuration(unitId);
  }
  if (isUnitImprovementEvent(event)) {
    const isInstantUnitImprovementEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_improvement_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantUnitImprovementEnabled) {
      return 0;
    }

    const { villageId, unitId, level } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'unitImprovementDuration',
        $village_id: villageId,
      },
      schema: apiEffectSchema,
    });

    const { total: unitImprovementDurationModifier } = calculateComputedEffect(
      'unitImprovementDuration',
      effects,
      villageId,
    );

    return (
      unitImprovementDurationModifier *
      calculateUnitUpgradeDurationForLevel(unitId, level)
    );
  }
  if (isTroopTrainingEvent(event)) {
    const isInstantUnitTrainingEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_training_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantUnitTrainingEnabled) {
      return 0;
    }

    const { unitId, villageId, durationEffectId } = event;

    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: durationEffectId,
        $village_id: villageId,
      },
      schema: apiEffectSchema,
    });

    const { total } = calculateComputedEffect(
      durationEffectId,
      effects,
      villageId,
    );

    const { baseRecruitmentDuration } = getUnitDefinition(unitId);

    return total * baseRecruitmentDuration;
  }
  if (isAdventurePointIncreaseEvent(event)) {
    const { created_at, speed } = database.selectObject({
      sql: 'SELECT created_at, speed FROM servers LIMIT 1;',
      schema: z.strictObject({
        created_at: z.number(),
        speed: speedSchema,
      }),
    })!;

    return calculateAdventurePointIncreaseEventDuration(created_at, speed);
  }

  if (isAdventureTroopMovementEvent(event)) {
    const isInstantUnitTravelEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
      schema: z.number(),
    })!;

    if (isInstantUnitTravelEnabled) {
      return 0;
    }

    return calculateAdventureDuration(database, false);
  }

  if (isReturnTroopMovementEvent(event)) {
    const { originalMovementType, targetId, troops } = event;

    if (originalMovementType === 'adventure') {
      return calculateAdventureDuration(database, true);
    }

    // targetId is the village ID the troops are returning TO
    const { tile_id: targetTileId } = database.selectObject({
      sql: 'SELECT tile_id FROM villages WHERE id = $targetId;',
      bind: { $targetId: targetId },
      schema: z.object({ tile_id: z.number() }),
    })!;

    // troops[0].tileId is where troops are currently located (returning FROM)
    // For oasis returns: troops[0].tileId = oasis tile_id (already handled correctly)
    // For village returns: troops[0].tileId = enemy village tile_id
    const sourceTileId = troops.length > 0 ? troops[0].tileId : targetTileId;

    const sourceCoords = database.selectObject({
      sql: 'SELECT x, y FROM tiles WHERE id = $tileId;',
      bind: { $tileId: sourceTileId },
      schema: z.object({ x: z.number(), y: z.number() }),
    })!;

    const targetCoords = database.selectObject({
      sql: 'SELECT x, y FROM tiles WHERE id = $tileId;',
      bind: { $tileId: targetTileId },
      schema: z.object({ x: z.number(), y: z.number() }),
    })!;

    const distance = calculateDistanceBetweenPoints(sourceCoords, targetCoords);
    const slowestSpeed = Math.min(
      ...troops.map((t) => unitsMap.get(t.unitId)!.unitSpeed),
    );

    const isInstantUnitTravelEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
      schema: z.number(),
    })!;

    if (isInstantUnitTravelEnabled) {
      return 0;
    }

    const { speed: serverSpeed } = database.selectObject({
      sql: 'SELECT speed FROM servers LIMIT 1;',
      schema: z.object({ speed: speedSchema }),
    })!;

    return Math.ceil((distance / (slowestSpeed * serverSpeed)) * 3600 * 1000);
  }
  if (isSettleTroopMovementEvent(event)) {
    const isInstantUnitTravelEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
      schema: z.number(),
    })!;

    if (isInstantUnitTravelEnabled) {
      return 0;
    }

    const { villageId, troops, targetTileId } = event;

    const { tile_id: sourceTileId } = database.selectObject({
      sql: 'SELECT tile_id FROM villages WHERE id = $villageId;',
      bind: { $villageId: villageId },
      schema: z.object({ tile_id: z.number() }),
    })!;

    const sourceCoords = database.selectObject({
      sql: 'SELECT x, y FROM tiles WHERE id = $tileId;',
      bind: { $tileId: sourceTileId },
      schema: z.object({ x: z.number(), y: z.number() }),
    })!;

    const targetCoords = database.selectObject({
      sql: 'SELECT x, y FROM tiles WHERE id = $tileId;',
      bind: { $tileId: targetTileId },
      schema: z.object({ x: z.number(), y: z.number() }),
    })!;

    const distance = calculateDistanceBetweenPoints(sourceCoords, targetCoords);
    const slowestSpeed = Math.min(
      ...troops.map((t) => unitsMap.get(t.unitId)!.unitSpeed),
    );

    const { speed: serverSpeed } = database.selectObject({
      sql: 'SELECT speed FROM servers LIMIT 1;',
      schema: z.object({ speed: speedSchema }),
    })!;

    return Math.ceil((distance / (slowestSpeed * serverSpeed)) * 3600 * 1000);
  }
  if (isTroopMovementEvent(event)) {
    const isInstantUnitTravelEnabled = database.selectValue({
      sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
      schema: z.number(),
    })!;

    if (isInstantUnitTravelEnabled) {
      return 0;
    }

    const { targetId, villageId, troops, type } = event;

    const { tile_id: sourceTileId } = database.selectObject({
      sql: 'SELECT tile_id FROM villages WHERE id = $villageId;',
      bind: { $villageId: villageId },
      schema: z.object({ tile_id: z.number() }),
    })!;

    let targetTileId: number;
    if (
      type === 'troopMovementAttack' ||
      type === 'troopMovementRaid' ||
      type === 'troopMovementReinforcements' ||
      type === 'troopMovementRelocation'
    ) {
      // Check if target is an oasis tile (targetId IS tile_id for oasis targets)
      const isOasisTarget = database.selectValue({
        sql: 'SELECT EXISTS(SELECT 1 FROM oasis WHERE tile_id = $targetId)',
        bind: { $targetId: targetId },
        schema: z.number(),
      });

      if (isOasisTarget) {
        targetTileId = targetId; // For oasis targets, targetId is already the tile_id
      } else {
        const targetVillage = database.selectObject({
          sql: 'SELECT tile_id FROM villages WHERE id = $targetId;',
          bind: { $targetId: targetId },
          schema: z.object({ tile_id: z.number() }),
        });
        targetTileId = targetVillage?.tile_id ?? targetId;
      }
    } else {
      // FindNewVillage, etc. targetId IS the tileId
      targetTileId = targetId;
    }

    const sourceCoords = database.selectObject({
      sql: 'SELECT x, y FROM tiles WHERE id = $tileId;',
      bind: { $tileId: sourceTileId },
      schema: z.object({ x: z.number(), y: z.number() }),
    })!;

    const targetCoords = database.selectObject({
      sql: 'SELECT x, y FROM tiles WHERE id = $tileId;',
      bind: { $tileId: targetTileId },
      schema: z.object({ x: z.number(), y: z.number() }),
    })!;

    const distance = calculateDistanceBetweenPoints(sourceCoords, targetCoords);
    const slowestSpeed = Math.min(
      ...troops.map((t) => unitsMap.get(t.unitId)!.unitSpeed),
    );

    const { speed: serverSpeed } = database.selectObject({
      sql: 'SELECT speed FROM servers LIMIT 1;',
      schema: z.object({ speed: speedSchema }),
    })!;

    return Math.ceil((distance / (slowestSpeed * serverSpeed)) * 3600 * 1000);
  }

  if (isHeroRevivalEvent(event)) {
    const isInstantHeroReviveEnabled = database.selectValue({
      sql: 'SELECT is_instant_hero_revive_enabled FROM developer_settings',
      schema: z.number(),
    });

    if (isInstantHeroReviveEnabled) {
      return 0;
    }

    const { experience, speed } = database.selectObject({
      sql: `
        SELECT h.experience, s.speed
        FROM
          heroes h
            JOIN servers s ON 1 = 1
        WHERE
          h.player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        experience: z.number(),
        speed: speedSchema,
      }),
    })!;
    const { level } = calculateHeroLevel(experience);

    return calculateHeroRevivalTime(level) / speed;
  }

  if (isHeroHealthRegenerationEvent(event)) {
    const { healthRegeneration, speed } = database.selectObject({
      sql: 'SELECT health_regeneration AS healthRegeneration, servers.speed FROM heroes JOIN servers ON 1 = 1 WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.object({
        healthRegeneration: z.number(),
        speed: speedSchema,
      }),
    })!;

    return calculateHealthRegenerationEventDuration(healthRegeneration, speed);
  }

  if (isOasisReleaseEvent(event)) {
    const { speed } = database.selectObject({
      sql: 'SELECT speed FROM servers LIMIT 1;',
      schema: z.object({ speed: speedSchema }),
    })!;

    return Math.ceil((6 * 60 * 60 * 1000) / speed);
  }

  console.error('Missing duration calculation for event', event);
  return 0;
};

// WARNING: `event` does not include `startsAt` and `duration` at this point in the flow!
export const getEventStartTime = (
  database: DbFacade,
  event: GameEvent,
): number => {
  if (isTroopTrainingEvent(event)) {
    const { villageId, buildingId } = event;

    const events = database.selectObjects({
      sql: selectAllVillageEventsByTypeQuery,
      bind: {
        $village_id: villageId,
        $type: 'troopTraining',
      },
      schema: eventSchema,
    }) as GameEvent<'troopTraining'>[];

    const relevantTrainingEvents = events.filter((event) => {
      return event.buildingId === buildingId;
    });

    if (relevantTrainingEvents.length > 0) {
      const lastEvent = relevantTrainingEvents.at(-1)!;
      return lastEvent.startsAt + lastEvent.duration;
    }

    return Date.now();
  }

  if (isUnitImprovementEvent(event)) {
    const { unitId } = event;

    const now = Date.now();

    const lastResolvesAtForThisUnitId = database.selectValue({
      sql: `
        SELECT COALESCE(MAX(resolves_at), $now) AS last_resolves_at
        FROM
          events
        WHERE
          type = 'unitImprovement'
          AND JSON_EXTRACT(meta, '$.unitId') = $unit_id
      `,
      bind: {
        $unit_id: unitId,
        $now: now,
      },
      schema: z.number(),
    })!;

    return lastResolvesAtForThisUnitId;
  }

  if (isScheduledBuildingEvent(event)) {
    const { villageId, buildingFieldId } = event;

    const resolvesAt = database.selectValue({
      sql: `
        WITH
          player_tribe AS (
            SELECT ti.tribe AS tribe
            FROM
              villages v
                JOIN players p ON p.id = v.player_id
                JOIN tribe_ids ti ON p.tribe_id = ti.id
            WHERE
              v.id = $village_id
            )
        SELECT
          COALESCE(
            (
              SELECT MAX(e.resolves_at)
              FROM
                events e,
                player_tribe pt
              WHERE
                e.type = 'buildingLevelChange'
                AND e.village_id = $village_id
                AND (
                  -- If player is not Romans, include all building events
                  pt.tribe <> 'romans'
                    -- If Romans, only include events from the same "half" (<=18 or >18)
                    OR (
                    (CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) <= 18 AND $building_field_id <= 18)
                      OR
                    (CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) > 18 AND $building_field_id > 18)
                    )
                  )
              ),
            $now
          ) AS resolves_at;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
        $now: Date.now(),
      },
      schema: z.number(),
    })!;

    return resolvesAt;
  }

  if (isAdventurePointIncreaseEvent(event)) {
    const { startsAt, duration } = event;

    return startsAt + duration;
  }

  if (isHeroHealthRegenerationEvent(event)) {
    const { startsAt, duration } = event;

    return startsAt + duration;
  }

  if (isBuildingConstructionEvent(event) || isBuildingLevelUpEvent(event)) {
    return Date.now();
  }

  if (isAdventureTroopMovementEvent(event)) {
    return Date.now();
  }
  if (isFindNewVillageTroopMovementEvent(event)) {
    return Date.now();
  }
  if (isSettleTroopMovementEvent(event)) {
    return Date.now();
  }
  if (isReturnTroopMovementEvent(event)) {
    const { startsAt, duration } = event;

    return startsAt + duration;
  }

  return Date.now();
};
