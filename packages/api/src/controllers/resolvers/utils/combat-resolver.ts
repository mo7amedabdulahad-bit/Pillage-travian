import { z } from 'zod';
import {
  calculateLoot,
  calculateTotalCarryCapacity,
  resolveCombat,
} from '@pillage-first/game-assets/combat/combat-engine';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { unitsMap } from '@pillage-first/game-assets/units';
import { calculatePopulationDifference } from '@pillage-first/game-assets/utils/buildings';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type {
  GameEvent,
  ScoutMode,
} from '@pillage-first/types/models/game-event';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { updateOasisResourcesAt } from '../../../utils/oasis';
import {
  addVillageResourcesAt,
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
  updateVillageResourcesAt,
} from '../../../utils/village';
import { createEvents } from '../../utils/create-event';
import {
  fetchDefenderTroops,
  fetchDefenseModifiers,
  getAttackerTroopsWithSmithy,
  updateWallLevel,
} from './combat';
import { onHeroDeath } from './hero';
import { handleNpcRetaliation, regenerateNpcTroops } from './npc';
import { saveCombatReport, saveScoutReports } from './reports';
import { addTroops } from './troops';

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

const getCrannyCapacity = (
  database: DbFacade,
  villageId: number,
  tribe: string,
): { level: number; capacity: number } => {
  const crannyData = database.selectObject({
    sql: `
      SELECT bf.level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      WHERE bf.village_id = $village_id AND bi.building = 'CRANNY'
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({ level: z.number().nullable() }),
  });

  const crannyLevel = crannyData?.level ?? 0;

  const isGaul = tribe.toLowerCase() === 'gaul';
  const multiplier = isGaul ? 1000 : 500;

  return { level: crannyLevel, capacity: crannyLevel * multiplier };
};

const CHIEF_UNITS = new Set([
  'ROMAN_CHIEF',
  'GAUL_CHIEF',
  'TEUTONIC_CHIEF',
  'EGYPTIAN_CHIEF',
  'HUN_CHIEF',
  'SPARTAN_CHIEF',
  'NATARIAN_CHIEF',
]);

const isChiefUnit = (unitId: string): boolean => {
  return CHIEF_UNITS.has(unitId);
};

const CHIEF_LOYALTY_RANGES: Record<string, [number, number]> = {
  ROMAN_CHIEF: [20, 30],
  TEUTONIC_CHIEF: [20, 25],
  GAUL_CHIEF: [20, 25],
  EGYPTIAN_CHIEF: [20, 25],
  HUN_CHIEF: [15, 30],
  SPARTAN_CHIEF: [20, 25],
  NATARIAN_CHIEF: [20, 25],
};

/**
 * Calculates total loyalty reduction for a group of surviving chiefs.
 * The random factor is rolled once per chief type and applied to all units
 * of that type.
 */
const _calculateChiefLoyaltyReduction = (
  troops: { unitId: string; amount: number }[],
): number => {
  let totalReduction = 0;

  for (const troop of troops) {
    if (!isChiefUnit(troop.unitId)) {
      continue;
    }

    const range = CHIEF_LOYALTY_RANGES[troop.unitId] ?? [20, 25];
    const [min, max] = range;

    // Roll once per chief type, apply to all units of that type
    const roll = Math.floor(Math.random() * (max - min + 1)) + min;
    totalReduction += roll * troop.amount;
  }

  return totalReduction;
};

/**
 * Reads the current loyalty for a village, accounting for passive regeneration
 * since the last update.
 *
 * Regeneration rate: 2 loyalty points per 3 hours per level of the
 * Residence/Command Center building.
 */
const _calculateCurrentLoyalty = (
  database: DbFacade,
  villageId: number,
  now: number,
): number => {
  const row = database.selectObject({
    sql: `
      SELECT
        v.loyalty,
        v.loyalty_updated_at,
        MAX(bf.level) AS adminBuildingLevel
      FROM villages v
      LEFT JOIN building_fields bf ON bf.village_id = v.id
      LEFT JOIN building_ids bi ON bi.id = bf.building_id
        AND bi.building IN ('RESIDENCE', 'COMMAND_CENTER')
        AND bf.level > 0
      WHERE v.id = $village_id
      GROUP BY v.id
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      loyalty: z.number(),
      loyalty_updated_at: z.number().nullable(),
      adminBuildingLevel: z.number().nullable(),
    }),
  });

  if (!row) {
    return 100;
  }

  const adminLevel = row.adminBuildingLevel ?? 0;

  if (adminLevel === 0 || row.loyalty_updated_at === null) {
    return row.loyalty;
  }

  // 2 loyalty per 3 hours per level = (2/3) * level per hour
  const elapsedHours =
    Math.max(0, now - row.loyalty_updated_at) / (1000 * 3600);
  const regen = Math.floor((2 / 3) * adminLevel * elapsedHours);
  return Math.min(100, row.loyalty + regen);
};

/**
 * Reduces village loyalty by the given amount, accounting for any passive
 * regeneration since the last update. Writes the new loyalty and timestamp
 * back to the DB.
 */
const _updateVillageLoyalty = (
  database: DbFacade,
  villageId: number,
  loyaltyReduction: number,
  now: number,
): number => {
  const currentLoyalty = _calculateCurrentLoyalty(database, villageId, now);
  const newLoyalty = Math.max(0, currentLoyalty - loyaltyReduction);

  database.exec({
    sql: 'UPDATE villages SET loyalty = $loyalty, loyalty_updated_at = $now WHERE id = $village_id',
    bind: { $loyalty: newLoyalty, $village_id: villageId, $now: now },
  });

  return newLoyalty;
};

const _transferVillageOwnership = (
  database: DbFacade,
  villageId: number,
  newPlayerId: number,
  resolvesAt: number,
): void => {
  // 1. Transfer ownership, reset loyalty, and generate slug if missing
  // NOTE: tribe_id is NOT changed — the village keeps its original tribe

  // Debug: check tribe_id before conquest
  const preConquestTribe = database.selectValue({
    sql: 'SELECT tribe_id FROM villages WHERE id = $village_id',
    bind: { $village_id: villageId },
    schema: z.number().nullable(),
  });
  console.error(
    `[Chief] Pre-conquest tribe_id for village ${villageId}:`,
    preConquestTribe,
  );

  database.exec({
    sql: `UPDATE villages
          SET player_id = $player_id,
              loyalty = 100,
              loyalty_updated_at = $now,
              slug = CASE WHEN slug IS NULL OR slug = '' THEN 'v-' || id ELSE slug END
          WHERE id = $village_id`,
    bind: {
      $player_id: newPlayerId,
      $village_id: villageId,
      $now: resolvesAt,
    },
  });

  // Verify the slug was set
  const newSlug = database.selectValue({
    sql: 'SELECT slug FROM villages WHERE id = $village_id',
    bind: { $village_id: villageId },
    schema: z.string().nullable(),
  });
  console.error(`[Chief] Conquered village ${villageId} slug: "${newSlug}"`);

  // 2. Delete old NPC reports for this village so they don't appear in player's inbox
  database.exec({
    sql: 'DELETE FROM reports WHERE village_id = $village_id',
    bind: { $village_id: villageId },
  });

  // 3. Get village tile_id for troop operations
  const tileId = database.selectValue({
    sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
    bind: { $village_id: villageId },
    schema: z.number(),
  })!;

  // 3. Reset wall to level 0 (all wall types)
  database.exec({
    sql: `
      UPDATE building_fields
      SET level = 0
      WHERE village_id = $village_id
        AND building_id IN (
          SELECT id FROM building_ids
          WHERE building IN (
            'ROMAN_WALL', 'GAUL_WALL', 'TEUTONIC_WALL',
            'EGYPTIAN_WALL', 'HUN_WALL', 'SPARTAN_WALL',
            'NATAR_WALL', 'NATURE_WALL'
          )
        )
    `,
    bind: { $village_id: villageId },
  });

  // 4. Clear academy research for this village
  database.exec({
    sql: 'DELETE FROM unit_research WHERE village_id = $village_id',
    bind: { $village_id: villageId },
  });

  // 5. Smithy upgrades (unit_improvements) are per-player, not per-village.
  //    The attacker keeps their upgrades and they apply to the conquered village.
  //    The old owner's upgrades remain for their other villages (if any).

  // 6. Remove all defending troops from the village tile
  database.exec({
    sql: 'DELETE FROM troops WHERE tile_id = $tile_id',
    bind: { $tile_id: tileId },
  });

  // 7. Cancel training queues and refund 50% resources
  const trainingEvents = database.selectObjects({
    sql: `
      SELECT id, meta FROM events
      WHERE village_id = $village_id
        AND type = 'troopTraining'
        AND resolves_at > $now
    `,
    bind: { $village_id: villageId, $now: resolvesAt },
    schema: z.strictObject({ id: z.number(), meta: z.string() }),
  });

  let totalRefund = [0, 0, 0, 0];
  for (const event of trainingEvents) {
    try {
      const meta = JSON.parse(event.meta) as {
        unitId: string;
        amount: number;
        buildingId: string;
      };
      const { baseRecruitmentCost } = getUnitDefinition(meta.unitId as UnitId);
      const costModifier =
        meta.buildingId === 'GREAT_BARRACKS' ||
        meta.buildingId === 'GREAT_STABLE'
          ? 3
          : 1;
      const fullCost = baseRecruitmentCost.map(
        (c) => c * costModifier * meta.amount,
      );
      // Refund 50%
      totalRefund = totalRefund.map(
        (total, i) => total + Math.floor(fullCost[i] * 0.5),
      );
    } catch {
      // If meta parsing fails, skip refund for this event
    }
  }

  // Delete all training events
  database.exec({
    sql: `DELETE FROM events WHERE village_id = $village_id AND type = 'troopTraining' AND resolves_at > $now`,
    bind: { $village_id: villageId, $now: resolvesAt },
  });

  // Delete other village-owned pending events, but preserve return/reinforcement
  // movements that may belong to attackers returning from this village
  database.exec({
    sql: `DELETE FROM events WHERE village_id = $village_id AND resolves_at > $now
          AND type NOT IN ('troopMovementReturn', 'troopMovementReinforcements')`,
    bind: { $village_id: villageId, $now: resolvesAt },
  });

  // Apply 50% refund to the village
  if (totalRefund.some((v) => v > 0)) {
    addVillageResourcesAt(database, villageId, resolvesAt, totalRefund);
  }

  // 8. Release all connected oases (effects + oasis ownership)
  database.exec({
    sql: `
      DELETE FROM effects
      WHERE source = 'oasis' AND village_id = $village_id
    `,
    bind: { $village_id: villageId },
  });
  database.exec({
    sql: `
      UPDATE oasis
      SET village_id = NULL, loyalty = 100, loyalty_updated_at = $now
      WHERE village_id = $village_id
    `,
    bind: { $village_id: villageId, $now: resolvesAt },
  });

  // 9. DO NOT change the village tribe_id — tribe is kept after conquest.
  // DO NOT remove tribe-specific buildings — same-tribe rule always applies
  // since tribe is preserved.
};

const _hasPalaceOrResidence = (
  database: DbFacade,
  villageId: number,
): { exists: boolean; buildingName: string | null; level: number } => {
  const result = database.selectObject({
    sql: `
      SELECT bi.building AS buildingName, bf.level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      WHERE bf.village_id = $village_id
        AND bi.building IN ('RESIDENCE', 'COMMAND_CENTER')
        AND bf.level > 0
      ORDER BY bf.level DESC
      LIMIT 1
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      buildingName: z.string(),
      level: z.number(),
    }),
  });
  if (!result) {
    return { exists: false, buildingName: null, level: 0 };
  }
  return {
    exists: true,
    buildingName: result.buildingName,
    level: result.level,
  };
};

// ─── Catapult constants ───
const TRIBE_CATAPULT: Record<string, string> = {
  roman: 'ROMAN_CATAPULT',
  gaul: 'GAUL_CATAPULT',
  teuton: 'TEUTONIC_CATAPULT',
  egyptian: 'EGYPTIAN_CATAPULT',
  hun: 'HUN_CATAPULT',
  spartan: 'SPARTAN_CATAPULT',
};

const CATAPULT_UNIT_IDS = new Set(Object.values(TRIBE_CATAPULT));

const ALWAYS_EXCLUDED_FROM_SPECIFIC = new Set([
  'CRANNY',
  'STONEMASONS_LODGE',
  'TRAPPER',
]);

/**
 * Calculate total village population = sum of all building field levels.
 */
const _calculateVillagePopulation = (
  database: DbFacade,
  villageId: number,
): number => {
  const result = database.selectValue({
    sql: 'SELECT COALESCE(SUM(level), 0) FROM building_fields WHERE village_id = $village_id',
    bind: { $village_id: villageId },
    schema: z.number(),
  });
  return result ?? 0;
};

/**
 * Destroy a village completely — used when all buildings are reduced to 0.
 * Only allowed for NPC villages (not the player's last village).
 */
const _destroyVillage = (
  database: DbFacade,
  villageId: number,
  resolvesAt: number,
): void => {
  // 1. Release connected oases
  database.exec({
    sql: `UPDATE oasis SET village_id = NULL, loyalty = 100, loyalty_updated_at = $now
          WHERE village_id = $village_id`,
    bind: { $village_id: villageId, $now: resolvesAt },
  });
  database.exec({
    sql: `DELETE FROM effects WHERE source = 'oasis' AND village_id = $village_id`,
    bind: { $village_id: villageId },
  });

  // 2. Remove all effects for the village
  database.exec({
    sql: 'DELETE FROM effects WHERE village_id = $village_id',
    bind: { $village_id: villageId },
  });

  // 3. Delete all troops at this village's tile
  const tileId = database.selectValue({
    sql: 'SELECT tile_id FROM villages WHERE id = $village_id',
    bind: { $village_id: villageId },
    schema: z.number(),
  })!;
  database.exec({
    sql: 'DELETE FROM troops WHERE tile_id = $tile_id',
    bind: { $tile_id: tileId },
  });

  // 4. Cancel all pending events for this village
  database.exec({
    sql: 'DELETE FROM events WHERE village_id = $village_id AND resolves_at > $now',
    bind: { $village_id: villageId, $now: resolvesAt },
  });

  // 5. Delete building fields
  database.exec({
    sql: 'DELETE FROM building_fields WHERE village_id = $village_id',
    bind: { $village_id: villageId },
  });

  // 6. Delete resource sites
  database.exec({
    sql: 'DELETE FROM resource_sites WHERE tile_id = $tile_id',
    bind: { $tile_id: tileId },
  });

  // 7. Delete the village record itself
  database.exec({
    sql: 'DELETE FROM villages WHERE id = $village_id',
    bind: { $village_id: villageId },
  });

  // 8. Mark the tile as empty
  database.exec({
    sql: `UPDATE tiles SET type = 'empty' WHERE id = $tile_id`,
    bind: { $tile_id: tileId },
  });
};

type CatapultDamageResult = {
  target1: string;
  levelsDestroyed1: number;
  target1Destroyed?: boolean;
  target1IsRandom?: boolean;
  target2?: string;
  levelsDestroyed2?: number;
  target2Destroyed?: boolean;
  target2IsRandom?: boolean;
  villageDestroyed?: boolean;
  target1RequestedName?: string;
  target1WasFallback?: boolean;
  target2RequestedName?: string;
  target2WasFallback?: boolean;
};

// Buildings excluded from ALL catapult targeting (specific and random)
const CATAPULT_EXCLUDED_BUILDINGS = new Set([
  ...ALWAYS_EXCLUDED_FROM_SPECIFIC,
  'ROMAN_WALL',
  'GAUL_WALL',
  'TEUTONIC_WALL',
  'EGYPTIAN_WALL',
  'HUN_WALL',
  'SPARTAN_WALL',
  'NATAR_WALL',
  'NATURE_WALL',
]);

/**
 * Resolve catapult building damage for a normal attack.
 */
const resolveCatapultDamage = (
  database: DbFacade,
  villageId: number,
  targetVillageId: number,
  catapultTarget1: string | undefined,
  catapultTarget2: string | undefined,
  survivingCatapults: number,
  resolvesAt: number,
): CatapultDamageResult => {
  // 1. Get attacker's Rally Point level
  const rpLevel =
    database.selectValue({
      sql: `
        SELECT COALESCE(bf.level, 0)
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id AND bi.building = 'RALLY_POINT'
      `,
      bind: { $village_id: villageId },
      schema: z.number(),
    }) ?? 1;

  // 2. Get attacker tribe and catapult smithy upgrade level
  const attackerTribe = database.selectValue({
    sql: `SELECT COALESCE(vt.tribe, pt.tribe)
          FROM villages v
          LEFT JOIN tribe_ids vt ON vt.id = v.tribe_id
          LEFT JOIN players p ON v.player_id = p.id
          LEFT JOIN tribe_ids pt ON pt.id = p.tribe_id
          WHERE v.id = $village_id`,
    bind: { $village_id: villageId },
    schema: z.string(),
  });

  const catapultUnitId = attackerTribe
    ? TRIBE_CATAPULT[attackerTribe.toLowerCase()]
    : undefined;

  const smithyLevel = catapultUnitId
    ? (database.selectValue({
        sql: `SELECT COALESCE(level, 0) FROM unit_improvements
              WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id)
                AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)`,
        bind: { $village_id: villageId, $unit_id: catapultUnitId },
        schema: z.number(),
      }) ?? 0)
    : 0;

  // 3. Get all buildings in the target village
  const allBuildings = database.selectObjects({
    sql: `
      SELECT bi.building, bf.field_id AS fieldId, bf.level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      WHERE bf.village_id = $village_id AND bf.level > 0
      ORDER BY bf.level DESC
    `,
    bind: { $village_id: targetVillageId },
    schema: z.strictObject({
      building: z.string(),
      fieldId: z.number(),
      level: z.number(),
    }),
  });

  if (allBuildings.length === 0) {
    return { target1: 'none', levelsDestroyed1: 0 };
  }

  // Build random pool: exclude walls, excluded buildings, stonemason goes last
  const STONEMASON = 'STONEMASONS_LODGE';
  const validBuildings = allBuildings.filter(
    (b) => !CATAPULT_EXCLUDED_BUILDINGS.has(b.building),
  );
  const normalBuildings = validBuildings.filter(
    (b) => b.building !== STONEMASON,
  );
  const stonemason = validBuildings.find((b) => b.building === STONEMASON);
  const randomPool = stonemason
    ? [...normalBuildings, stonemason]
    : normalBuildings;

  const resolveTarget = (
    targetSpec: string | undefined,
  ): {
    building: string;
    fieldId: number;
    level: number;
    wasFallback: boolean;
    requestedName: string;
  } | null => {
    if (!targetSpec || targetSpec === 'random') {
      if (randomPool.length === 0) {
        return null;
      }
      const idx = Math.floor(Math.random() * randomPool.length);
      return {
        ...randomPool[idx],
        wasFallback: false,
        requestedName: 'random',
      };
    }

    // Specific target: validate it's not excluded (walls, cranny, trapper, stonemason)
    if (CATAPULT_EXCLUDED_BUILDINGS.has(targetSpec)) {
      if (randomPool.length === 0) {
        return null;
      }
      const idx = Math.floor(Math.random() * randomPool.length);
      return {
        ...randomPool[idx],
        wasFallback: true,
        requestedName: targetSpec,
      };
    }

    // Find the highest-level instance of the target building
    const target = allBuildings.find((b) => b.building === targetSpec);
    if (!target) {
      if (randomPool.length === 0) {
        return null;
      }
      const idx = Math.floor(Math.random() * randomPool.length);
      return {
        ...randomPool[idx],
        wasFallback: true,
        requestedName: targetSpec,
      };
    }

    return { ...target, wasFallback: false, requestedName: targetSpec };
  };

  // 4. Calculate shots per level
  const calcDamage = (
    target: {
      building: string;
      fieldId: number;
      level: number;
      wasFallback: boolean;
      requestedName: string;
    } | null,
    cats: number,
  ): {
    target: string;
    fieldId: number;
    levelsDestroyed: number;
    wasFallback: boolean;
    requestedName: string;
  } | null => {
    if (!target || cats <= 0) {
      return null;
    }
    const shotsPerLevel = Math.ceil(
      (target.level * 2) / (1 + smithyLevel * 0.05),
    );
    const levelsDestroyed =
      shotsPerLevel > 0 ? Math.floor(cats / shotsPerLevel) : 0;
    return {
      target: target.building,
      fieldId: target.fieldId,
      levelsDestroyed: Math.min(levelsDestroyed, target.level),
      wasFallback: target.wasFallback,
      requestedName: target.requestedName,
    };
  };

  // 5. Split catapults for double target (RP >= 20)
  const useDoubleTarget =
    rpLevel >= 20 && survivingCatapults >= 20 && catapultTarget2 != null;
  const cats1 = useDoubleTarget
    ? Math.floor(survivingCatapults / 2)
    : survivingCatapults;
  const cats2 = useDoubleTarget ? survivingCatapults - cats1 : 0;

  const target1Data = resolveTarget(catapultTarget1);
  const target2Data = useDoubleTarget ? resolveTarget(catapultTarget2) : null;

  const damage1 = calcDamage(target1Data, cats1);

  // If target2 points to the same building as target1, re-fetch the level after damage1
  if (
    target2Data &&
    target1Data &&
    target1Data.fieldId === target2Data.fieldId &&
    damage1 &&
    damage1.levelsDestroyed > 0
  ) {
    const updatedLevel =
      database.selectValue({
        sql: 'SELECT level FROM building_fields WHERE village_id = $village_id AND field_id = $field_id',
        bind: { $village_id: targetVillageId, $field_id: target2Data.fieldId },
        schema: z.number(),
      }) ?? 0;
    target2Data.level = updatedLevel;
  }

  const damage2 = useDoubleTarget ? calcDamage(target2Data, cats2) : null;

  // 6. Apply damage to DB and update population effect
  let totalPopulationLost = 0;

  if (damage1 && damage1.levelsDestroyed > 0) {
    database.exec({
      sql: 'UPDATE building_fields SET level = MAX(0, level - $dmg) WHERE village_id = $village_id AND field_id = $field_id',
      bind: {
        $dmg: damage1.levelsDestroyed,
        $field_id: damage1.fieldId,
        $village_id: targetVillageId,
      },
    });

    // Update population effect to match the damaged building levels
    if (target1Data) {
      const oldLevel = target1Data.level;
      const newLevel = Math.max(0, oldLevel - damage1.levelsDestroyed);
      totalPopulationLost += calculatePopulationDifference(
        damage1.target as any,
        oldLevel,
        newLevel,
      );
    }
  }

  // Re-fetch level for damage2 if same building as damage1
  if (
    damage2 &&
    damage1 &&
    target1Data &&
    target2Data &&
    target1Data.fieldId === target2Data.fieldId
  ) {
    const afterDamage1Level =
      database.selectValue({
        sql: 'SELECT level FROM building_fields WHERE village_id = $village_id AND field_id = $field_id',
        bind: { $village_id: targetVillageId, $field_id: damage2.fieldId },
        schema: z.number(),
      }) ?? 0;
    // Cap damage2 to remaining levels
    damage2.levelsDestroyed = Math.min(
      damage2.levelsDestroyed,
      afterDamage1Level,
    );
  }

  if (damage2 && damage2.levelsDestroyed > 0) {
    database.exec({
      sql: 'UPDATE building_fields SET level = MAX(0, level - $dmg) WHERE village_id = $village_id AND field_id = $field_id',
      bind: {
        $dmg: damage2.levelsDestroyed,
        $field_id: damage2.fieldId,
        $village_id: targetVillageId,
      },
    });

    if (target2Data) {
      const oldLevel = target2Data.level;
      const newLevel = Math.max(0, oldLevel - damage2.levelsDestroyed);
      totalPopulationLost += calculatePopulationDifference(
        damage2.target as any,
        oldLevel,
        newLevel,
      );
    }
  }

  // Update the base population effect so the UI shows correct population
  if (totalPopulationLost > 0) {
    database.exec({
      sql: `UPDATE effects SET value = value - ($value)
            WHERE effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction')
              AND type = 'base' AND scope = 'village' AND source = 'building'
              AND village_id = $village_id AND source_specifier = 0`,
      bind: { $value: totalPopulationLost, $village_id: targetVillageId },
    });
  }

  // 7. Recalculate population after damage
  const population = _calculateVillagePopulation(database, targetVillageId);
  let villageDestroyed = false;
  if (population === 0) {
    // Only destroy NPC villages, not player's villages
    const isPlayerVillage = database.selectValue({
      sql: 'SELECT EXISTS(SELECT 1 FROM villages WHERE id = $village_id AND player_id = 1)',
      bind: { $village_id: targetVillageId },
      schema: z.number(),
    });
    if (!isPlayerVillage) {
      _destroyVillage(database, targetVillageId, resolvesAt);
      villageDestroyed = true;
    }
  }

  return {
    target1: damage1?.target ?? 'none',
    levelsDestroyed1: damage1?.levelsDestroyed ?? 0,
    target1Destroyed: damage1
      ? (target1Data?.level ?? 0) - damage1.levelsDestroyed <= 0
      : undefined,
    target1IsRandom: damage1?.requestedName === 'random',
    ...(damage1
      ? {
          target1RequestedName: damage1.requestedName,
          target1WasFallback: damage1.wasFallback,
        }
      : {}),
    ...(damage2
      ? {
          target2: damage2.target,
          levelsDestroyed2: damage2.levelsDestroyed,
          target2Destroyed: target2Data
            ? target2Data.level - damage2.levelsDestroyed <= 0
            : undefined,
          target2IsRandom: damage2.requestedName === 'random',
          target2RequestedName: damage2.requestedName,
          target2WasFallback: damage2.wasFallback,
        }
      : {}),
    villageDestroyed,
  };
};

type ScoutMovementArgs = {
  villageId: number;
  targetId: number;
  resolvesAt: number;
  troops: { unitId: string; amount: number }[];
  scoutMode: ScoutMode;
  isRaid: boolean;
};

const resolveScoutMovement = (
  database: DbFacade,
  args: ScoutMovementArgs,
): void => {
  const {
    villageId,
    targetId,
    resolvesAt,
    troops: attackerTroops,
    scoutMode,
  } = args;

  const attackerVillage = database.selectObject({
    sql: `
      SELECT
        v.name as villageName,
        p.id as playerId,
        p.name as playerName,
        p.faction_id as factionId,
        COALESCE(vt.tribe, pt.tribe) as tribe
      FROM villages v
      JOIN players p ON v.player_id = p.id
      LEFT JOIN tribe_ids vt ON vt.id = v.tribe_id
      LEFT JOIN tribe_ids pt ON pt.id = p.tribe_id
      WHERE v.id = $id
    `,
    bind: { $id: villageId },
    schema: z.object({
      villageName: z.string(),
      playerId: z.number(),
      playerName: z.string(),
      factionId: z.number(),
      tribe: z.string(),
    }),
  })!;

  const defenderVillage = database.selectObject({
    sql: `
      SELECT v.tile_id AS tileId, v.name AS villageName, p.name AS playerName, p.faction_id AS factionId, COALESCE(vt.tribe, pt.tribe) as tribe
      FROM villages v
      JOIN players p ON p.id = v.player_id
      LEFT JOIN tribe_ids vt ON vt.id = v.tribe_id
      LEFT JOIN tribe_ids pt ON pt.id = p.tribe_id
      WHERE v.id = $targetVillageId
    `,
    bind: { $targetVillageId: targetId },
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

  const attackerStrength = calculateScoutStrength(attackerTroops, 'attack');
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

  const attackerOutcome = applyScoutLosses(
    attackerTroops,
    attackerCasualtyPercent,
  );
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

  updateVillageResourcesAt(database, targetId, resolvesAt);
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

  const crannyData = getCrannyCapacity(
    database,
    targetId,
    defenderVillage.tribe,
  );

  const wallAndPalace = database.selectObjects({
    sql: `
      SELECT b.building AS buildingId, bf.level
      FROM building_fields bf
      JOIN building_ids b ON b.id = bf.building_id
      WHERE bf.village_id = $targetVillageId
        AND b.building IN (
          'ROMAN_WALL', 'GAUL_WALL', 'TEUTONIC_WALL', 'EGYPTIAN_WALL', 'HUN_WALL', 'SPARTAN_WALL', 'NATAR_WALL', 'NATURE_WALL',
          'RESIDENCE', 'COMMAND_CENTER'
        )
    `,
    bind: { $targetVillageId: targetId },
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

  const canSeeResources = scoutMode === 'resource';
  const canSeeDefences = scoutMode === 'defence';

  const reportResources =
    canSeeResources && defenderResources && crannyData.capacity >= 0
      ? ([
          Math.max(0, defenderResources.wood - crannyData.capacity),
          Math.max(0, defenderResources.clay - crannyData.capacity),
          Math.max(0, defenderResources.iron - crannyData.capacity),
          Math.max(0, defenderResources.wheat - crannyData.capacity),
        ] as [number, number, number, number])
      : undefined;

  // Always show troops if scout succeeds (for both resource and defence modes)
  const reportTroops =
    attackerWins && attackerOutcome.survivors.length > 0
      ? defenderTroops.map(({ unitId, amount }) => ({ unitId, amount }))
      : undefined;

  saveScoutReports(
    database,
    {
      attackerVillageName: attackerVillage.villageName,
      defenderVillageName: defenderVillage.villageName,
      attackerPlayerName: attackerVillage.playerName,
      defenderPlayerName: defenderVillage.playerName,
      attackerTribe: attackerVillage.tribe,
      defenderTribe: defenderVillage.tribe,
      attackerScouts: attackerTroops.map(({ unitId, amount }) => ({
        unitId,
        amount,
      })),
      defenderScouts: defenderScouts.map(({ unitId, amount }) => ({
        unitId,
        amount,
      })),
      attackerLosses: attackerOutcome.losses,
      defenderLosses: defenderOutcome.losses,
      attackerSurvivors: attackerOutcome.survivors,
      defenderSurvivors: defenderOutcome.survivors,
      wasDetected: defenderScouts.length > 0,
      scoutMode,
      resources: reportResources,
      crannyCapacity: canSeeResources ? crannyData.capacity : undefined,
      wallLevel: canSeeDefences ? wallLevel : undefined,
      palaceLevel: canSeeDefences ? palaceLevel : undefined,
      troops: reportTroops,
    },
    villageId,
    targetId,
    resolvesAt,
    attackerVillage.factionId,
    defenderVillage.factionId,
  );

  if (attackerOutcome.survivors.length > 0) {
    const sourceTileId = database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
      bind: { $villageId: villageId },
      schema: z.number(),
    })!;

    createEvents<'troopMovementReturn'>(database, {
      villageId: villageId,
      targetId: villageId,
      startsAt: resolvesAt,
      troops: attackerOutcome.survivors.map(({ unitId, amount }) => ({
        unitId: unitId as UnitId,
        amount,
        tileId: defenderVillage.tileId,
        source: sourceTileId,
      })),
      type: 'troopMovementReturn',
      originalMovementType: args.isRaid ? 'raid' : 'attack',
    });
  }
};

/**
 * Single entry point for oasis combat — do not duplicate this logic.
 * Handles both attack and raid on oasis targets.
 *
 * ATTACK: Full battle to the death. Loyalty reduced ONLY if:
 *   1. All defenders killed
 *   2. Hero was sent AND survived
 *   3. Free oasis slot exists in Hero's Mansion
 *   Occupation happens when loyalty reaches 0.
 *
 * RAID: Hit-and-run. Only fights defenders encountered, loots resources,
 *   never reduces loyalty, never occupies.
 *
 * LOOT: Both raids and attacks can steal resources from the oasis.
 *   Steals up to 50% of available resources, capped by carry capacity.
 */
const resolveOasisCombat = (
  database: DbFacade,
  villageId: number,
  oasisTileId: number,
  resolvesAt: number,
  attackerTroopsRaw: {
    unitId: string;
    amount: number;
    tileId: number;
    source: number;
  }[],
  isRaid: boolean,
): void => {
  // ─── 1. Fetch oasis and attacker data ───
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
    bind: { $tile_id: oasisTileId },
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

  // ─── 2. Get defender troops (nature animals) ───
  const defenderTroopsRaw = database.selectObjects({
    sql: `
      SELECT u.unit AS unitId, t.amount
      FROM troops t
      JOIN unit_ids u ON t.unit_id = u.id
      WHERE t.tile_id = $tile_id AND t.amount > 0;
    `,
    bind: { $tile_id: oasisTileId },
    schema: z.strictObject({
      unitId: z.string(),
      amount: z.number(),
    }),
  });

  const defenderTroops = defenderTroopsRaw.map((t) => ({
    unitId: t.unitId as UnitId,
    amount: t.amount,
    smithyLevel: 0,
  }));

  // ─── 3. Resolve combat ───
  const result = resolveCombat(
    attackerTroops,
    defenderTroops,
    { wallType: null, wallLevel: 0, wallDurability: 0, palaceLevel: 0 },
    [0, 0, 0, 0],
    isRaid,
  );

  const attackerHeroDied =
    heroInTroops &&
    !result.attackerSurvivors.some(({ unitId }) => unitId === 'HERO');

  if (attackerHeroDied) {
    database.exec({
      sql: 'UPDATE heroes SET health = 0 WHERE player_id = (SELECT player_id FROM villages WHERE id = $villageId);',
      bind: { $villageId: villageId },
    });
    onHeroDeath(database, resolvesAt);
  }

  // ─── 4. Update defender troops (replace with survivors) ───
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
        unitId: def.unitId as UnitId,
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

  // ─── 5. Calculate loot (both raids and attacks) ───
  // Oases don't have villages, so we query resource_sites directly by tile_id
  let loot: [number, number, number, number] = [0, 0, 0, 0];

  if (result.attackerSurvivors.length > 0) {
    // Update oasis resources to current time before looting
    updateOasisResourcesAt(database, oasisTileId, resolvesAt);

    // Fetch current oasis resources directly from resource_sites
    const oasisResources = database.selectObject({
      sql: `
        SELECT wood, clay, iron, wheat
        FROM resource_sites
        WHERE tile_id = $tileId
      `,
      bind: { $tileId: oasisTileId },
      schema: z.strictObject({
        wood: z.number(),
        clay: z.number(),
        iron: z.number(),
        wheat: z.number(),
      }),
    });

    if (oasisResources) {
      // Steal up to 50% of each resource
      const availableLoot: [number, number, number, number] = [
        Math.floor(oasisResources.wood * 0.5),
        Math.floor(oasisResources.clay * 0.5),
        Math.floor(oasisResources.iron * 0.5),
        Math.floor(oasisResources.wheat * 0.5),
      ];

      // Calculate carry capacity of surviving troops
      const carryCapacity = calculateTotalCarryCapacity(
        result.attackerSurvivors.map((s) => ({
          unitId: s.unitId as UnitId,
          amount: s.amount,
        })),
      );

      // Calculate actual loot capped by carry capacity
      loot = calculateLoot(availableLoot, carryCapacity);

      // Subtract looted resources directly from oasis resource_sites
      const totalLooted = loot.reduce((sum, v) => sum + v, 0);
      if (totalLooted > 0) {
        database.exec({
          sql: `
            UPDATE resource_sites
            SET wood = wood - $wood,
                clay = clay - $clay,
                iron = iron - $iron,
                wheat = wheat - $wheat,
                updated_at = $timestamp
            WHERE tile_id = $tileId
          `,
          bind: {
            $tileId: oasisTileId,
            $wood: loot[0],
            $clay: loot[1],
            $iron: loot[2],
            $wheat: loot[3],
            $timestamp: resolvesAt,
          },
        });
      }
    }
  }

  // ─── 6. Send survivors home with loot ───
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
      originalMovementType: isRaid ? 'raid' : 'attack',
      loot,
    });
  }

  // ─── 7. Check if attacker already owns this oasis ───
  // Player cannot reduce loyalty of their own oasis
  const attackerOwnsOasis = oasisData.ownerVillageId === villageId;

  // ─── 8. Calculate oasis slot availability ───
  const occupiedOases =
    database.selectValue({
      sql: 'SELECT COUNT(DISTINCT tile_id) FROM oasis WHERE village_id = $village_id',
      bind: { $village_id: villageId },
      schema: z.number(),
    }) ?? 0;

  const maxOasisSlots =
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

  const freeOasisSlotsAvailable = maxOasisSlots - occupiedOases;

  // ─── 9. Loyalty reduction: ONLY for attacks with hero, all defenders dead, free slot, NOT own oasis ───
  let loyaltyDecrease: number | undefined;
  let newLoyalty: number | undefined;
  const attackerWon = totalDefenderRemaining === 0;

  // Player cannot reduce loyalty of their own oasis
  const canReduceLoyalty =
    !isRaid &&
    heroAlive &&
    attackerWon &&
    freeOasisSlotsAvailable > 0 &&
    !attackerOwnsOasis;

  if (canReduceLoyalty) {
    const isNpcOwned = oasisData.npcPlayerId !== null;
    loyaltyDecrease = 20; // default for unowned oasis

    if (isNpcOwned) {
      const npcOasisCount =
        database.selectValue({
          sql: 'SELECT COUNT(DISTINCT o.tile_id) FROM oasis o JOIN villages v ON o.village_id = v.id WHERE v.player_id = $npcPlayerId',
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
      sql: 'UPDATE oasis SET loyalty = $loyalty, loyalty_updated_at = $now WHERE tile_id = $tile_id',
      bind: { $loyalty: newLoyalty, $now: resolvesAt, $tile_id: oasisTileId },
    });
  }

  // ─── 9. Save combat report ───
  const totalLooted = loot.reduce((sum, v) => sum + v, 0);
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
    isRaid,
    // Use loot array if resources were stolen, otherwise use combat engine's result
    loot: totalLooted > 0 ? loot : undefined,
    oasisLoyaltyDecrease: loyaltyDecrease,
    oasisLoyaltyCurrent: newLoyalty,
  };

  saveCombatReport(
    database,
    reportData,
    villageId,
    oasisTileId,
    resolvesAt,
    attackerVillage.factionId,
    null,
  );

  // ─── 10. Occupation: only if attack, hero alive, all defenders dead, loyalty = 0, free slot ───
  if (!canReduceLoyalty || newLoyalty! > 0) {
    return;
  }

  // At this point: attack, hero alive, all defenders dead, loyalty = 0, free slot available
  // Remove old owner's effects if any
  if (oasisData.ownerVillageId) {
    database.exec({
      sql: 'DELETE FROM effects WHERE source = $source AND village_id = $village_id AND source_specifier = $source_specifier',
      bind: {
        $source: 'oasis',
        $village_id: oasisData.ownerVillageId,
        $source_specifier: oasisTileId,
      },
    });
  }

  // Assign oasis to attacker
  database.exec({
    sql: 'UPDATE oasis SET village_id = $village_id, loyalty = 100, loyalty_updated_at = $now WHERE tile_id = $tile_id',
    bind: { $village_id: villageId, $now: resolvesAt, $tile_id: oasisTileId },
  });

  // Add production bonuses
  const oasisBonuses = database.selectObjects({
    sql: 'SELECT resource, bonus FROM oasis WHERE tile_id = $tile_id',
    bind: { $tile_id: oasisTileId },
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
        $source_specifier: oasisTileId,
      },
    });
  }
};

/**
 * Shared logic for resolving combat in attack and raid movements.
 */
export const resolveTroopMovementCombat = (
  database: DbFacade,
  args: GameEvent<'troopMovementAttack' | 'troopMovementRaid'>,
  isRaid: boolean,
): void => {
  const {
    villageId,
    targetId,
    resolvesAt,
    troops: attackerTroopsRaw,
    scoutMode,
  } = args;

  if (scoutMode !== undefined) {
    resolveScoutMovement(database, {
      villageId,
      targetId,
      resolvesAt,
      troops: attackerTroopsRaw,
      scoutMode,
      isRaid,
    });
    return;
  }

  // Check if target is an oasis (EXISTS returns 0 or 1, correctly handles multi-bonus oases)
  const isOasis = database.selectValue({
    sql: 'SELECT EXISTS(SELECT 1 FROM oasis WHERE tile_id = $tile_id) AS is_oasis',
    bind: { $tile_id: targetId },
    schema: z.number(),
  })!;

  if (isOasis) {
    // Handle oasis combat separately
    resolveOasisCombat(
      database,
      villageId,
      targetId,
      resolvesAt,
      attackerTroopsRaw,
      isRaid,
    );
    return;
  }

  // 1. Update resources for both villages to current time
  updateVillageResourcesAt(database, villageId, resolvesAt);
  updateVillageResourcesAt(database, targetId, resolvesAt);

  // 2. Fetch target tile ID and basic info
  const targetVillage = database.selectObject({
    sql: `
      SELECT
        v.tile_id as tileId,
        v.name as name,
        p.name as playerName,
        p.faction_id as factionId,
        COALESCE(vt.tribe, pt.tribe, 'nature') as tribe
      FROM villages v
      JOIN players p ON v.player_id = p.id
      LEFT JOIN tribe_ids vt ON vt.id = v.tribe_id
      LEFT JOIN tribe_ids pt ON pt.id = p.tribe_id
      WHERE v.id = $id
    `,
    bind: { $id: targetId },
    schema: z.object({
      tileId: z.number(),
      name: z.string(),
      playerName: z.string(),
      factionId: z.number(),
      tribe: z.string(),
    }),
  })!;

  const attackerVillage = database.selectObject({
    sql: `
      SELECT
        v.name as name,
        p.id as playerId,
        p.name as playerName,
        p.faction_id as factionId,
        COALESCE(vt.tribe, pt.tribe) as tribe
      FROM villages v
      JOIN players p ON v.player_id = p.id
      LEFT JOIN tribe_ids vt ON vt.id = v.tribe_id
      LEFT JOIN tribe_ids pt ON pt.id = p.tribe_id
      WHERE v.id = $id
    `,
    bind: { $id: villageId },
    schema: z.object({
      name: z.string(),
      playerId: z.number(),
      playerName: z.string(),
      factionId: z.number(),
      tribe: z.string(),
    }),
  })!;

  // 3. NPC processing (regeneration)
  regenerateNpcTroops(database, targetId, resolvesAt);

  // 4. Gather combat data
  const attackerTroops = getAttackerTroopsWithSmithy(
    database,
    villageId,
    attackerTroopsRaw,
  );
  const defenderTroops = fetchDefenderTroops(database, targetVillage.tileId);
  const modifiers = fetchDefenseModifiers(database, targetId);

  const { currentWood, currentClay, currentIron, currentWheat } =
    calculateVillageResourcesAt(database, targetId, resolvesAt);
  const defenderResources: [number, number, number, number] = [
    currentWood,
    currentClay,
    currentIron,
    currentWheat,
  ];

  // 5. Run combat engine
  const result = resolveCombat(
    attackerTroops,
    defenderTroops,
    modifiers,
    defenderResources,
    isRaid,
  );

  const attackerHeroSurvived = result.attackerSurvivors.some(
    ({ unitId }) => unitId === 'HERO',
  );
  const attackerHeroDied =
    attackerTroopsRaw.some(({ unitId }) => unitId === 'HERO') &&
    !attackerHeroSurvived;

  if (attackerHeroDied) {
    database.exec({
      sql: 'UPDATE heroes SET health = 0 WHERE player_id = (SELECT player_id FROM villages WHERE id = $villageId);',
      bind: { $villageId: villageId },
    });
    onHeroDeath(database, resolvesAt);
  }

  // 6. Apply troop changes to DB
  // First, fetch all current defenders to remove them all (reinforcements + owner)
  const currentDefendersRaw = database.selectObjects({
    sql: `
      SELECT u.unit AS unitId, t.tile_id, t.source_tile_id, t.amount
      FROM troops t
      JOIN unit_ids u ON u.id = t.unit_id
      WHERE t.tile_id = $tileId AND t.amount > 0
    `,
    bind: { $tileId: targetVillage.tileId },
    schema: z.object({
      unitId: z.string(),
      tile_id: z.number(),
      source_tile_id: z.number(),
      amount: z.number(),
    }),
  });

  // Remove all defenders, then add survivors back proportionally.
  database.exec({
    sql: 'DELETE FROM troops WHERE tile_id = $tileId',
    bind: { $tileId: targetVillage.tileId },
  });

  // Calculate survival ratio for defenders
  // In our engine, we handle total counts, but we must apply them back to each source.
  // Simplified for now: apply uniform casualty percent to all defender sources.
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

  for (const def of currentDefendersRaw) {
    const lost = Math.round(def.amount * defenderLossRatio);
    const survived = def.amount - lost;

    if (survived > 0) {
      survivingDefenderTroops.push({
        unitId: def.unitId as UnitId,
        amount: survived,
        tileId: def.tile_id,
        source: def.source_tile_id,
      });
    }
  }

  if (survivingDefenderTroops.length > 0) {
    addTroops(database, survivingDefenderTroops);
  }

  // 7. Handle wall damage (rams only fire in normal attacks, not raids)
  if (!isRaid && result.wallDamage > 0 && modifiers.wallType) {
    updateWallLevel(
      database,
      targetId,
      modifiers.wallType,
      Math.max(0, modifiers.wallLevel - result.wallDamage),
    );
  }

  // 7b. Catapult building damage (only in normal attacks, not raids)
  let catapultReport: CatapultDamageResult | undefined;
  if (!isRaid) {
    const survivingCatapults = result.attackerSurvivors
      .filter((t) => CATAPULT_UNIT_IDS.has(t.unitId))
      .reduce((sum, t) => sum + t.amount, 0);

    if (survivingCatapults > 0) {
      // Get catapult targets from event args
      const catapultTarget1 =
        'catapultTarget1' in args
          ? (args as { catapultTarget1?: string }).catapultTarget1
          : undefined;
      const catapultTarget2 =
        'catapultTarget2' in args
          ? (args as { catapultTarget2?: string }).catapultTarget2
          : undefined;

      catapultReport = resolveCatapultDamage(
        database,
        villageId,
        targetId,
        catapultTarget1,
        catapultTarget2,
        survivingCatapults,
        resolvesAt,
      );
    }
  }

  // 8. Handle loot with cranny protection
  // Cranny protects resources from being looted - attacker can only loot
  // resources beyond the cranny capacity
  const crannyData = getCrannyCapacity(database, targetId, targetVillage.tribe);
  const totalDefenderResources = defenderResources.reduce(
    (sum, v) => sum + v,
    0,
  );
  const totalLootableResources = Math.max(
    0,
    totalDefenderResources - crannyData.capacity,
  );
  const totalLoot = result.loot.reduce((sum, v) => sum + v, 0);

  let lootToApply: [number, number, number, number] = result.loot;
  if (totalLoot > totalLootableResources && totalLootableResources > 0) {
    const scaleFactor = totalLootableResources / totalLoot;
    lootToApply = result.loot.map((v) => Math.floor(v * scaleFactor)) as [
      number,
      number,
      number,
      number,
    ];
  } else if (totalLootableResources <= 0) {
    lootToApply = [0, 0, 0, 0];
  }

  const lootTotal = lootToApply.reduce((sum, v) => sum + v, 0);
  if (lootTotal > 0) {
    subtractVillageResourcesAt(database, targetId, resolvesAt, lootToApply);
  }

  // 9. Chief attack: loyalty reduction (MUST run before return event to avoid
  //    conquest cleanup deleting the return event)
  let reportLoyaltyReduction: number | undefined;
  let reportNewLoyalty: number | undefined;
  let reportConquered: boolean | undefined;
  let reportProtectedBuildingName: string | undefined;
  let reportProtectedBuildingLevel: number | undefined;

  // Chiefs fire when: not a raid, AND either attacker won OR no defenders remain
  const noDefendersRemain = defenderTroops.every((t) => t.amount === 0);
  const attackerSucceeds =
    !isRaid && (result.attackerWins || noDefendersRemain);

  if (attackerSucceeds) {
    const loyaltyReduction = _calculateChiefLoyaltyReduction(
      result.attackerSurvivors,
    );

    if (loyaltyReduction > 0) {
      try {
        const newLoyalty = _updateVillageLoyalty(
          database,
          targetId,
          loyaltyReduction,
          resolvesAt,
        );

        reportLoyaltyReduction = loyaltyReduction;
        reportNewLoyalty = newLoyalty;

        if (newLoyalty === 0) {
          // Check if admin building blocks conquest
          const adminBuilding = _hasPalaceOrResidence(database, targetId);
          if (!adminBuilding.exists) {
            _transferVillageOwnership(
              database,
              targetId,
              PLAYER_ID,
              resolvesAt,
            );
            reportConquered = true;
            console.error(
              `[Chief] Village ${targetId} CONQUERED — assigned to PLAYER_ID=${PLAYER_ID}`,
            );
            // Verify conquest persisted
            const postConquest = database.selectObject({
              sql: 'SELECT id, player_id FROM villages WHERE id = $id',
              bind: { $id: targetId },
              schema: z.object({
                id: z.number(),
                player_id: z.number().nullable(),
              }),
            });
            console.error(
              '[Chief] Post-conquest village:',
              JSON.stringify(postConquest),
            );
          } else {
            // Loyalty 0 but building protects — can't conquer
            reportProtectedBuildingName =
              adminBuilding.buildingName ?? undefined;
            reportProtectedBuildingLevel = adminBuilding.level;
            console.error(
              `[Chief] Village ${targetId} loyalty at 0 but protected by ${adminBuilding.buildingName} Lv${adminBuilding.level} — not conquered`,
            );
          }
        } else {
          // Loyalty > 0 — check if building exists (for informational display)
          const adminBuilding = _hasPalaceOrResidence(database, targetId);
          if (adminBuilding.exists) {
            reportProtectedBuildingName =
              adminBuilding.buildingName ?? undefined;
            reportProtectedBuildingLevel = adminBuilding.level;
          }
          console.error(
            `[Chief] Village ${targetId} loyalty reduced by ${loyaltyReduction} → ${newLoyalty}%`,
          );
        }
      } catch (_e) {
        console.error('[Chief] Loyalty update failed:', _e);
      }
    }
  }

  // 10. Save report (BEFORE return event so report is always saved even if
  //    return event creation fails)
  saveCombatReport(
    database,
    {
      ...result,
      attackerVillageName: attackerVillage.name,
      defenderVillageName: targetVillage.name,
      attackerPlayerName: attackerVillage.playerName,
      defenderPlayerName: targetVillage.playerName,
      attackerTribe: attackerVillage.tribe,
      defenderTribe: targetVillage.tribe,
      initialAttackerTroops: attackerTroopsRaw,
      initialDefenderTroops: defenderTroops.map((d) => ({
        unitId: d.unitId,
        amount: d.amount,
      })),
      isRaid,
      ...(reportLoyaltyReduction !== undefined && {
        loyaltyReduction: reportLoyaltyReduction,
        newLoyalty: reportNewLoyalty,
        conquered: reportConquered,
        protectedBuildingName: reportProtectedBuildingName,
        protectedBuildingLevel: reportProtectedBuildingLevel,
      }),
      ...(catapultReport && {
        catapultTarget1: catapultReport.target1,
        catapultLevelsDestroyed1: catapultReport.levelsDestroyed1,
        catapultTarget1Destroyed: catapultReport.target1Destroyed,
        catapultTarget1IsRandom: catapultReport.target1IsRandom,
        catapultTarget1RequestedName: catapultReport.target1RequestedName,
        catapultTarget1WasFallback: catapultReport.target1WasFallback,
        ...(catapultReport.target2 && {
          catapultTarget2: catapultReport.target2,
          catapultLevelsDestroyed2: catapultReport.levelsDestroyed2,
          catapultTarget2Destroyed: catapultReport.target2Destroyed,
          catapultTarget2IsRandom: catapultReport.target2IsRandom,
          catapultTarget2RequestedName: catapultReport.target2RequestedName,
          catapultTarget2WasFallback: catapultReport.target2WasFallback,
        }),
        ...(catapultReport.villageDestroyed && {
          villageDestroyed: true,
        }),
      }),
    },
    villageId,
    targetId,
    resolvesAt,
    attackerVillage.factionId,
    targetVillage.factionId,
  );

  // 11. Attacker return movement (wrapped in try/catch — if return event fails,
  //    add troops directly home so they're not stuck in limbo)
  const villageWasDestroyed = catapultReport?.villageDestroyed ?? false;
  const villageWasConquered = reportConquered ?? false;

  if (result.attackerSurvivors.length > 0) {
    try {
      const sourceTileId = database.selectValue({
        sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
        bind: { $villageId: villageId },
        schema: z.number(),
      })!;

      const troopsAtTileId =
        villageWasDestroyed || villageWasConquered
          ? sourceTileId
          : targetVillage.tileId;

      console.error('[Return] villageWasDestroyed:', villageWasDestroyed);
      console.error('[Return] villageWasConquered:', villageWasConquered);
      console.error('[Return] troopsAtTileId:', troopsAtTileId);
      console.error('[Return] sourceTileId:', sourceTileId);
      console.error('[Return] survivorCount:', result.attackerSurvivors.length);

      createEvents<'troopMovementReturn'>(database, {
        villageId: villageId,
        targetId: villageId,
        startsAt: resolvesAt,
        troops: result.attackerSurvivors.map((s) => ({
          unitId: s.unitId,
          amount: s.amount,
          tileId: troopsAtTileId,
          source: sourceTileId,
        })),
        type: 'troopMovementReturn',
        originalMovementType: isRaid ? 'raid' : 'attack',
        loot: lootToApply,
      } as GameEvent<'troopMovementReturn'>);
    } catch (e) {
      console.error(
        '[Return] createEvents THREW:',
        String(e),
        (e as Error)?.stack,
      );
      // Fallback: add troops directly home if return event creation fails
      try {
        const homeTileId = database.selectValue({
          sql: 'SELECT tile_id FROM villages WHERE id = $id',
          bind: { $id: villageId },
          schema: z.number(),
        });
        if (homeTileId) {
          addTroops(
            database,
            result.attackerSurvivors.map((s) => ({
              unitId: s.unitId,
              amount: s.amount,
              tileId: homeTileId,
              source: homeTileId,
            })),
          );
          if (lootToApply.some((v) => v > 0)) {
            addVillageResourcesAt(database, villageId, resolvesAt, lootToApply);
          }
        }
      } catch (_fallbackErr) {
        console.error('[Return] fallback also failed:', _fallbackErr);
      }
    }
  }

  // 12. NPC Retaliation
  handleNpcRetaliation(database, targetId, villageId, resolvesAt);
};
