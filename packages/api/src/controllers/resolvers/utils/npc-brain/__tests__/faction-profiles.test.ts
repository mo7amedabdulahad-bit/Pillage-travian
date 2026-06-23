import { describe, expect, it } from 'vitest';
import { FACTION_PROFILES, getFactionProfile } from '../faction-profiles';
import type { FactionKey } from '../npc-brain-types';

describe('Faction Profiles', () => {
  it('should have all 9 NPC factions plus natars defined', () => {
    const keys = Object.keys(FACTION_PROFILES);
    expect(keys).toHaveLength(10);
    expect(keys).toContain('npc1');
    expect(keys).toContain('npc9');
    expect(keys).toContain('natars');
  });

  it('should have correct permanent memory factions', () => {
    expect(FACTION_PROFILES.npc1.isMemoryPermanent).toBe(true); // Iron Brotherhood
    expect(FACTION_PROFILES.npc6.isMemoryPermanent).toBe(true); // Ember Cult
    expect(FACTION_PROFILES.npc9.isMemoryPermanent).toBe(true); // Bone Reavers
  });

  it('should have correct non-permanent memory factions', () => {
    expect(FACTION_PROFILES.npc2.isMemoryPermanent).toBe(false); // Merchant Guilds
    expect(FACTION_PROFILES.npc3.isMemoryPermanent).toBe(false); // Shadow Nomads
    expect(FACTION_PROFILES.npc4.isMemoryPermanent).toBe(false); // Stone Wardens
    expect(FACTION_PROFILES.npc5.isMemoryPermanent).toBe(false); // River Clans
    expect(FACTION_PROFILES.npc7.isMemoryPermanent).toBe(false); // Verdant Order
    expect(FACTION_PROFILES.npc8.isMemoryPermanent).toBe(false); // Iron Scholars
  });

  it('should have correct retaliation thresholds', () => {
    expect(FACTION_PROFILES.npc1.retaliationThreshold).toBe(1); // Iron Brotherhood: immediate
    expect(FACTION_PROFILES.npc2.retaliationThreshold).toBe(5); // Merchant Guilds: patient
    expect(FACTION_PROFILES.npc7.retaliationThreshold).toBe(7); // Verdant Order: most patient
    expect(FACTION_PROFILES.npc9.retaliationThreshold).toBe(1); // Bone Reavers: immediate
  });

  it('should have correct growth rate multipliers', () => {
    expect(FACTION_PROFILES.npc7.growthRateMultiplier).toBe(2.0); // Verdant Order: fastest
    expect(FACTION_PROFILES.npc1.growthRateMultiplier).toBe(0.75); // Iron Brotherhood: slowest
    expect(FACTION_PROFILES.npc2.growthRateMultiplier).toBe(1.5); // Merchant Guilds: fast
  });

  it('should have correct troop regen rate multipliers', () => {
    expect(FACTION_PROFILES.npc1.troopRegenRateMultiplier).toBe(1.5); // Iron Brotherhood: high
    expect(FACTION_PROFILES.npc2.troopRegenRateMultiplier).toBe(0.5); // Merchant Guilds: low
    expect(FACTION_PROFILES.npc9.troopRegenRateMultiplier).toBe(1.4); // Bone Reavers: medium-high
  });

  it('should have troop tier weights summing to ~1.0', () => {
    for (const [_key, profile] of Object.entries(FACTION_PROFILES)) {
      const sum = profile.preferredTroopTierWeights.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });

  it('getFactionProfile should return correct profile for valid key', () => {
    const profile = getFactionProfile('npc1');
    expect(profile.name).toBe('Iron Brotherhood');
    expect(profile.key).toBe('npc1');
  });

  it('getFactionProfile should throw for invalid key', () => {
    expect(() => getFactionProfile('invalid' as FactionKey)).toThrow();
  });
});
