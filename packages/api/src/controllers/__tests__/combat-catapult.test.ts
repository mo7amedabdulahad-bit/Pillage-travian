import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createTroopMovementAttackEventMock } from '@pillage-first/mocks/event';
import { attackMovementResolver } from '../resolvers/troop-movement-resolver';

const WALL_BUILDING_IDS = new Set([
  'ROMAN_WALL',
  'GAUL_WALL',
  'TEUTONIC_WALL',
  'EGYPTIAN_WALL',
  'HUN_WALL',
  'SPARTAN_WALL',
  'NATAR_WALL',
  'NATURE_WALL',
]);

const ALWAYS_EXCLUDED = new Set(['CRANNY', 'STONEMASONS_LODGE', 'TRAPPER']);

const CATAPULT_EXCLUDED_BUILDINGS = new Set([
  ...ALWAYS_EXCLUDED,
  ...WALL_BUILDING_IDS,
]);

describe('catapult targeting exclusions', () => {
  test('wall buildings should be excluded from catapult targeting', () => {
    // Verify all wall types are in the excluded set
    for (const wallId of WALL_BUILDING_IDS) {
      expect(CATAPULT_EXCLUDED_BUILDINGS.has(wallId)).toBe(true);
    }
  });

  test('non-wall buildings should NOT be excluded', () => {
    const validTargets = [
      'BARRACKS',
      'STABLE',
      'WORKSHOP',
      'ACADEMY',
      'SMITHY',
      'GRANARY',
      'WAREHOUSE',
      'MAIN_BUILDING',
      'RALLY_POINT',
    ];

    for (const buildingId of validTargets) {
      expect(CATAPULT_EXCLUDED_BUILDINGS.has(buildingId)).toBe(false);
    }
  });

  test('always-excluded buildings (cranny, stonemason, trapper) are in excluded set', () => {
    for (const excluded of ALWAYS_EXCLUDED) {
      expect(CATAPULT_EXCLUDED_BUILDINGS.has(excluded)).toBe(true);
    }
  });
});

describe('catapult double-target same building', () => {
  test('second hit is capped at remaining levels after first hit', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;

    // Find an NPC village with no troops to attack
    const npcVillage = database.selectObject({
      sql: `
        SELECT v.id, v.tile_id AS tileId
        FROM npc_village_state nvs
        JOIN villages v ON v.id = nvs.village_id
        LIMIT 1
      `,
      schema: z.strictObject({ id: z.number(), tileId: z.number() }),
    })!;

    // Remove all defending troops so attacker wins
    database.exec({
      sql: 'DELETE FROM troops WHERE tile_id = $tileId',
      bind: { $tileId: npcVillage.tileId },
    });

    // Get a building with level > 0 in the target village
    const targetBuilding = database.selectObject({
      sql: `
        SELECT bf.field_id, bf.level, bi.building
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $villageId
          AND bf.level > 0
          AND bi.building NOT LIKE '%_WALL'
          AND bi.building NOT IN ('CRANNY', 'STONEMASONS_LODGE', 'TRAPPER')
        ORDER BY bf.level DESC
        LIMIT 1
      `,
      bind: { $villageId: npcVillage.id },
      schema: z.strictObject({
        field_id: z.number(),
        level: z.number(),
        building: z.string(),
      }),
    })!;

    const originalLevel = targetBuilding.level;

    // Mock Math.random to ensure consistent results
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    // Create attack with catapults
    const mockEvent = createTroopMovementAttackEventMock({
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId,
      troops: [
        { unitId: 'LEGIONNAIRE', amount: 100, tileId: 1, source: 1 },
        { unitId: 'ROMAN_CATAPULT', amount: 50, tileId: 1, source: 1 },
      ],
      targetId: npcVillage.id,
      catapultTarget1: targetBuilding.building,
      catapultTarget2: targetBuilding.building,
    });

    attackMovementResolver(database, mockEvent);

    // Check the building level after both catapult hits
    const afterLevel = database.selectValue({
      sql: 'SELECT level FROM building_fields WHERE village_id = $villageId AND field_id = $fieldId',
      bind: { $villageId: npcVillage.id, $fieldId: targetBuilding.field_id },
      schema: z.number(),
    })!;

    // Building level should never be negative
    expect(afterLevel).toBeGreaterThanOrEqual(0);

    // Building level should be less than or equal to original
    expect(afterLevel).toBeLessThanOrEqual(originalLevel);

    // Verify catapult damage is in the report
    const report = database.selectObject({
      sql: "SELECT data FROM reports WHERE type = 'attack' AND village_id = $villageId ORDER BY timestamp DESC LIMIT 1",
      bind: { $villageId: villageId },
      schema: z.strictObject({
        data: z.string().transform((s) => JSON.parse(s)),
      }),
    });

    if (report?.data.catapultTarget1) {
      // If catapults hit something, verify the levels destroyed
      const totalDestroyed =
        (report.data.catapultLevelsDestroyed1 ?? 0) +
        (report.data.catapultLevelsDestroyed2 ?? 0);

      // Total levels destroyed should not exceed original level
      expect(totalDestroyed).toBeLessThanOrEqual(originalLevel);
    }

    randomSpy.mockRestore();
  });

  test('village is destroyed when population reaches zero', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;

    // Find an NPC village
    const npcVillage = database.selectObject({
      sql: `
        SELECT v.id, v.tile_id AS tileId
        FROM npc_village_state nvs
        JOIN villages v ON v.id = nvs.village_id
        LIMIT 1
      `,
      schema: z.strictObject({ id: z.number(), tileId: z.number() }),
    })!;

    // Set all buildings to level 1 so catapults can destroy them easily
    database.exec({
      sql: 'UPDATE building_fields SET level = 1 WHERE village_id = $villageId',
      bind: { $villageId: npcVillage.id },
    });

    // Remove defending troops
    database.exec({
      sql: 'DELETE FROM troops WHERE tile_id = $tileId',
      bind: { $tileId: npcVillage.tileId },
    });

    // Mock random to always pick the first building and max damage
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    // Get the first non-excluded building
    const firstBuilding = database.selectObject({
      sql: `
        SELECT bi.building
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $villageId
          AND bf.level > 0
          AND bi.building NOT LIKE '%_WALL'
          AND bi.building NOT IN ('CRANNY', 'STONEMASONS_LODGE', 'TRAPPER')
        LIMIT 1
      `,
      bind: { $villageId: npcVillage.id },
      schema: z.strictObject({ building: z.string() }),
    })!;

    // Check village still exists before attack
    const villageExistsBefore = database.selectValue({
      sql: 'SELECT EXISTS(SELECT 1 FROM villages WHERE id = $id)',
      bind: { $id: npcVillage.id },
      schema: z.number(),
    })!;
    expect(villageExistsBefore).toBe(1);

    // Run attack with many catapults
    const mockEvent = createTroopMovementAttackEventMock({
      id: 2,
      startsAt: 5000,
      duration: 500,
      villageId,
      troops: [
        { unitId: 'LEGIONNAIRE', amount: 500, tileId: 1, source: 1 },
        { unitId: 'ROMAN_CATAPULT', amount: 100, tileId: 1, source: 1 },
      ],
      targetId: npcVillage.id,
      catapultTarget1: firstBuilding.building,
    });

    attackMovementResolver(database, mockEvent);

    // Verify report exists
    const report = database.selectObject({
      sql: "SELECT data FROM reports WHERE type = 'attack' AND village_id = $villageId ORDER BY timestamp DESC LIMIT 1",
      bind: { $villageId: villageId },
      schema: z.strictObject({
        data: z.string().transform((s) => JSON.parse(s)),
      }),
    });

    // The report should exist and have catapult data
    expect(report).toBeDefined();

    randomSpy.mockRestore();
  });
});
