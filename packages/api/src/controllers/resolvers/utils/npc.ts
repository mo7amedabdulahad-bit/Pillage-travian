import { z } from 'zod';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createEvents } from '../../utils/create-event';
import { addTroops } from './troops';

const tribeToTiers: Record<string, string[]> = {
  romans: ['LEGIONNAIRE', 'PRAETORIAN', 'IMPERIAN', 'EQUITES_IMPERATORIS'],
  gauls: ['PHALANX', 'SWORDSMAN', 'THEUTATES_THUNDER', 'DRUIDRIDER'],
  teutons: ['CLUBSWINGER', 'SPEARMAN', 'AXEMAN', 'PALADIN'],
  egyptians: ['SLAVE_MILITIA', 'ASH_WARDEN', 'KHOPESH_WARRIOR', 'ANHUR_GUARD'],
  huns: ['MERCENARY', 'BOWMAN', 'STEPPE_RIDER', 'MARKSMAN'],
  spartans: ['HOPLITE', 'SHIELDSMAN', 'TWINSTEEL_THERION', 'ELPIDA_RIDER'],
  natars: ['PIKEMAN', 'THORNED_WARRIOR', 'GUARDSMAN', 'AXERIDER'],
};

const villageSizeToRegenRate: Record<VillageSize, number> = {
  xxs: 2,
  xs: 5,
  sm: 10,
  md: 20,
  lg: 40,
  xl: 80,
  '2xl': 150,
  '3xl': 300,
  '4xl': 600,
};

const tierWeights = [0.5, 0.25, 0.15, 0.1];

const personalityBaseChance: Record<string, number> = {
  passive: 0.05,
  defensive: 0.1,
  balanced: 0.2,
  aggressive: 0.4,
  warlike: 0.6,
};

/**
 * Regenerates NPC troops based on elapsed time since last interaction.
 */
export const regenerateNpcTroops = (
  database: DbFacade,
  villageId: number,
  timestamp: number,
): void => {
  const state = database.selectObject({
    sql: `
      SELECT 
        nvas.village_id,
        nvas.last_interacted_at,
        v.tile_id,
        ti.tribe,
        v.player_id
      FROM npc_village_state nvas
      JOIN villages v ON nvas.village_id = v.id
      JOIN players p ON v.player_id = p.id
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE nvas.village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.object({
      village_id: z.number(),
      last_interacted_at: z.number(),
      tile_id: z.number(),
      tribe: z.string(),
      player_id: z.number(),
    }),
  });

  if (!state) {
    return;
  }

  // Update interaction timestamp
  database.exec({
    sql: 'UPDATE npc_village_state SET last_interacted_at = $timestamp WHERE village_id = $villageId',
    bind: { $timestamp: timestamp, $villageId: villageId },
  });

  const lastInteractedAt = state.last_interacted_at;
  if (lastInteractedAt === 0) {
    return; // First time, no regen
  }

  const elapsedMilliseconds = timestamp - lastInteractedAt;
  const elapsedHours = elapsedMilliseconds / (1000 * 3600);

  if (elapsedHours <= 0) {
    return;
  }

  // Get village size based on distance from center (simplified for now as per design doc)
  // Actually, I should probably store it, but I can re-calculate it.
  // For now, let's assume a default regen rate if I can't easily get the size.
  // Actually, I'll fetch the tile's X/Y to determine size.
  const { x, y } = database.selectObject({
    sql: 'SELECT x, y FROM tiles WHERE id = $tile_id',
    bind: { $tile_id: state.tile_id },
    schema: z.object({ x: z.number(), y: z.number() }),
  })!;

  // I need mapSize to use getVillageSize, but I don't have it here.
  // I'll take mapSize from servers table.
  const { mapSize } = database.selectObject({
    sql: 'SELECT map_size as mapSize FROM servers LIMIT 1',
    schema: z.object({ mapSize: z.number() }),
  })!;

  // Manually compute size like in village-size.ts
  const dist = Math.hypot(x, y);
  const normalizedDist = dist / (mapSize / 2);
  let size: VillageSize = 'xxs';
  if (normalizedDist > 0.9) {
    size = 'xxs';
  } else if (normalizedDist > 0.8) {
    size = 'xs';
  } else if (normalizedDist > 0.7) {
    size = 'sm';
  } else if (normalizedDist > 0.6) {
    size = 'md';
  } else if (normalizedDist > 0.4) {
    size = 'lg';
  } else if (normalizedDist > 0.3) {
    size = 'xl';
  } else if (normalizedDist > 0.2) {
    size = '2xl';
  } else if (normalizedDist > 0.1) {
    size = '3xl';
  } else {
    size = '4xl';
  }

  const regenRate = villageSizeToRegenRate[size];
  const totalRegen = Math.floor(elapsedHours * regenRate);

  if (totalRegen <= 0) {
    return;
  }

  const tribeUnits = tribeToTiers[state.tribe];
  if (!tribeUnits) {
    return;
  }

  const troopsToAdd = tribeUnits.map((unitId, index) => ({
    unitId: unitId as UnitId,
    amount: Math.floor(totalRegen * tierWeights[index]),
    tileId: state.tile_id,
    source: state.tile_id,
  }));

  // biome-ignore lint/suspicious/noExplicitAny: Unit IDs from DB are strings but mathematically match the UnitId union
  addTroops(database, troopsToAdd as any);
};

/**
 * Triggers NPC retaliation if applicable.
 */
export const handleNpcRetaliation = (
  database: DbFacade,
  villageId: number,
  attackerVillageId: number,
  timestamp: number,
): void => {
  // 1. Increment attack counter and fetch current state
  const state = database.selectObject({
    sql: `
      UPDATE npc_village_state 
      SET times_attacked = times_attacked + 1 
      WHERE village_id = $villageId
      RETURNING times_attacked, village_id;
    `,
    bind: { $villageId: villageId },
    schema: z.object({ times_attacked: z.number(), village_id: z.number() }),
  });

  if (!state) {
    return;
  }

  const npcInfo = database.selectObject({
    sql: `
      SELECT p.personality, v.tile_id
      FROM villages v
      JOIN players p ON v.player_id = p.id
      WHERE v.id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.object({ personality: z.string(), tile_id: z.number() }),
  });

  if (!npcInfo) {
    return;
  }

  // 2. Roll for retaliation
  const baseChance = personalityBaseChance[npcInfo.personality] ?? 0.2;
  const multiplier = Math.min(3, 1 + state.times_attacked / 5);
  const totalChance = baseChance * multiplier;

  if (Math.random() > totalChance) {
    return;
  }

  // 3. Select troops for retaliation
  const homeTroops = database.selectObjects({
    sql: `
      SELECT u.unit AS unitId, t.amount
      FROM troops t
      JOIN unit_ids u ON u.id = t.unit_id
      WHERE t.tile_id = $tileId
        AND t.source_tile_id = $tileId
        AND t.amount > 0
    `,
    bind: { $tileId: npcInfo.tile_id },
    schema: z.strictObject({ unitId: z.string(), amount: z.number() }),
  });

  const totalUnits = homeTroops.reduce((sum, t) => sum + t.amount, 0);
  if (totalUnits < 20) {
    return; // Not enough troops to bother
  }

  // Send 30-70% of troops
  const percentToSend = 0.3 + Math.random() * 0.4;
  const attackingTroops = homeTroops
    .map((t) => ({
      unitId: t.unitId as UnitId,
      amount: Math.max(1, Math.floor(t.amount * percentToSend)),
      tileId: npcInfo.tile_id,
      source: npcInfo.tile_id,
    }))
    .filter((t) => t.amount > 0);

  if (attackingTroops.length === 0) {
    return;
  }

  // 4. Schedule retaliation attack
  createEvents<'troopMovementAttack'>(database, {
    type: 'troopMovementAttack',
    villageId: villageId,
    targetId: attackerVillageId,
    // biome-ignore lint/suspicious/noExplicitAny: Unit IDs from DB are strings but mathematically match the UnitId union
    troops: attackingTroops as any,
    startsAt: timestamp,
  });
};
