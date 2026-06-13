import type { Faction } from '@pillage-first/types/models/faction';
import type { UnitId } from '@pillage-first/types/models/unit';

// ───────────────────────────────────────────────────────────────
// Faction Profile
// ───────────────────────────────────────────────────────────────

export type FactionKey = Exclude<Faction, 'player'>;

export interface FactionProfile {
  readonly key: FactionKey;
  readonly name: string;
  readonly personality: string;
  readonly retaliationThreshold: number;
  readonly memoryDurationHours: number | null;
  readonly isMemoryPermanent: boolean;
  readonly repLossPerRaid: number;
  readonly aggressionDecayDays: number | null;
  readonly isAggressionPermanent: boolean;
  readonly growthRateMultiplier: number;
  readonly troopRegenRateMultiplier: number;
  readonly restThresholdHours: number;
  readonly restStockpileBonus: number;
  readonly preferredTroopTierWeights: readonly [number, number, number, number];
}

// ───────────────────────────────────────────────────────────────
// Raid History (maps to npc_raid_history table)
// ───────────────────────────────────────────────────────────────

export interface RaidEvent {
  readonly id: number;
  readonly villageId: number;
  readonly timestamp: number;
  readonly lootWood: number;
  readonly lootClay: number;
  readonly lootIron: number;
  readonly lootWheat: number;
  readonly troopsLostJson: string;
  readonly playerTroopsLostJson: string;
}

// ───────────────────────────────────────────────────────────────
// Retaliation Event (maps to npc_retaliation_queue table)
// ───────────────────────────────────────────────────────────────

export interface RetaliationEvent {
  readonly id: number;
  readonly villageId: number;
  readonly scheduledAtMs: number;
  readonly executeAtMs: number;
  readonly aggressionTier: number;
  readonly factionKey: FactionKey;
  readonly troopsJson: string;
}

// ───────────────────────────────────────────────────────────────
// NPC Village State (maps to npc_village_state table)
// ───────────────────────────────────────────────────────────────

export interface NPCVillageState {
  readonly villageId: number;
  readonly lastInteractedAt: number;
  readonly timesAttacked: number;
  readonly fieldGrowthAccumulator: number;
  readonly lastGrowthTickMs: number;
  readonly populationGrowthRate: number;
  readonly restState: boolean;
  readonly restThresholdMs: number;
  readonly restStockpileBonus: number;
  readonly lastTroopRegenMs: number;
  readonly currentLootAvailable: number;
  readonly maxLootCapacity: number;
  readonly lootRecoveryRate: number;
  readonly aggressionLevel: number;
  readonly aggressionDecayTimer: number;
  readonly regionalAlertActive: boolean;
  readonly lastAggressionDecayMs: number;
  readonly lastRaidedMs: number;
  readonly factionKey: FactionKey;
}

// ───────────────────────────────────────────────────────────────
// Simulation Result
// ───────────────────────────────────────────────────────────────

export interface SimulationResult {
  readonly retaliationsResolved: RetaliationResolution[];
  readonly villagesGrown: number;
  readonly troopsRegenerated: number;
  readonly aggressionChanges: AggressionChange[];
  readonly offlineSummary: OfflineSummary;
}

export interface RetaliationResolution {
  readonly villageId: number;
  readonly villageName: string;
  readonly factionKey: FactionKey;
  readonly tier: number;
  readonly attackerWins: boolean;
  readonly attackerTroopsLost: number;
  readonly defenderTroopsLost: number;
  readonly timestamp: number;
}

export interface AggressionChange {
  readonly villageId: number;
  readonly factionKey: FactionKey;
  readonly oldLevel: number;
  readonly newLevel: number;
  readonly reason: string;
}

// ───────────────────────────────────────────────────────────────
// Offline Summary (for UI display)
// ───────────────────────────────────────────────────────────────

export interface OfflineSummary {
  readonly totalTimeSimulated: string;
  readonly incomingAttacksResolved: AttackSummaryEntry[];
  readonly npcVillagesGrown: number;
  readonly nextThreatenedBy: string | null;
  readonly nextEventIn: string | null;
}

export interface AttackSummaryEntry {
  readonly villageName: string;
  readonly faction: string;
  readonly outcome: 'defended' | 'defeated';
  readonly troopsLost: number;
  readonly resourcesLost?: {
    wood: number;
    clay: number;
    iron: number;
    wheat: number;
  };
}

// ───────────────────────────────────────────────────────────────
// World Threat Level
// ───────────────────────────────────────────────────────────────

export interface WorldThreatState {
  readonly level: number;
  readonly npcTroopMultiplier: number;
}

// ───────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────

export const NPC_BRAIN_CONSTANTS = {
  /** Base hours between field level-ups at 1x speed */
  BASE_GROWTH_HOURS: 48,

  /** Max field level for NPC villages (player can reach 20) */
  NPC_MAX_FIELD_LEVEL: 15,

  /** Base population growth per real hour at 1x speed */
  BASE_POPULATION_GROWTH_RATE: 2,

  /** Population cap = sum of field levels * this multiplier */
  POPULATION_CAP_PER_FIELD_LEVEL: 8,

  /** Village size multipliers for loot capacity */
  VILLAGE_SIZE_MULTIPLIER: {
    xxs: 0.5,
    xs: 0.6,
    sm: 0.75,
    md: 1.0,
    lg: 1.25,
    xl: 1.5,
    '2xl': 1.75,
    '3xl': 2.0,
    '4xl': 2.5,
  } as const,

  /** Loot capacity per field level */
  LOOT_PER_FIELD_LEVEL: 50,

  /** Base loot recovery rate per real hour */
  BASE_LOOT_RECOVERY_RATE: 0.08,

  /** Field level sum for full base recovery rate */
  FULL_RECOVERY_FIELD_SUM: 60,

  /** Base rest threshold in hours at 1x speed */
  BASE_REST_THRESHOLD_HOURS: 48,

  /** Relaxed factions rest threshold (verdant_order, merchant_guilds) */
  RELAXED_REST_THRESHOLD_HOURS: 24,

  /** Aggression tier troop percentages: [passive, alert, retaliating, aggressive, rallying, siege] */
  AGGRESSION_TROOP_PERCENTAGES: [0, 0, 0.25, 0.5, 0.75, 1.0] as const,

  /** Retaliation timing variance: ±15% */
  RETALIATION_VARIANCE: 0.15,

  /** Regional reinforcement range in map tiles */
  REINFORCEMENT_RANGE: 5,

  /** Wipe garrison reputation penalty */
  WIPE_GARRISON_REP_PENALTY: 120,

  /** Minimum troop count for retaliation */
  MIN_TROOPS_FOR_RETALIATION: 20,

  /** World threat: building level weight */
  THREAT_BUILDING_WEIGHT: 0.5,

  /** World threat: troop count weight */
  THREAT_TROOP_WEIGHT: 0.01,

  /** World threat: hero level weight */
  THREAT_HERO_WEIGHT: 2,

  /** World threat: oasis weight */
  THREAT_OASIS_WEIGHT: 5,

  /** World threat: max level */
  THREAT_MAX: 100,

  /** NPC troop multiplier range */
  NPC_TROOP_MULTIPLIER_MIN: 0.2,
  NPC_TROOP_MULTIPLIER_MAX: 2.0,

  /** Simulation chunk size: 1 simulated hour in ms at 1x */
  SIMULATION_CHUNK_MS: 3_600_000,

  /** Yield to event loop every N chunks */
  YIELD_EVERY_N_CHUNKS: 10,

  /** Minimum elapsed ms to trigger simulation */
  MIN_SIMULATION_ELAPSED_MS: 60_000,
} as const;

// ───────────────────────────────────────────────────────────────
// Tribe Troop Compositions (unit IDs per tribe, by tier)
// ───────────────────────────────────────────────────────────────

export const TRIBE_TROOP_TIERS: Record<string, readonly UnitId[]> = {
  romans: [
    'LEGIONNAIRE',
    'PRAETORIAN',
    'IMPERIAN',
    'EQUITES_IMPERATORIS',
  ] as unknown as UnitId[],
  gauls: [
    'PHALANX',
    'SWORDSMAN',
    'THEUTATES_THUNDER',
    'DRUIDRIDER',
  ] as unknown as UnitId[],
  teutons: [
    'CLUBSWINGER',
    'SPEARMAN',
    'AXEMAN',
    'PALADIN',
  ] as unknown as UnitId[],
  egyptians: [
    'SLAVE_MILITIA',
    'ASH_WARDEN',
    'KHOPESH_WARRIOR',
    'ANHUR_GUARD',
  ] as unknown as UnitId[],
  huns: [
    'MERCENARY',
    'BOWMAN',
    'STEPPE_RIDER',
    'MARKSMAN',
  ] as unknown as UnitId[],
  spartans: [
    'HOPLITE',
    'SHIELDSMAN',
    'TWINSTEEL_THERION',
    'ELPIDA_RIDER',
  ] as unknown as UnitId[],
  natars: [
    'PIKEMAN',
    'THORNED_WARRIOR',
    'GUARDSMAN',
    'AXERIDER',
  ] as unknown as UnitId[],
};

// ───────────────────────────────────────────────────────────────
// Village Size Regen Rates (troops per hour at 1x speed)
// ───────────────────────────────────────────────────────────────

export const VILLAGE_SIZE_REGEN_RATE: Record<string, number> = {
  xxs: 2,
  xs: 5,
  sm: 10,
  md: 20,
  lg: 40,
  xl: 80,
  '2xl': 150,
  '3xl': 300,
  '4xl': 600,
};
