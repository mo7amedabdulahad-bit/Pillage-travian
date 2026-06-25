import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  grantConstructionPlan,
  hasConstructionPlan,
} from '../hero-controllers';
import { processNpcWonderCompetition } from '../resolvers/utils/npc-brain/subsystems/npc-wonder-competition';
import { saveNpcWonderMilestoneReport } from '../resolvers/utils/reports';
import {
  endServer,
  worldWonderUpgradeResolver,
} from '../resolvers/world-wonder-resolvers';
import {
  getEventCost,
  getEventDuration,
  validateEventCreationPrerequisites,
} from '../utils/events';

const getAnyVillageId = (
  database: ReturnType<typeof prepareTestDatabase> extends Promise<infer T>
    ? T
    : never,
) => {
  return (database as any).selectValue({
    sql: 'SELECT id FROM villages LIMIT 1',
    schema: z.number(),
  })!;
};

const createMockWorldWonderEvent = (
  overrides: Partial<{
    id: number;
    villageId: number;
    startsAt: number;
    duration: number;
    resolvesAt: number;
    targetLevel: number;
    ownerPlayerId: number | null;
    ownerFactionId: string;
  }> = {},
) => ({
  id: 99_001,
  type: 'worldWonderUpgrade' as const,
  villageId: 1,
  startsAt: Date.now(),
  duration: 3600_000,
  resolvesAt: Date.now() + 3600_000,
  targetLevel: 1,
  ownerPlayerId: PLAYER_ID,
  ownerFactionId: 'player',
  ...overrides,
});

const insertWorldWonder = (database: any, villageId: number, level = 0) => {
  database.exec({
    sql: `
      INSERT INTO world_wonders (village_id, owner_player_id, owner_faction_id, current_level, started_at)
      VALUES ($villageId, $playerId, 'player', $level, $startedAt)
    `,
    bind: {
      $villageId: villageId,
      $playerId: PLAYER_ID,
      $level: level,
      $startedAt: Date.now(),
    },
  });
  database.exec({
    sql: 'UPDATE villages SET is_world_wonder_village = 1, world_wonder_level = $level WHERE id = $villageId',
    bind: { $level: level, $villageId: villageId },
  });
};

describe('worldWonderUpgradeResolver', () => {
  test('at level 1: updates world_wonders and villages, consumes construction plan', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 0);

    const heroRow = database.selectObject({
      sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
      bind: { $playerId: PLAYER_ID },
      schema: z.strictObject({ id: z.number() }),
    })!;
    grantConstructionPlan(database, heroRow.id);

    worldWonderUpgradeResolver(database, {
      id: 1,
      type: 'worldWonderUpgrade',
      villageId,
      startsAt: Date.now(),
      duration: 1000,
      resolvesAt: Date.now(),
      targetLevel: 1,
      ownerPlayerId: PLAYER_ID,
      ownerFactionId: 'player',
    });

    const ww = database.selectObject({
      sql: 'SELECT current_level FROM world_wonders WHERE village_id = $villageId',
      bind: { $villageId: villageId },
      schema: z.strictObject({ current_level: z.number() }),
    })!;
    expect(ww.current_level).toBe(1);

    const village = database.selectObject({
      sql: 'SELECT world_wonder_level FROM villages WHERE id = $villageId',
      bind: { $villageId: villageId },
      schema: z.strictObject({ world_wonder_level: z.number() }),
    })!;
    expect(village.world_wonder_level).toBe(1);

    expect(hasConstructionPlan(database, heroRow.id)).toBe(false);
  });

  test('at level 20: calls endServer and sets winner', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 19);

    worldWonderUpgradeResolver(database, {
      id: 2,
      type: 'worldWonderUpgrade',
      villageId,
      startsAt: Date.now(),
      duration: 1000,
      resolvesAt: Date.now(),
      targetLevel: 20,
      ownerPlayerId: PLAYER_ID,
      ownerFactionId: 'player',
    });

    const server = database.selectObject({
      sql: 'SELECT ended_at, winner_player_id, winner_type FROM servers LIMIT 1',
      schema: z.object({
        ended_at: z.number().nullable(),
        winner_player_id: z.number().nullable(),
        winner_type: z.string().nullable(),
      }),
    })!;
    expect(server.ended_at).not.toBeNull();
    expect(server.winner_player_id).toBe(PLAYER_ID);
    expect(server.winner_type).toBe('player');
  });

  test('at level 20: creates server_end reports for all villages', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 19);

    worldWonderUpgradeResolver(database, {
      id: 3,
      type: 'worldWonderUpgrade',
      villageId,
      startsAt: Date.now(),
      duration: 1000,
      resolvesAt: Date.now(),
      targetLevel: 20,
      ownerPlayerId: PLAYER_ID,
      ownerFactionId: 'player',
    });

    const reportCount = database.selectValue({
      sql: "SELECT COUNT(*) FROM reports WHERE type = 'server_end'",
      schema: z.number(),
    })!;
    const villageCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM villages',
      schema: z.number(),
    })!;
    expect(reportCount).toBe(villageCount);
  });

  test('at level 5: does not consume plan or end server', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 4);

    const heroRow = database.selectObject({
      sql: 'SELECT id FROM heroes WHERE player_id = $playerId',
      bind: { $playerId: PLAYER_ID },
      schema: z.strictObject({ id: z.number() }),
    })!;
    grantConstructionPlan(database, heroRow.id);

    worldWonderUpgradeResolver(database, {
      id: 4,
      type: 'worldWonderUpgrade',
      villageId,
      startsAt: Date.now(),
      duration: 1000,
      resolvesAt: Date.now(),
      targetLevel: 5,
      ownerPlayerId: PLAYER_ID,
      ownerFactionId: 'player',
    });

    expect(hasConstructionPlan(database, heroRow.id)).toBe(true);

    const server = database.selectValue({
      sql: 'SELECT ended_at FROM servers LIMIT 1',
      schema: z.number().nullable(),
    });
    expect(server).toBeNull();
  });
});

describe('endServer', () => {
  test('sets ended_at and winner fields on servers table', async () => {
    const database = await prepareTestDatabase();
    const timestamp = Date.now();

    endServer(database, 'player', PLAYER_ID, timestamp);

    const server = database.selectObject({
      sql: 'SELECT ended_at, winner_player_id, winner_type, win_condition_met_at FROM servers LIMIT 1',
      schema: z.object({
        ended_at: z.number().nullable(),
        winner_player_id: z.number().nullable(),
        winner_type: z.string().nullable(),
        win_condition_met_at: z.number().nullable(),
      }),
    })!;
    expect(server.ended_at).toBe(timestamp);
    expect(server.winner_player_id).toBe(PLAYER_ID);
    expect(server.winner_type).toBe('player');
    expect(server.win_condition_met_at).toBe(timestamp);
  });

  test('is idempotent: does not re-run if already ended', async () => {
    const database = await prepareTestDatabase();
    const timestamp1 = 1000;
    const timestamp2 = 2000;

    endServer(database, 'player', PLAYER_ID, timestamp1);

    const reportCountAfterFirst = database.selectValue({
      sql: "SELECT COUNT(*) FROM reports WHERE type = 'server_end'",
      schema: z.number(),
    })!;

    endServer(database, 'player', PLAYER_ID, timestamp2);

    const server = database.selectValue({
      sql: 'SELECT ended_at FROM servers LIMIT 1',
      schema: z.number(),
    })!;
    expect(server).toBe(timestamp1);

    const reportCountAfterSecond = database.selectValue({
      sql: "SELECT COUNT(*) FROM reports WHERE type = 'server_end'",
      schema: z.number(),
    })!;
    expect(reportCountAfterSecond).toBe(reportCountAfterFirst);
  });

  test('creates server_end reports with correct data', async () => {
    const database = await prepareTestDatabase();
    const timestamp = Date.now();

    endServer(database, 'natars', null, timestamp);

    const report = database.selectObject({
      sql: "SELECT type, data FROM reports WHERE type = 'server_end' LIMIT 1",
      schema: z.strictObject({ type: z.string(), data: z.string() }),
    })!;
    expect(report.type).toBe('server_end');
    const data = JSON.parse(report.data);
    expect(data.winnerType).toBe('natars');
    expect(data.winnerPlayerId).toBeNull();
    expect(data.timestamp).toBe(timestamp);
  });
});

describe('validateEventCreationPrerequisites - worldWonderUpgrade', () => {
  test('throws if target level exceeds 20', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);
    insertWorldWonder(database, villageId, 19);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createMockWorldWonderEvent({ villageId, targetLevel: 21 }),
      ),
    ).toThrow('World Wonder level cannot exceed 20');
  });

  test('throws if level skip (not currentLevel + 1)', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);
    insertWorldWonder(database, villageId, 3);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createMockWorldWonderEvent({ villageId, targetLevel: 5 }),
      ),
    ).toThrow('World Wonder must be upgraded one level at a time');
  });

  test('passes for valid level upgrade', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);
    insertWorldWonder(database, villageId, 4);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createMockWorldWonderEvent({ villageId, targetLevel: 5 }),
      ),
    ).not.toThrow();
  });

  test('passes for level 1 when world wonder starts at level 0', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);
    insertWorldWonder(database, villageId, 0);

    expect(() =>
      validateEventCreationPrerequisites(
        database,
        createMockWorldWonderEvent({ villageId, targetLevel: 1 }),
      ),
    ).not.toThrow();
  });
});

describe('getEventCost - worldWonderUpgrade', () => {
  test('returns correct cost for level 1', async () => {
    const database = await prepareTestDatabase();
    const cost = getEventCost(
      database,
      createMockWorldWonderEvent({ targetLevel: 1 }),
    );
    expect(cost).toHaveLength(4);
    expect(cost.every((c) => c > 0)).toBe(true);
  });

  test('cost increases with level', async () => {
    const database = await prepareTestDatabase();
    const cost1 = getEventCost(
      database,
      createMockWorldWonderEvent({ targetLevel: 1 }),
    );
    const cost5 = getEventCost(
      database,
      createMockWorldWonderEvent({ targetLevel: 5 }),
    );
    expect(cost5[0]).toBeGreaterThan(cost1[0]);
  });
});

describe('getEventDuration - worldWonderUpgrade', () => {
  test('returns a positive duration', async () => {
    const database = await prepareTestDatabase();
    const duration = getEventDuration(
      database,
      createMockWorldWonderEvent({ targetLevel: 1 }),
    );
    expect(duration).toBeGreaterThan(0);
  });

  test('duration increases with level', async () => {
    const database = await prepareTestDatabase();
    const duration1 = getEventDuration(
      database,
      createMockWorldWonderEvent({ targetLevel: 1 }),
    );
    const duration5 = getEventDuration(
      database,
      createMockWorldWonderEvent({ targetLevel: 5 }),
    );
    expect(duration5).toBeGreaterThan(duration1);
  });
});

describe('saveNpcWonderMilestoneReport', () => {
  test('creates a milestone report with correct type and data', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 5);

    saveNpcWonderMilestoneReport(database, 'npc1', 'upgrade', 10);

    const report = database.selectObject({
      sql: "SELECT type, data FROM reports WHERE type = 'npc_wonder_milestone' LIMIT 1",
      schema: z.strictObject({ type: z.string(), data: z.string() }),
    })!;
    expect(report.type).toBe('npc_wonder_milestone');
    const data = JSON.parse(report.data);
    expect(data.factionKey).toBe('npc1');
    expect(data.milestoneType).toBe('upgrade');
    expect(data.level).toBe(10);
  });

  test('creates a STARTED milestone report', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 0);

    saveNpcWonderMilestoneReport(database, 'npc1', 'started');

    const report = database.selectObject({
      sql: "SELECT data FROM reports WHERE type = 'npc_wonder_milestone' LIMIT 1",
      schema: z.strictObject({ data: z.string() }),
    })!;
    const data = JSON.parse(report.data);
    expect(data.milestoneType).toBe('started');
  });

  test('creates a no_attack milestone report', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 14);

    saveNpcWonderMilestoneReport(database, 'npc1', 'no_attack', 15);

    const report = database.selectObject({
      sql: "SELECT data FROM reports WHERE type = 'npc_wonder_milestone' LIMIT 1",
      schema: z.strictObject({ data: z.string() }),
    })!;
    const data = JSON.parse(report.data);
    expect(data.milestoneType).toBe('no_attack');
    expect(data.level).toBe(15);
  });

  test('creates a finished milestone report', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 19);

    saveNpcWonderMilestoneReport(database, 'npc1', 'finished', 20);

    const report = database.selectObject({
      sql: "SELECT data FROM reports WHERE type = 'npc_wonder_milestone' LIMIT 1",
      schema: z.strictObject({ data: z.string() }),
    })!;
    const data = JSON.parse(report.data);
    expect(data.milestoneType).toBe('finished');
    expect(data.level).toBe(20);
  });
});

describe('worldWonderUpgradeResolver - milestone reports', () => {
  test('at level 10: creates an upgrade milestone report', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 9);

    worldWonderUpgradeResolver(database, {
      id: 10,
      type: 'worldWonderUpgrade',
      villageId,
      startsAt: Date.now(),
      duration: 1000,
      resolvesAt: Date.now(),
      targetLevel: 10,
      ownerPlayerId: PLAYER_ID,
      ownerFactionId: 'npc1',
    });

    const report = database.selectObject({
      sql: "SELECT data FROM reports WHERE type = 'npc_wonder_milestone' LIMIT 1",
      schema: z.strictObject({ data: z.string() }),
    })!;
    const data = JSON.parse(report.data);
    expect(data.milestoneType).toBe('upgrade');
    expect(data.level).toBe(10);
  });

  test('at level 15: creates a no_attack milestone report', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 14);

    worldWonderUpgradeResolver(database, {
      id: 11,
      type: 'worldWonderUpgrade',
      villageId,
      startsAt: Date.now(),
      duration: 1000,
      resolvesAt: Date.now(),
      targetLevel: 15,
      ownerPlayerId: PLAYER_ID,
      ownerFactionId: 'npc1',
    });

    const report = database.selectObject({
      sql: "SELECT data FROM reports WHERE type = 'npc_wonder_milestone' LIMIT 1",
      schema: z.strictObject({ data: z.string() }),
    })!;
    const data = JSON.parse(report.data);
    expect(data.milestoneType).toBe('no_attack');
    expect(data.level).toBe(15);
  });

  test('at level 20: creates a finished milestone report', async () => {
    const database = await prepareTestDatabase();
    const villageId = getAnyVillageId(database);

    insertWorldWonder(database, villageId, 19);

    worldWonderUpgradeResolver(database, {
      id: 12,
      type: 'worldWonderUpgrade',
      villageId,
      startsAt: Date.now(),
      duration: 1000,
      resolvesAt: Date.now(),
      targetLevel: 20,
      ownerPlayerId: PLAYER_ID,
      ownerFactionId: 'player',
    });

    const milestoneReport = database.selectObject({
      sql: "SELECT data FROM reports WHERE type = 'npc_wonder_milestone' LIMIT 1",
      schema: z.strictObject({ data: z.string() }),
    })!;
    const milestoneData = JSON.parse(milestoneReport.data);
    expect(milestoneData.milestoneType).toBe('finished');
    expect(milestoneData.level).toBe(20);
  });
});

describe('processNpcWonderCompetition', () => {
  test('does not run if server has ended', async () => {
    const database = await prepareTestDatabase();
    const timestamp = Date.now();

    endServer(database, 'player', PLAYER_ID, timestamp);

    // Should not throw
    processNpcWonderCompetition(database, timestamp, 1);
  });

  test('does not run during warmup period', async () => {
    const database = await prepareTestDatabase();
    const serverCreated = database.selectValue({
      sql: 'SELECT created_at FROM servers LIMIT 1',
      schema: z.number(),
    })!;

    // Call immediately after server creation (within warmup)
    processNpcWonderCompetition(database, serverCreated + 1000, 1);

    // No plans should have been captured
    const plansHeld = database.selectValue({
      sql: 'SELECT COUNT(*) FROM npc_village_state WHERE holds_plan = 1',
      schema: z.number(),
    })!;
    expect(plansHeld).toBe(0);
  });
});
