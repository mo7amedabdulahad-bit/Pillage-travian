export { getNpcVillageDebugInfo } from './developer-tools';
export { FACTION_PROFILES, getFactionProfile } from './faction-profiles';
export { getGameSpeed } from './helpers';
export type {
  FactionKey,
  FactionProfile,
  NPCVillageState,
  OfflineSummary,
  RaidEvent,
  ReconciliationResult,
  RetaliationEvent,
  SimulationResult,
  WorldThreatState,
} from './npc-brain-types';
export { NPC_BRAIN_CONSTANTS } from './npc-brain-types';
export { buildOfflineSummary } from './offline-summary';
export {
  getLastSimulationTimestamp,
  processNPCTick,
  reconcileNpcBrain,
  setLastSimulationTimestamp,
  simulateElapsedTime,
} from './simulate-elapsed-time';
export { applyRaidReputationConsequences } from './subsystems/reputation-impact';
export {
  calculateWorldThreatLevel,
  getNpcTroopMultiplier,
} from './world-threat-level';
