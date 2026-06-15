import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { BatchVillageRow } from '../npc-brain-types';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';

/**
 * Batched loot recovery for all NPC villages.
 * One query fetches all loot states. JavaScript computes recovery.
 * One batch UPDATE writes all results.
 */
export const processLootRecoveryBatch = (
  db: DbFacade,
  allVillages: BatchVillageRow[],
  allFieldLevels: Map<number, number>, // villageId -> field level sum
  chunkMs: number,
  speed: number,
): void => {
  const now = Date.now();
  const elapsedHours = chunkMs / 3_600_000;

  const updates: { villageId: number; newLoot: number; restState?: number }[] =
    [];

  for (const village of allVillages) {
    // Already at full loot — check rest state
    if (village.currentLoot >= 1.0) {
      const timeSinceRaid = now - village.lastRaidedMs;
      if (timeSinceRaid > village.restThresholdMs && village.restState === 0) {
        updates.push({
          villageId: village.villageId,
          newLoot: 1.0,
          restState: 1,
        });
      }
      continue;
    }

    // Calculate recovery
    const fieldLevelSum = allFieldLevels.get(village.villageId) ?? 0;
    const recoveryScale =
      fieldLevelSum / NPC_BRAIN_CONSTANTS.FULL_RECOVERY_FIELD_SUM;
    const baseRate = NPC_BRAIN_CONSTANTS.BASE_LOOT_RECOVERY_RATE;
    const recoveryRate = baseRate * Math.min(1.0, recoveryScale) * speed;
    const recoveryAmount = recoveryRate * elapsedHours;

    const newLoot = Math.min(1.0, village.currentLoot + recoveryAmount);

    if (newLoot >= 1.0) {
      const timeSinceRaid = now - village.lastRaidedMs;
      if (timeSinceRaid > village.restThresholdMs) {
        updates.push({
          villageId: village.villageId,
          newLoot: 1.0,
          restState: 1,
        });
      } else {
        updates.push({ villageId: village.villageId, newLoot: 1.0 });
      }
    } else {
      updates.push({ villageId: village.villageId, newLoot });
    }
  }

  if (updates.length === 0) {
    return;
  }

  // ─── Batch UPDATE ───
  const lootCase: string[] = [];
  const _restCase: string[] = [];
  const restUpdates: typeof updates = [];
  const bind: Record<string, number> = {};

  updates.forEach((u, i) => {
    const vk = `$v${i}`;
    const lk = `$l${i}`;
    lootCase.push(`WHEN village_id = ${vk} THEN ${lk}`);
    bind[vk] = u.villageId;
    bind[lk] = u.newLoot;

    if (u.restState !== undefined) {
      restUpdates.push(u);
    }
  });

  const villageIdPlaceholders = updates.map((_, i) => `$vid${i}`).join(',');
  const villageIdBinds: Record<string, number> = {};
  updates.forEach((u, i) => {
    villageIdBinds[`$vid${i}`] = u.villageId;
  });

  let restClause = '';
  if (restUpdates.length > 0) {
    const restCaseClauses: string[] = [];
    restUpdates.forEach((u, i) => {
      restCaseClauses.push(`WHEN village_id = $rv${i} THEN ${u.restState}`);
      bind[`$rv${i}`] = u.villageId;
    });
    restClause = `,
        rest_state = CASE
          ${restCaseClauses.join('\n')}
          ELSE rest_state
        END`;
  }

  db.exec({
    sql: `
      UPDATE npc_village_state
      SET current_loot_available = CASE
        ${lootCase.join('\n')}
        ELSE current_loot_available
      END${restClause}
      WHERE village_id IN (${villageIdPlaceholders});
    `,
    bind: { ...bind, ...villageIdBinds },
  });
};

/**
 * Reset rest state when a village is raided.
 */
export const resetRestState = (db: DbFacade, villageId: number): void => {
  db.exec({
    sql: `
      UPDATE npc_village_state
      SET rest_state = 0
      WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
  });
};

/**
 * Get the rest stockpile bonus multiplier for a village.
 * Returns 0 if not in rest state.
 */
export const getRestBonus = (db: DbFacade, villageId: number): number => {
  const state = db.selectObject({
    sql: `
      SELECT rest_state AS restState, rest_stockpile_bonus AS bonus
      FROM npc_village_state
      WHERE village_id = $villageId;
    `,
    bind: { $villageId: villageId },
    schema: z.any(),
  }) as { restState: number; bonus: number } | undefined;

  if (!state || state.restState === 0) {
    return 0;
  }

  return state.bonus;
};
