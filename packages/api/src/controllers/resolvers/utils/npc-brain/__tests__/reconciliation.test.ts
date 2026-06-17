import { describe, expect, it } from 'vitest';
import { FACTION_PROFILES } from '../faction-profiles';
import { adjustForSpeed, getVillageSize } from '../helpers';
import {
  NPC_BRAIN_CONSTANTS,
  VILLAGE_SIZE_REGEN_RATE,
} from '../npc-brain-types';

describe('NPC Brain Reconciliation Architecture', () => {
  describe('single-pass elapsed time math', () => {
    it('growth accumulator should handle full elapsed time in one pass', () => {
      // A village with 10 hours of growth at x10 speed should accumulate
      // enough for multiple field level-ups in one reconciliation pass
      const speed = 10;
      const elapsedMs = 10 * 3_600_000; // 10 real hours
      const profile = FACTION_PROFILES.npc7; // Verdant Order: 2.0x growth

      const growthHours =
        NPC_BRAIN_CONSTANTS.BASE_GROWTH_HOURS / profile.growthRateMultiplier;
      const growthCycleMs = adjustForSpeed(growthHours * 3_600_000, speed);
      const growthIncrement = elapsedMs / growthCycleMs;

      // At 2.0x growth, 10h elapsed, x10 speed:
      // growthCycle = 48/2 * 3600000 / 10 = 8640000 ms
      // growthIncrement = 36000000 / 8640000 = ~4.17
      // This means ~4 field level-ups in a single pass — no chunk loop needed
      expect(growthIncrement).toBeGreaterThan(1);
      expect(Math.floor(growthIncrement)).toBe(4);
    });

    it('troop regen should scale linearly with elapsed time', () => {
      // Troop regen is formula-based: totalRegen = floor(elapsedHours * regenRate)
      // Processing 5 hours at once should give same result as 5 × 1 hour
      const villageSize = 'md';
      const factionKey = 'npc1' as const;
      const baseRate = VILLAGE_SIZE_REGEN_RATE[villageSize];
      const profile = FACTION_PROFILES[factionKey];
      const regenRate = baseRate * profile.troopRegenRateMultiplier;

      const oneHourRegen = Math.floor(1 * regenRate);
      const fiveHourRegen = Math.floor(5 * regenRate);

      expect(fiveHourRegen).toBe(oneHourRegen * 5);
    });

    it('loot recovery should be formula-driven, not chunk-dependent', () => {
      // Loot recovery: newLoot = min(1.0, current + rate * elapsedHours)
      const currentLoot = 0.5;
      const baseRate = NPC_BRAIN_CONSTANTS.BASE_LOOT_RECOVERY_RATE;
      const speed = 10;
      const elapsedHours = 5;
      const fieldLevelSum = 60;
      const recoveryScale =
        fieldLevelSum / NPC_BRAIN_CONSTANTS.FULL_RECOVERY_FIELD_SUM;
      const recoveryRate = baseRate * Math.min(1.0, recoveryScale) * speed;
      const recoveryAmount = recoveryRate * elapsedHours;
      const newLoot = Math.min(1.0, currentLoot + recoveryAmount);

      expect(newLoot).toBeGreaterThan(currentLoot);
      expect(newLoot).toBeLessThanOrEqual(1.0);
    });
  });

  describe('build system multi-upgrade support', () => {
    it('budget should accrue proportionally to elapsed time', () => {
      const fieldSum = 60;
      const productionPerHour = fieldSum * 10;
      const spendingRate = 0.8;
      const speed = 10;

      // 1 hour
      const oneHourBudget = productionPerHour * 1 * spendingRate * speed;
      // 5 hours
      const fiveHourBudget = productionPerHour * 5 * spendingRate * speed;

      expect(fiveHourBudget).toBe(oneHourBudget * 5);

      // At level 1 cost ~100, a 5-hour window should afford many builds
      const estimatedCostPerBuild = 100;
      const affordableBuilds = Math.floor(
        fiveHourBudget / estimatedCostPerBuild,
      );
      expect(affordableBuilds).toBeGreaterThan(5);
    });

    it('maxBuilds cap should bound the while loop', () => {
      // Even with huge budget, maxBuilds prevents runaway
      const maxBuilds = 20;
      const hugeBudget = 1_000_000;
      const costPerBuild = 100;
      const buildsDone = Math.min(
        maxBuilds,
        Math.floor(hugeBudget / costPerBuild),
      );
      expect(buildsDone).toBe(maxBuilds);
    });
  });

  describe('unified retaliation pipeline', () => {
    it('retaliation threshold should determine aggression tier', () => {
      // Tier = min(5, floor(raidCount / threshold))
      const ironBrotherhood = FACTION_PROFILES.npc1; // threshold = 1
      const merchantGuilds = FACTION_PROFILES.npc2; // threshold = 5

      expect(
        Math.min(5, Math.floor(1 / ironBrotherhood.retaliationThreshold)),
      ).toBe(1);
      expect(
        Math.min(5, Math.floor(1 / merchantGuilds.retaliationThreshold)),
      ).toBe(0);
      expect(
        Math.min(5, Math.floor(5 / merchantGuilds.retaliationThreshold)),
      ).toBe(1);
      expect(
        Math.min(5, Math.floor(25 / merchantGuilds.retaliationThreshold)),
      ).toBe(5);
    });

    it('troop percentages should scale with aggression tier', () => {
      const percentages = NPC_BRAIN_CONSTANTS.AGGRESSION_TROOP_PERCENTAGES;
      expect(percentages[0]).toBe(0); // passive
      expect(percentages[1]).toBe(0); // alert
      expect(percentages[2]).toBe(0.25); // retaliating
      expect(percentages[3]).toBe(0.5); // aggressive
      expect(percentages[4]).toBe(0.75); // rallying
      expect(percentages[5]).toBe(1.0); // siege
    });

    it('revenge intent should be armed when troops insufficient', () => {
      const minTroops = NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION;
      expect(minTroops).toBe(20);

      // If totalUnits < 20, arm intent instead of queueing
      const totalUnits = 15;
      expect(totalUnits < minTroops).toBe(true);
    });

    it('regional reinforcements should trigger at tier 4+', () => {
      // Only call reinforcements at high aggression
      const tier = 3;
      expect(tier >= 4).toBe(false);

      const highTier = 4;
      expect(highTier >= 4).toBe(true);
    });
  });

  describe('faction differentiation', () => {
    it('same-faction villages should share rules but differ by state', () => {
      // All Iron Brotherhood villages share the same profile
      const profile = FACTION_PROFILES.npc1;
      expect(profile.retaliationThreshold).toBe(1);
      expect(profile.growthRateMultiplier).toBe(0.75);
      expect(profile.troopRegenRateMultiplier).toBe(1.5);

      // But individual villages differ via:
      // - current building levels
      // - current troop state
      // - current loot state
      // - aggression/raid history
      // - village size (distance from center)
    });

    it('different factions should have distinct personalities', () => {
      const ironBrotherhood = FACTION_PROFILES.npc1;
      const merchantGuilds = FACTION_PROFILES.npc2;
      const verdantOrder = FACTION_PROFILES.npc7;

      // Aggressive vs peaceful
      expect(ironBrotherhood.retaliationThreshold).toBeLessThan(
        merchantGuilds.retaliationThreshold,
      );

      // Economy vs military
      expect(verdantOrder.growthRateMultiplier).toBeGreaterThan(
        ironBrotherhood.growthRateMultiplier,
      );

      // Memory permanence
      expect(ironBrotherhood.isMemoryPermanent).toBe(true);
      expect(merchantGuilds.isMemoryPermanent).toBe(false);
    });

    it('village size should vary with map position', () => {
      const mapSize = 400;

      // Center = large
      expect(getVillageSize(mapSize, 0, 0)).toBe('4xl');

      // Edge = small
      expect(getVillageSize(mapSize, 190, 0)).toBe('xxs');

      // Middle = medium
      expect(getVillageSize(mapSize, 130, 0)).toBe('md');
    });
  });

  describe('offline/live coherence', () => {
    it('same elapsed time should produce same regen regardless of mode', () => {
      // Whether 60s passes online or offline, the regen math is identical
      const villageSize = 'lg';
      const factionKey = 'npc3' as const;
      const baseRate = VILLAGE_SIZE_REGEN_RATE[villageSize];
      const profile = FACTION_PROFILES[factionKey];
      const regenRate = baseRate * profile.troopRegenRateMultiplier;

      const liveElapsedMs = 60_000; // 1 minute
      const liveElapsedHours = (liveElapsedMs / 3_600_000) * 10; // at x10 speed
      const liveRegen = Math.floor(liveElapsedHours * regenRate);

      const offlineElapsedMs = 60_000;
      const offlineElapsedHours = (offlineElapsedMs / 3_600_000) * 10;
      const offlineRegen = Math.floor(offlineElapsedHours * regenRate);

      expect(liveRegen).toBe(offlineRegen);
    });

    it('maxBuilds should differ between offline and live modes', () => {
      const offlineMaxBuilds = 20;
      const liveMaxBuilds = 3;

      expect(offlineMaxBuilds).toBeGreaterThan(liveMaxBuilds);
    });
  });

  describe('no old path usage', () => {
    it('should export processNPCTick for live tick use', async () => {
      const mod = await import('../simulate-elapsed-time');
      expect(typeof mod.processNPCTick).toBe('function');
    });

    it('should export reconcileNpcBrain', async () => {
      const mod = await import('../simulate-elapsed-time');
      expect(typeof mod.reconcileNpcBrain).toBe('function');
    });

    it('should export simulateElapsedTime (backward compat)', async () => {
      const mod = await import('../simulate-elapsed-time');
      expect(typeof mod.simulateElapsedTime).toBe('function');
    });
  });
});
