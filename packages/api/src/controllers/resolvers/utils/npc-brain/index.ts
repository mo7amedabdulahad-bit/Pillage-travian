export { FACTION_PROFILES, getFactionProfile } from './faction-profiles';
export type {
  FactionKey,
  FactionProfile,
  NPCVillageState,
  OfflineSummary,
  RaidEvent,
  RetaliationEvent,
  SimulationResult,
  WorldThreatState,
} from './npc-brain-types';
export { NPC_BRAIN_CONSTANTS } from './npc-brain-types';
export { buildOfflineSummary } from './offline-summary';
export {
  getLastSimulationTimestamp,
  setLastSimulationTimestamp,
  simulateElapsedTime,
} from './simulate-elapsed-time';
export { applyRaidReputationConsequences } from './subsystems/reputation-impact';
export {
  calculateWorldThreatLevel,
  getNpcTroopMultiplier,
} from './world-threat-level';
