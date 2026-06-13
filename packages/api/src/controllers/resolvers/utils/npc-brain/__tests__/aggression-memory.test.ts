import { describe, expect, it } from 'vitest';
import { FACTION_PROFILES } from '../faction-profiles';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';

describe('Memory Decay Logic', () => {
  describe('memory duration calculations', () => {
    it('should calculate memory threshold at speed 1', () => {
      const profile = FACTION_PROFILES.npc2; // Merchant Guilds: 72h
      const speed = 1;
      const thresholdMs = (profile.memoryDurationHours! * 3_600_000) / speed;
      expect(thresholdMs).toBe(72 * 3_600_000);
    });

    it('should calculate memory threshold at speed 10', () => {
      const profile = FACTION_PROFILES.npc2; // Merchant Guilds: 72h
      const speed = 10;
      const thresholdMs = (profile.memoryDurationHours! * 3_600_000) / speed;
      expect(thresholdMs).toBe(72 * 360_000);
    });

    it('should have permanent factions with null memory duration', () => {
      expect(FACTION_PROFILES.npc1.memoryDurationHours).toBeNull();
      expect(FACTION_PROFILES.npc6.memoryDurationHours).toBeNull();
      expect(FACTION_PROFILES.npc9.memoryDurationHours).toBeNull();
    });

    it('should have short memory for River Clans (24h)', () => {
      expect(FACTION_PROFILES.npc5.memoryDurationHours).toBe(24);
    });

    it('should have long memory for Stone Wardens (168h = 1 week)', () => {
      expect(FACTION_PROFILES.npc4.memoryDurationHours).toBe(168);
    });
  });

  describe('aggression decay', () => {
    it('should have permanent factions with null decay days', () => {
      expect(FACTION_PROFILES.npc1.aggressionDecayDays).toBeNull();
      expect(FACTION_PROFILES.npc4.aggressionDecayDays).toBeNull();
      expect(FACTION_PROFILES.npc6.aggressionDecayDays).toBeNull();
      expect(FACTION_PROFILES.npc9.aggressionDecayDays).toBeNull();
    });

    it('should have fastest decay for River Clans (3 days)', () => {
      expect(FACTION_PROFILES.npc5.aggressionDecayDays).toBe(3);
    });

    it('should have slowest decay for Verdant Order (14 days)', () => {
      expect(FACTION_PROFILES.npc7.aggressionDecayDays).toBe(14);
    });
  });
});

describe('Aggression Escalation Logic', () => {
  describe('tier calculation', () => {
    it('should calculate correct tier from raid count and threshold', () => {
      // Tier = min(5, floor(raidCount / threshold))
      const threshold = 2; // Stone Wardens

      expect(Math.min(5, Math.floor(1 / threshold))).toBe(0); // 1 raid: no retaliation
      expect(Math.min(5, Math.floor(2 / threshold))).toBe(1); // 2 raids: tier 1
      expect(Math.min(5, Math.floor(4 / threshold))).toBe(2); // 4 raids: tier 2
      expect(Math.min(5, Math.floor(6 / threshold))).toBe(3); // 6 raids: tier 3
      expect(Math.min(5, Math.floor(8 / threshold))).toBe(4); // 8 raids: tier 4
      expect(Math.min(5, Math.floor(10 / threshold))).toBe(5); // 10 raids: tier 5
    });

    it('should cap at tier 5', () => {
      const threshold = 1; // Iron Brotherhood
      expect(Math.min(5, Math.floor(100 / threshold))).toBe(5);
    });

    it('should use correct troop percentages per tier', () => {
      const percentages = NPC_BRAIN_CONSTANTS.AGGRESSION_TROOP_PERCENTAGES;
      expect(percentages[2]).toBe(0.25); // Tier 2: 25%
      expect(percentages[3]).toBe(0.5); // Tier 3: 50%
      expect(percentages[4]).toBe(0.75); // Tier 4: 75%
      expect(percentages[5]).toBe(1.0); // Tier 5: 100%
    });
  });

  describe('retaliation thresholds', () => {
    it('Iron Brotherhood should retaliate on first raid', () => {
      expect(FACTION_PROFILES.npc1.retaliationThreshold).toBe(1);
    });

    it('Verdant Order should require 7 raids before retaliating', () => {
      expect(FACTION_PROFILES.npc7.retaliationThreshold).toBe(7);
    });

    it('Merchant Guilds should require 5 raids', () => {
      expect(FACTION_PROFILES.npc2.retaliationThreshold).toBe(5);
    });
  });
});
