import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';

/**
 * Seeds staggered proactive_attack_offset_ms for NPC villages
 * and initializes npc_faction_state for each faction.
 *
 * This prevents the thundering herd bug where all NPC villages
 * attack simultaneously on the first tick after grace period ends.
 */
export const npcFactionStateSeeder = (database: DbFacade): void => {
  // Get all NPC villages grouped by faction
  const villages = database.selectObjects({
    sql: `
      SELECT
        nvs.village_id AS villageId,
        nvs.faction_key AS factionKey
      FROM npc_village_state nvs
      ORDER BY nvs.faction_key, nvs.village_id;
    `,
    schema: z.strictObject({
      villageId: z.number(),
      factionKey: z.string(),
    }),
  });

  if (villages.length === 0) {
    return;
  }

  // Group villages by faction
  const factionVillages = new Map<string, number[]>();
  for (const village of villages) {
    const existing = factionVillages.get(village.factionKey) ?? [];
    existing.push(village.villageId);
    factionVillages.set(village.factionKey, existing);
  }

  const totalFactions = factionVillages.size;
  // Spread window: 20 minutes in real ms (not divided by speed)
  const spreadWindowMs = 20 * 60 * 1000;

  // Calculate staggered offsets for each village
  const offsetUpdates: { villageId: number; offsetMs: number }[] = [];
  let factionIndex = 0;

  for (const [_factionKey, villageIds] of factionVillages) {
    const totalVillagesInFaction = villageIds.length;

    for (
      let villageIndex = 0;
      villageIndex < totalVillagesInFaction;
      villageIndex++
    ) {
      const factionSlot = factionIndex / totalFactions;
      const villageSlot = villageIndex / totalVillagesInFaction;
      const offsetMs = Math.floor(
        (factionSlot + villageSlot / totalFactions) * spreadWindowMs,
      );

      offsetUpdates.push({
        villageId: villageIds[villageIndex],
        offsetMs,
      });
    }

    factionIndex++;
  }

  // Batch update offsets
  if (offsetUpdates.length > 0) {
    const caseClauses: string[] = [];
    const bind: Record<string, number> = {};

    for (let i = 0; i < offsetUpdates.length; i++) {
      const u = offsetUpdates[i];
      caseClauses.push(`WHEN village_id = $v${i} THEN $o${i}`);
      bind[`$v${i}`] = u.villageId;
      bind[`$o${i}`] = u.offsetMs;
    }

    const placeholders = offsetUpdates.map((_, i) => `$p${i}`).join(',');
    const placeholderBinds: Record<string, number> = {};
    offsetUpdates.forEach((u, i) => {
      placeholderBinds[`$p${i}`] = u.villageId;
    });

    database.exec({
      sql: `
        UPDATE npc_village_state
        SET proactive_attack_offset_ms = CASE
          ${caseClauses.join('\n')}
          ELSE proactive_attack_offset_ms
        END
        WHERE village_id IN (${placeholders});
      `,
      bind: { ...bind, ...placeholderBinds },
    });
  }

  // Insert one row per faction into npc_faction_state
  const factionKeys = [...factionVillages.keys()];
  for (const factionKey of factionKeys) {
    database.exec({
      sql: `
        INSERT OR IGNORE INTO npc_faction_state
          (faction_key, last_faction_attack_ms, current_wave_stage, wave_locked_until_ms)
        VALUES
          ($factionKey, 0, 0, 0);
      `,
      bind: { $factionKey: factionKey },
    });
  }
};
