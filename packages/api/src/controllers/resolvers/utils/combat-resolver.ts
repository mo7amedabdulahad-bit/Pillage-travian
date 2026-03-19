import { z } from 'zod';
import { resolveCombat } from '@pillage-first/game-assets/combat/combat-engine';
import type { GameEvent } from '@pillage-first/types/models/game-event';
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
import { handleNpcRetaliation, regenerateNpcTroops } from './npc';
import { saveCombatReport } from './reports';

/**
 * Shared logic for resolving combat in attack and raid movements.
 */
export const resolveTroopMovementCombat = (
  database: DbFacade,
  args: GameEvent<'troopMovementAttack' | 'troopMovementRaid'>,
  isRaid: boolean,
): void => {
  const { villageId, targetId, resolvesAt, troops: attackerTroopsRaw } = args;

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

  // 6. Apply troop changes to DB
  // First, fetch all current defenders to remove them all (reinforcements + owner)
  const currentDefendersRaw = database.selectObjects({
    sql: 'SELECT unit_id, tile_id, source_tile_id, amount FROM troops WHERE tile_id = $tileId AND amount > 0',
    bind: { $tileId: targetVillage.tileId },
    schema: z.object({
      unit_id: z.number(),
      tile_id: z.number(),
      source_tile_id: z.number(),
      amount: z.number(),
    }),
  });

  // Zero out all defenders (we will add survivors back proportionally)
  database.exec({
    sql: 'UPDATE troops SET amount = 0 WHERE tile_id = $tileId',
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

  for (const def of currentDefendersRaw) {
    const lost = Math.round(def.amount * defenderLossRatio);
    const survived = def.amount - lost;
    if (survived > 0) {
      database.exec({
        sql: 'UPDATE troops SET amount = amount + $survived WHERE unit_id = $uId AND tile_id = $tId AND source_tile_id = $sId',
        bind: {
          $survived: survived,
          $uId: def.unit_id,
          $tId: def.tile_id,
          $sId: def.source_tile_id,
        },
      });
    }
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
      ...args,
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
    } as unknown as GameEvent<'troopMovementReturn'>);
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
