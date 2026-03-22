import { z } from 'zod';
import { resolveCombat } from '@pillage-first/game-assets/combat/combat-engine';
import { unitsMap } from '@pillage-first/game-assets/units';
import type {
  GameEvent,
  ScoutMode,
} from '@pillage-first/types/models/game-event';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
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

const _countChiefsSurvived = (
  troops: { unitId: string; amount: number }[],
): number => {
  return troops.reduce((sum, troop) => {
    if (isChiefUnit(troop.unitId)) {
      return sum + troop.amount;
    }
    return sum;
  }, 0);
};

const _LOYALTY_REDUCTION_PER_CHIEF = 5;

const _updateVillageLoyalty = (
  database: DbFacade,
  villageId: number,
  loyaltyReduction: number,
): number => {
  const currentLoyalty =
    database.selectValue({
      sql: 'SELECT loyalty FROM villages WHERE id = $village_id',
      bind: { $village_id: villageId },
      schema: z.number().nullable(),
    }) ?? 100;

  const newLoyalty = Math.max(0, currentLoyalty - loyaltyReduction);

  database.exec({
    sql: 'UPDATE villages SET loyalty = $loyalty WHERE id = $village_id',
    bind: { $loyalty: newLoyalty, $village_id: villageId },
  });

  return newLoyalty;
};

const _transferVillageOwnership = (
  database: DbFacade,
  villageId: number,
  newPlayerId: number,
): void => {
  database.exec({
    sql: 'UPDATE villages SET player_id = $player_id, loyalty = 100 WHERE id = $village_id',
    bind: { $player_id: newPlayerId, $village_id: villageId },
  });
};

const _hasPalaceOrResidence = (
  database: DbFacade,
  villageId: number,
): boolean => {
  const result = database.selectValue({
    sql: `
      SELECT EXISTS(
        SELECT 1 FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id
          AND bi.building IN ('RESIDENCE', 'COMMAND_CENTER')
          AND bf.level > 0
      )
    `,
    bind: { $village_id: villageId },
    schema: z.number(),
  });
  return result === 1;
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
      villageId: targetId,
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
 * - Attack: Combat + loyalty reduction (if hero) + occupation (if loyalty = 0)
 * - Raid: Combat only, no loyalty reduction, no occupation
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
  // Get oasis data
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

  // Get attacker village info
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

  // Get defender troops (nature animals)
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

  const result = resolveCombat(
    attackerTroops,
    defenderTroops,
    { wallType: null, wallLevel: 0, palaceLevel: 0 },
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
      originalMovementType: isRaid ? 'raid' : 'attack',
    });
  }

  // Calculate loyalty reduction for ATTACKS with hero (not raids)
  let loyaltyDecrease: number | undefined;
  let newLoyalty: number | undefined;

  if (!isRaid && heroAlive && totalDefenderRemaining === 0) {
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
      bind: { $loyalty: newLoyalty, $tile_id: oasisTileId },
    });
  }

  // Save combat report
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

  // Try to occupy oasis if it's an attack (not raid), hero alive, and all defenders dead
  if (isRaid || !heroAlive || totalDefenderRemaining > 0 || newLoyalty! > 0) {
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

  if (occupiedOases < occupiedOasisSlots) {
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
      sql: 'UPDATE oasis SET village_id = $village_id, loyalty = 100 WHERE tile_id = $tile_id',
      bind: { $village_id: villageId, $tile_id: oasisTileId },
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

  // Check if target is an oasis
  const isOasis = database.selectValue({
    sql: 'SELECT COUNT(*) FROM oasis WHERE tile_id = $tile_id',
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
        ti.tribe as tribe
      FROM villages v
      JOIN players p ON v.player_id = p.id
      JOIN tribe_ids ti ON p.tribe_id = ti.id
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
        p.name as playerName, 
        p.faction_id as factionId,
        ti.tribe as tribe
      FROM villages v
      JOIN players p ON v.player_id = p.id
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE v.id = $id
    `,
    bind: { $id: villageId },
    schema: z.object({
      name: z.string(),
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

  // 7. Handle wall damage
  if (result.wallDamage > 0 && modifiers.wallType) {
    updateWallLevel(
      database,
      targetId,
      modifiers.wallType,
      Math.max(0, modifiers.wallLevel - result.wallDamage),
    );
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

  // 9. Attacker return movement
  if (result.attackerSurvivors.length > 0) {
    createEvents<'troopMovementReturn'>(database, {
      villageId: targetId,
      targetId: villageId,
      startsAt: resolvesAt,
      troops: result.attackerSurvivors.map((s) => {
        // Find original source tile for each unit?
        // Actually, troopMovementAttack already has a source defined in the event context?
        // No, it just has the troops. We assume they all come from villageId.
        const sourceTileId = database.selectValue({
          sql: 'SELECT tile_id FROM villages WHERE id = $villageId',
          bind: { $villageId: villageId },
          schema: z.number(),
        })!;

        return {
          unitId: s.unitId,
          amount: s.amount,
          tileId: targetVillage.tileId, // Currently at target
          source: sourceTileId, // Heading back to source
        };
      }),
      type: 'troopMovementReturn',
      originalMovementType: isRaid ? 'raid' : 'attack',
      loot: result.loot,
    } as GameEvent<'troopMovementReturn'>);
  }

  // 10. Save report
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
    },
    villageId,
    targetId,
    resolvesAt,
    attackerVillage.factionId,
    targetVillage.factionId,
  );

  // 11. NPC Retaliation
  handleNpcRetaliation(database, targetId, villageId, resolvesAt);
};
