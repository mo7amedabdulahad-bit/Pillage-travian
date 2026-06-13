import type { Faction } from '@pillage-first/types/models/faction';

/**
 * Human-readable faction names for display in the UI.
 * Maps faction keys to their lore-accurate names.
 */
export const FACTION_NAMES: Record<Faction, string> = {
  player: 'Player',
  npc1: 'Iron Brotherhood',
  npc2: 'Merchant Guilds',
  npc3: 'Shadow Nomads',
  npc4: 'Stone Wardens',
  npc5: 'River Clans',
  npc6: 'Ember Cult',
  npc7: 'Verdant Order',
  npc8: 'Iron Scholars',
  npc9: 'Bone Reavers',
};

/**
 * Get display name for a faction.
 */
export const getFactionDisplayName = (faction: Faction): string => {
  return FACTION_NAMES[faction] ?? faction;
};
