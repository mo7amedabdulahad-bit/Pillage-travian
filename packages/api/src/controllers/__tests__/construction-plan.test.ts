import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  CONSTRUCTION_PLAN_ITEM_ID,
  consumeConstructionPlan,
  grantConstructionPlan,
  hasConstructionPlan,
} from '../hero-controllers';

const getHeroId = (
  database: ReturnType<typeof prepareTestDatabase> extends Promise<infer T>
    ? T
    : never,
) => {
  return (database as any).selectValue({
    sql: 'SELECT id FROM heroes LIMIT 1',
    schema: z.number(),
  })!;
};

describe('Construction Plan helpers', () => {
  test('hasConstructionPlan returns false when hero has no plan', async () => {
    const database = await prepareTestDatabase();
    const heroId = getHeroId(database);
    expect(hasConstructionPlan(database, heroId)).toBe(false);
  });

  test('grantConstructionPlan grants a plan and returns true', async () => {
    const database = await prepareTestDatabase();
    const heroId = getHeroId(database);
    const result = grantConstructionPlan(database, heroId);
    expect(result).toBe(true);
    expect(hasConstructionPlan(database, heroId)).toBe(true);
  });

  test('grantConstructionPlan refuses if hero already holds a plan', async () => {
    const database = await prepareTestDatabase();
    const heroId = getHeroId(database);
    grantConstructionPlan(database, heroId);
    const secondAttempt = grantConstructionPlan(database, heroId);
    expect(secondAttempt).toBe(false);
    expect(hasConstructionPlan(database, heroId)).toBe(true);
  });

  test('consumeConstructionPlan removes the plan', async () => {
    const database = await prepareTestDatabase();
    const heroId = getHeroId(database);
    grantConstructionPlan(database, heroId);
    expect(hasConstructionPlan(database, heroId)).toBe(true);
    consumeConstructionPlan(database, heroId);
    expect(hasConstructionPlan(database, heroId)).toBe(false);
  });

  test('CONSTRUCTION_PLAN_ITEM_ID is 200', () => {
    expect(CONSTRUCTION_PLAN_ITEM_ID).toBe(200);
  });
});
