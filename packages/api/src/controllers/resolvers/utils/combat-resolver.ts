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

const getCrannyCapacity = (database: DbFacade, villageId: number): number => {
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

  const crannyValuesPerLevel = [
    0, 100, 130, 170, 220, 280, 360, 460, 600, 770, 1000,
  ];

  return crannyValuesPerLevel[crannyLevel] ?? 0;
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

  const crannyCapacity = getCrannyCapacity(database, targetId);

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
    canSeeResources && defenderResources && crannyCapacity >= 0
      ? ([
          Math.max(0, defenderResources.wood - crannyCapacity),
          Math.max(0, defenderResources.clay - crannyCapacity),
          Math.max(0, defenderResources.iron - crannyCapacity),
          Math.max(0, defenderResources.wheat - crannyCapacity),
        ] as [number, number, number, number])
      : undefined;

  const reportTroops =
    canSeeDefences && attackerWins && attackerOutcome.survivors.length > 0
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
      crannyCapacity: canSeeResources ? crannyCapacity : undefined,
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

  // 8. Handle loot
  const lootTotal = result.loot.reduce((sum, v) => sum + v, 0);
  if (lootTotal > 0) {
    subtractVillageResourcesAt(database, targetId, resolvesAt, result.loot);
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
