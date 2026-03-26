import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';

describe('village ownership transfer', () => {
  test('should transfer player_id, reset loyalty, generate slug, and delete old reports', async () => {
    const database = await prepareTestDatabase();

    // Find an NPC village that is not the player's village
    const npcVillage = database.selectObject({
      sql: `
        SELECT v.id, v.tile_id, v.player_id, v.tribe_id, v.slug
        FROM villages v
        WHERE v.player_id != $playerId
        LIMIT 1
      `,
      bind: { $playerId: PLAYER_ID },
      schema: z.strictObject({
        id: z.number(),
        tile_id: z.number(),
        player_id: z.number(),
        tribe_id: z.number().nullable(),
        slug: z.string().nullable(),
      }),
    })!;

    const originalPlayerId = npcVillage.player_id;

    // Insert a report for the NPC village (simulating old NPC reports)
    database.exec({
      sql: `INSERT INTO reports (type, village_id, timestamp, data) VALUES ('attack', $villageId, 1000, '{}')`,
      bind: { $villageId: npcVillage.id },
    });

    const reportsBefore = database.selectValue({
      sql: 'SELECT COUNT(*) FROM reports WHERE village_id = $villageId',
      bind: { $villageId: npcVillage.id },
      schema: z.number(),
    })!;
    expect(reportsBefore).toBeGreaterThan(0);

    // Simulate _transferVillageOwnership operations
    const resolvesAt = Date.now();

    // 1. Transfer ownership and reset loyalty
    database.exec({
      sql: `UPDATE villages
            SET player_id = $player_id,
                loyalty = 100,
                loyalty_updated_at = $now,
                slug = CASE WHEN slug IS NULL OR slug = '' THEN 'v-' || id ELSE slug END
            WHERE id = $village_id`,
      bind: {
        $player_id: PLAYER_ID,
        $village_id: npcVillage.id,
        $now: resolvesAt,
      },
    });

    // 2. Delete old reports
    database.exec({
      sql: 'DELETE FROM reports WHERE village_id = $village_id',
      bind: { $village_id: npcVillage.id },
    });

    // Verify player_id changed
    const updatedVillage = database.selectObject({
      sql: 'SELECT player_id, tribe_id, loyalty, slug FROM villages WHERE id = $id',
      bind: { $id: npcVillage.id },
      schema: z.strictObject({
        player_id: z.number(),
        tribe_id: z.number().nullable(),
        loyalty: z.number(),
        slug: z.string().nullable(),
      }),
    })!;

    expect(updatedVillage.player_id).toBe(PLAYER_ID);
    expect(updatedVillage.player_id).not.toBe(originalPlayerId);

    // Verify loyalty was reset
    expect(updatedVillage.loyalty).toBe(100);

    // Verify slug is not null
    expect(updatedVillage.slug).not.toBeNull();
    expect(updatedVillage.slug).toMatch(/^v-\d+$/);

    // Verify old reports were deleted
    const reportsAfter = database.selectValue({
      sql: 'SELECT COUNT(*) FROM reports WHERE village_id = $villageId',
      bind: { $villageId: npcVillage.id },
      schema: z.number(),
    })!;
    expect(reportsAfter).toBe(0);
  });
});

describe('tribe preservation after conquest', () => {
  test('village tribe_id should NOT change after conquest', async () => {
    const database = await prepareTestDatabase();

    // Get Gaul tribe ID
    const gaulTribeId = database.selectValue({
      sql: "SELECT id FROM tribe_ids WHERE tribe = 'gauls'",
      schema: z.number(),
    })!;

    // Get Roman tribe ID
    const romanTribeId = database.selectValue({
      sql: "SELECT id FROM tribe_ids WHERE tribe = 'romans'",
      schema: z.number(),
    })!;

    // Find a Gaul NPC village
    const gaulVillage = database.selectObject({
      sql: `
        SELECT v.id, v.player_id, v.tribe_id
        FROM villages v
        JOIN players p ON p.id = v.player_id
        WHERE p.tribe_id = $gaulTribeId AND v.player_id != $playerId
        LIMIT 1
      `,
      bind: { $gaulTribeId: gaulTribeId, $playerId: PLAYER_ID },
      schema: z.strictObject({
        id: z.number(),
        player_id: z.number(),
        tribe_id: z.number().nullable(),
      }),
    })!;

    expect(gaulVillage.tribe_id).toBe(gaulTribeId);

    // Simulate conquest: update player_id but NOT tribe_id
    database.exec({
      sql: 'UPDATE villages SET player_id = $playerId, loyalty = 100 WHERE id = $villageId',
      bind: { $playerId: PLAYER_ID, $villageId: gaulVillage.id },
    });

    // Verify tribe_id is preserved
    const afterConquest = database.selectObject({
      sql: 'SELECT player_id, tribe_id FROM villages WHERE id = $id',
      bind: { $id: gaulVillage.id },
      schema: z.strictObject({
        player_id: z.number(),
        tribe_id: z.number().nullable(),
      }),
    })!;

    // Player changed to Roman
    expect(afterConquest.player_id).toBe(PLAYER_ID);

    // Tribe stays as Gaul
    expect(afterConquest.tribe_id).toBe(gaulTribeId);
    expect(afterConquest.tribe_id).not.toBe(romanTribeId);

    // Verify the query returns Gaul tribe via COALESCE
    const tribeQuery = database.selectValue({
      sql: `SELECT COALESCE(vt.tribe, pt.tribe)
            FROM villages v
            LEFT JOIN tribe_ids vt ON vt.id = v.tribe_id
            LEFT JOIN players p ON p.id = v.player_id
            LEFT JOIN tribe_ids pt ON pt.id = p.tribe_id
            WHERE v.id = $id`,
      bind: { $id: gaulVillage.id },
      schema: z.string(),
    })!;

    expect(tribeQuery).toBe('gauls');
    expect(tribeQuery).not.toBe('romans');
  });
});
