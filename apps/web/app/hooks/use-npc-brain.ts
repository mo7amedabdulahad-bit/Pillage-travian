import { useCallback, useEffect, useState } from 'react';

/**
 * Types matching the NPC Brain simulation result from the Web Worker.
 */
interface AttackSummaryEntry {
  villageName: string;
  faction: string;
  outcome: 'defended' | 'defeated';
  troopsLost: number;
  resourcesLost?: { wood: number; clay: number; iron: number; wheat: number };
}

interface OfflineSummary {
  totalTimeSimulated: string;
  incomingAttacksResolved: AttackSummaryEntry[];
  npcVillagesGrown: number;
  nextThreatenedBy: string | null;
  nextEventIn: string | null;
}

interface SimulationSummary {
  retaliationsResolved: unknown[];
  villagesGrown: number;
  troopsRegenerated: number;
  aggressionChanges: unknown[];
  offlineSummary: OfflineSummary;
}

interface LiveTickData {
  villagesGrown: number;
  troopsRegenerated: number;
  retaliationCount: number;
  aggressionChanges: unknown[];
}

interface NPCBrainState {
  isSimulating: boolean;
  simulationComplete: boolean;
  offlineSummary: OfflineSummary | null;
  worldThreatLevel: number;
  lastLiveTick: LiveTickData | null;
  dismissSummary: () => void;
}

/**
 * React hook that listens for NPC Brain simulation events from the Web Worker.
 * Must be passed the actual apiWorker instance (Worker object) to attach listeners.
 *
 * Usage:
 * ```tsx
 * const { apiWorker } = useApiWorker(serverSlug);
 * const { isSimulating, offlineSummary, dismissSummary } = useNPCBrain(apiWorker);
 * if (isSimulating) return <LoadingSimulation />;
 * if (offlineSummary) return <WhileYouWereAway summary={offlineSummary} onDismiss={dismissSummary} />;
 * ```
 */
export const useNPCBrain = (apiWorker: Worker | null): NPCBrainState => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(
    null,
  );
  const [worldThreatLevel, setWorldThreatLevel] = useState(0);
  const [lastLiveTick, setLastLiveTick] = useState<LiveTickData | null>(null);

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const { data } = event;
      if (!data?.eventKey) {
        return;
      }

      switch (data.eventKey) {
        case 'event:npc-simulation-start': {
          setIsSimulating(true);
          break;
        }

        case 'event:npc-simulation-complete': {
          setIsSimulating(false);
          setSimulationComplete(true);

          const summary = data.summary as SimulationSummary | null;
          if (summary?.offlineSummary) {
            setOfflineSummary(summary.offlineSummary);
          }
          break;
        }

        case 'event:npc-live-tick-complete': {
          setLastLiveTick(data.tick as LiveTickData);
          break;
        }

        case 'event:world-threat-update': {
          setWorldThreatLevel(data.level ?? 0);
          break;
        }
      }
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.removeEventListener('message', handleMessage);
    };
  }, [apiWorker]);

  const dismissSummary = useCallback(() => {
    setOfflineSummary(null);
  }, []);

  return {
    isSimulating,
    simulationComplete,
    offlineSummary,
    worldThreatLevel,
    lastLiveTick,
    dismissSummary,
  };
};
