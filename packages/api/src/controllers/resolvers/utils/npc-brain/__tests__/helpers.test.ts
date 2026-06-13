import { describe, expect, it } from 'vitest';
import {
  adjustForSpeed,
  formatDuration,
  getVillageSize,
  mapDistance,
  scaleTroops,
} from '../helpers';
import { NPC_BRAIN_CONSTANTS } from '../npc-brain-types';

describe('NPC Brain Helpers', () => {
  describe('adjustForSpeed', () => {
    it('should return base value at speed 1', () => {
      expect(adjustForSpeed(1000, 1)).toBe(1000);
    });

    it('should divide by speed', () => {
      expect(adjustForSpeed(1000, 5)).toBe(200);
      expect(adjustForSpeed(3600000, 10)).toBe(360000);
    });

    it('should handle speed 10', () => {
      const base = 48 * 3600000; // 48 hours
      expect(adjustForSpeed(base, 10)).toBe(base / 10);
    });
  });

  describe('mapDistance', () => {
    it('should calculate distance between two points', () => {
      expect(mapDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('should return 0 for same point', () => {
      expect(mapDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });

    it('should be symmetric', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 4, y: 6 };
      expect(mapDistance(a, b)).toBe(mapDistance(b, a));
    });
  });

  describe('formatDuration', () => {
    it('should format minutes', () => {
      expect(formatDuration(300000)).toBe('5m');
    });

    it('should format hours', () => {
      expect(formatDuration(3600000)).toBe('1h');
      expect(formatDuration(7200000)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(5400000)).toBe('1h 30m');
    });

    it('should format days', () => {
      expect(formatDuration(86400000)).toBe('1 day');
      expect(formatDuration(172800000)).toBe('2 days');
    });

    it('should format days and hours', () => {
      expect(formatDuration(90000000)).toBe('1 day 1h');
    });
  });

  describe('scaleTroops', () => {
    it('should scale troops by percentage', () => {
      const troops = { LEGIONNAIRE: 100, PRAETORIAN: 50 };
      const result = scaleTroops(troops, 0.5);
      expect(result.LEGIONNAIRE).toBe(50);
      expect(result.PRAETORIAN).toBe(25);
    });

    it('should remove zero-count troops', () => {
      const troops = { LEGIONNAIRE: 1, PRAETORIAN: 100 };
      const result = scaleTroops(troops, 0.1);
      expect(result.LEGIONNAIRE).toBeUndefined();
      expect(result.PRAETORIAN).toBe(10);
    });

    it('should handle empty troops', () => {
      expect(scaleTroops({}, 0.5)).toEqual({});
    });
  });

  describe('getVillageSize', () => {
    it('should return xxs for edge of map', () => {
      expect(getVillageSize(190, 0, 400)).toBe('xxs');
    });

    it('should return 4xl for center of map', () => {
      expect(getVillageSize(0, 0, 400)).toBe('4xl');
    });

    it('should return md for middle distance', () => {
      expect(getVillageSize(130, 0, 400)).toBe('md');
    });
  });
});

describe('NPC Brain Constants', () => {
  it('should have valid aggression troop percentages', () => {
    const percentages = NPC_BRAIN_CONSTANTS.AGGRESSION_TROOP_PERCENTAGES;
    expect(percentages).toHaveLength(6);
    expect(percentages[0]).toBe(0); // passive
    expect(percentages[1]).toBe(0); // alert
    expect(percentages[2]).toBe(0.25); // retaliating
    expect(percentages[3]).toBe(0.5); // aggressive
    expect(percentages[4]).toBe(0.75); // rallying
    expect(percentages[5]).toBe(1.0); // siege
  });

  it('should have reasonable threat multiplier range', () => {
    const { NPC_TROOP_MULTIPLIER_MIN, NPC_TROOP_MULTIPLIER_MAX } =
      NPC_BRAIN_CONSTANTS;
    expect(NPC_TROOP_MULTIPLIER_MIN).toBe(0.2);
    expect(NPC_TROOP_MULTIPLIER_MAX).toBe(2.0);
  });

  it('should have NPC max field level less than player max (20)', () => {
    expect(NPC_BRAIN_CONSTANTS.NPC_MAX_FIELD_LEVEL).toBeLessThan(20);
    expect(NPC_BRAIN_CONSTANTS.NPC_MAX_FIELD_LEVEL).toBe(15);
  });
});
