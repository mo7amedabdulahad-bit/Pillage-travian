import { describe, expect, it } from 'vitest';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';
import { getNpcTroopMultiplier } from '../world-threat-level';

describe('World Threat Level', () => {
  describe('getNpcTroopMultiplier', () => {
    it('should return minimum multiplier at threat 0', () => {
      const multiplier = getNpcTroopMultiplier(0);
      expect(multiplier).toBe(NPC_BRAIN_CONSTANTS.NPC_TROOP_MULTIPLIER_MIN);
    });

    it('should return maximum multiplier at threat 100', () => {
      const multiplier = getNpcTroopMultiplier(100);
      expect(multiplier).toBe(NPC_BRAIN_CONSTANTS.NPC_TROOP_MULTIPLIER_MAX);
    });

    it('should scale linearly', () => {
      const at50 = getNpcTroopMultiplier(50);
      const expected =
        NPC_BRAIN_CONSTANTS.NPC_TROOP_MULTIPLIER_MIN +
        (50 / 100) *
          (NPC_BRAIN_CONSTANTS.NPC_TROOP_MULTIPLIER_MAX -
            NPC_BRAIN_CONSTANTS.NPC_TROOP_MULTIPLIER_MIN);
      expect(at50).toBeCloseTo(expected, 5);
    });

    it('should return 0.2 at threat 0 (20% base troops)', () => {
      expect(getNpcTroopMultiplier(0)).toBe(0.2);
    });

    it('should return 2.0 at threat 100 (200% base troops)', () => {
      expect(getNpcTroopMultiplier(100)).toBe(2.0);
    });

    it('should return 1.1 at threat 50 (110% base troops)', () => {
      expect(getNpcTroopMultiplier(50)).toBeCloseTo(1.1, 5);
    });

    it('should clamp to valid range', () => {
      const low = getNpcTroopMultiplier(-10);
      const high = getNpcTroopMultiplier(200);
      expect(low).toBeGreaterThanOrEqual(
        NPC_BRAIN_CONSTANTS.NPC_TROOP_MULTIPLIER_MIN,
      );
      expect(high).toBeLessThanOrEqual(
        NPC_BRAIN_CONSTANTS.NPC_TROOP_MULTIPLIER_MAX,
      );
    });
  });
});
