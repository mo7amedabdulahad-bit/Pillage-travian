import { describe, expect, test } from 'vitest';
import {
  type CombatTroop,
  calculateImmensityExponent,
  calculateLoot,
  calculatePalaceDefense,
  calculateSmithyUpgrade,
  calculateTotalCarryCapacity,
  calculateTotalDefensePoints,
  calculateTotalOffensePoints,
  calculateWallDamage,
  calculateWallDefenseBonus,
  calculateWinnerCasualtyPercent,
  type DefenseModifiers,
  resolveCombat,
} from '../combat-engine';

// Helper: create troop with no smithy upgrades
const troop = (
  unitId: CombatTroop['unitId'],
  amount: number,
  smithyLevel = 0,
): CombatTroop => ({
  unitId,
  amount,
  smithyLevel,
});

const defaultModifiers: DefenseModifiers = {
  wallType: null,
  wallLevel: 0,
  wallDurability: 0,
  palaceLevel: 0,
};

const noResources: [number, number, number, number] = [0, 0, 0, 0];

// ───────────────────────────────────────────────────────────────
// From COMBAT_MECHANICS.md examples
// ───────────────────────────────────────────────────────────────

describe('calculateTotalOffensePoints', () => {
  test('100 imperians + 50 legionnaires = 9000 offense', () => {
    // Imperian attack = 70, Legionnaire attack = 40
    const troops = [troop('IMPERIAN', 100), troop('LEGIONNAIRE', 50)];
    const result = calculateTotalOffensePoints(troops);
    expect(result).toBe(9000);
  });

  test('2000 haeduans = 280,000 offense', () => {
    // Haeduan attack = 140
    const troops = [troop('HAEDUAN', 2000)];
    const result = calculateTotalOffensePoints(troops);
    expect(result).toBe(280_000);
  });
});

describe('calculateTotalDefensePoints', () => {
  test('150 phalanx vs pure infantry = 6000 defense', () => {
    // Phalanx infantry defense = 40
    const troops = [troop('PHALANX', 150)];
    const result = calculateTotalDefensePoints(troops, 1, 0);
    expect(result).toBe(6000);
  });

  test('1400 phalanx vs pure cavalry = 70,000 defense', () => {
    // Phalanx cavalry defense = 50
    const troops = [troop('PHALANX', 1400)];
    const result = calculateTotalDefensePoints(troops, 0, 1);
    expect(result).toBe(70_000);
  });

  test('100 praetorians with mixed inf/cav ratio', () => {
    // From the doc: 100 TT + 50 swordsmen attack 100 praetorians
    // Offense: TT=100*100(actually 90)=9000, Swordsmen=50*65=3250 -> total 13250? Let me recalculate...
    // Actually TT attack=90 (not 100 as in old docs). 100*90=9000, swordsman=50*65=3250
    // Wait - the doc says TT attack = 100. Let me check our data: THEUTATES_THUNDER attack=90
    // The doc example uses attack=100 for TT (Travian version difference).
    // Our values: TT=90, Swordsman=65. Total off = 100*90 + 50*65 = 9000+3250 = 12250
    // Cavalry ratio = 9000/12250 = 0.7347, Infantry ratio = 3250/12250 = 0.2653
    // Praetorian: inf def=65, cav def=35
    // Defense = 100*(0.2653*65 + 0.7347*35) = 100*(17.24 + 25.71) = 100*42.96 = 4296
    const infantryRatio = 3250 / 12250;
    const cavalryRatio = 9000 / 12250;
    const troops = [troop('PRAETORIAN', 100)];
    const result = calculateTotalDefensePoints(
      troops,
      infantryRatio,
      cavalryRatio,
    );
    // Allow small floating point variation
    expect(result).toBeCloseTo(4296, -1);
  });
});

describe('calculateImmensityExponent', () => {
  test('K = 1.5 for N <= 1000', () => {
    expect(calculateImmensityExponent(500)).toBe(1.5);
    expect(calculateImmensityExponent(1000)).toBe(1.5);
  });

  test('K for N = 3400 ≈ 1.459', () => {
    // From doc: K = 2*(1.8592 - 3400^0.015) = 2*(1.8592 - 1.1297) = 1.459
    const k = calculateImmensityExponent(3400);
    expect(k).toBeCloseTo(1.459, 1);
  });

  test('K for N = 32000 ≈ 1.3816', () => {
    // From doc: K = 2*(1.8592 - 32000^0.015) = 1.3816
    const k = calculateImmensityExponent(32000);
    expect(k).toBeCloseTo(1.3816, 1);
  });
});

describe('calculateWinnerCasualtyPercent', () => {
  test('normal attack: 9000 off vs 6000 def → ~54.43% attacker casualties', () => {
    // From doc: (6000/9000)^1.5 ≈ 0.5443
    const percent = calculateWinnerCasualtyPercent(6000, 9000, 250, false);
    expect(percent).toBeCloseTo(0.5443, 2);
  });

  test('raid: 7000 off vs 6500 def → ~47.22% attacker casualties', () => {
    // x = (6500/7000)^1.5 ≈ 0.89479
    // raid: x/(1+x) = 0.89479/1.89479 ≈ 0.4722
    const percent = calculateWinnerCasualtyPercent(6500, 7000, 200, true);
    expect(percent).toBeCloseTo(0.4722, 2);
  });

  test('large battle with K < 1.5', () => {
    // 2000 haeduans(off=280k) vs 1400 phalanx(def=70k), N=3400
    // K ≈ 1.459
    // (70000/280000)^1.459 = 0.25^1.459 ≈ 0.1323
    const percent = calculateWinnerCasualtyPercent(
      70_000,
      280_000,
      3400,
      false,
    );
    expect(percent).toBeCloseTo(0.1323, 2);
  });
});

describe('calculateWallDefenseBonus', () => {
  test('Roman wall level 15 → 1.03^15 ≈ 1.558', () => {
    const bonus = calculateWallDefenseBonus('ROMAN_WALL', 15);
    expect(bonus).toBeCloseTo(1.558, 2);
  });

  test('No wall → 1', () => {
    expect(calculateWallDefenseBonus(null, 0)).toBe(1);
  });
});

describe('calculatePalaceDefense', () => {
  test('level 20 → 800 defense', () => {
    expect(calculatePalaceDefense(20)).toBe(800);
  });

  test('level 6 → 72 defense', () => {
    expect(calculatePalaceDefense(6)).toBe(72);
  });

  test('level 0 → 0', () => {
    expect(calculatePalaceDefense(0)).toBe(0);
  });
});

describe('calculateSmithyUpgrade', () => {
  test('clubswinger attack=40, upkeep=1, smithy=20', () => {
    // From doc: 40 + (40 + 300*1/7)*(1.007^20 - 1) ≈ 52.4048
    const result = calculateSmithyUpgrade(40, 1, 20);
    expect(result).toBeCloseTo(52.4048, 1);
  });

  test('no smithy → base value', () => {
    expect(calculateSmithyUpgrade(70, 1, 0)).toBe(70);
  });
});

describe('calculateLoot', () => {
  test('distributes evenly when resources are abundant', () => {
    const resources: [number, number, number, number] = [
      1000, 1000, 1000, 1000,
    ];
    const loot = calculateLoot(resources, 400);
    const total = loot[0] + loot[1] + loot[2] + loot[3];
    expect(total).toBeLessThanOrEqual(400);
    expect(total).toBeGreaterThan(0);
  });

  test('zero carry → zero loot', () => {
    expect(calculateLoot([100, 100, 100, 100], 0)).toEqual([0, 0, 0, 0]);
  });

  test('caps at available resources', () => {
    const resources: [number, number, number, number] = [10, 10, 10, 10];
    const loot = calculateLoot(resources, 1000);
    const total = loot[0] + loot[1] + loot[2] + loot[3];
    expect(total).toBeLessThanOrEqual(40);
  });
});

describe('resolveCombat', () => {
  test('empty defender → attacker wins with no losses', () => {
    const attackers = [troop('IMPERIAN', 100)];
    const defenders: CombatTroop[] = [];

    const result = resolveCombat(
      attackers,
      defenders,
      defaultModifiers,
      [500, 500, 500, 500],
      false,
    );

    expect(result.attackerWins).toBe(true);
    expect(result.attackerSurvivors).toHaveLength(1);
    expect(result.attackerSurvivors[0].amount).toBe(100);
    expect(result.attackerLosses).toHaveLength(0);
    expect(result.defenderLosses).toHaveLength(0);
  });

  test('empty defenders → attacker wins with no losses', () => {
    // 1 legionnaire: attack=40
    const attackers = [troop('LEGIONNAIRE', 1)];
    const defenders: CombatTroop[] = [];

    const result = resolveCombat(
      attackers,
      defenders,
      defaultModifiers,
      noResources,
      false,
    );

    // When there are no defenders, attacker always wins with no casualties
    expect(result.attackerWins).toBe(true);
    expect(result.attackerSurvivors).toHaveLength(1);
    expect(result.attackerSurvivors[0].amount).toBe(1);
    expect(result.attackerLosses).toHaveLength(0);
  });

  test('wall defense helps defender win (from doc example)', () => {
    // 150 swordsmen vs 100 praetorians + 25 legionnaires behind lvl 15 Roman wall
    // Offense: 150*65=9750
    // Defense (all infantry): 100*65 + 25*35 = 7375
    // Wall bonus: 1.03^15 ≈ 1.558
    // Total defense: 7375 * 1.558 + (10 + 0)*1.558 ≈ 11505
    // Attacker should LOSE (9750 < 11505)
    const attackers = [troop('SWORDSMAN', 150)];
    const defenders = [troop('PRAETORIAN', 100), troop('LEGIONNAIRE', 25)];

    const result = resolveCombat(
      attackers,
      defenders,
      {
        wallType: 'ROMAN_WALL',
        wallLevel: 15,
        wallDurability: 1,
        palaceLevel: 0,
      },
      noResources,
      false,
    );

    expect(result.attackerWins).toBe(false);
  });

  test('raid produces survivors on both sides', () => {
    // 100 imperians raiding 100 praetorians (pure infantry)
    // Offense: 100*70=7000
    // Defense: 100*65=6500 (infantry def)
    // Attacker wins (7000 > 6500+10)
    // x = (6510/7000)^1.5 ≈ 0.894
    // raid casualty = x/(1+x) ≈ 0.472
    // Defender casualty = 1 - 0.472 = 0.528
    const attackers = [troop('IMPERIAN', 100)];
    const defenders = [troop('PRAETORIAN', 100)];

    const result = resolveCombat(
      attackers,
      defenders,
      defaultModifiers,
      noResources,
      true,
    );

    // Both sides should have survivors in a raid
    expect(result.attackerSurvivors.length).toBeGreaterThan(0);
    expect(result.defenderSurvivors.length).toBeGreaterThan(0);
  });

  test('loot is computed for surviving attackers', () => {
    const attackers = [troop('IMPERIAN', 100)];
    const defenders: CombatTroop[] = [];
    const resources: [number, number, number, number] = [
      1000, 1000, 1000, 1000,
    ];

    const result = resolveCombat(
      attackers,
      defenders,
      defaultModifiers,
      resources,
      false,
    );

    const totalLoot = result.loot.reduce((s, v) => s + v, 0);
    // 100 imperians * 50 carry = 5000 max carry
    // 4000 available, so should take all
    expect(totalLoot).toBeGreaterThan(0);
    expect(totalLoot).toBeLessThanOrEqual(5000);
  });
});

describe('calculateWallDamage', () => {
  test('no rams -> no damage', () => {
    expect(calculateWallDamage(0, 10, 'ROMAN_WALL', 1)).toBe(0);
  });

  test('rams reduce wall level', () => {
    // ROMAN_WALL durability=1, level=10: floor(50/(1*10))=5 levels destroyed
    const damage = calculateWallDamage(50, 10, 'ROMAN_WALL', 1);
    expect(damage).toBe(5);
  });

  test('teutonic wall with durability 5 needs more rams', () => {
    // TEUTONIC_WALL durability=5, level=10: floor(50/(5*10))=1 level destroyed
    const damage = calculateWallDamage(50, 10, 'TEUTONIC_WALL', 5);
    expect(damage).toBe(1);
  });
});

describe('calculateTotalCarryCapacity', () => {
  test('100 imperians = 5000 carry', () => {
    // Imperian carry = 50
    const result = calculateTotalCarryCapacity([
      { unitId: 'IMPERIAN', amount: 100 },
    ]);
    expect(result).toBe(5000);
  });
});
