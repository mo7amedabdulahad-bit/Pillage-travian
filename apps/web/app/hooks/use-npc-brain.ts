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

interface NPCBrainState {
  isSimulating: boolean;
  simulationComplete: boolean;
  offlineSummary: OfflineSummary | null;
  worldThreatLevel: number;
  dismissSummary: () => void;
}

/**
 * React hook that listens for NPC Brain simulation events from the Web Worker.
 * Provides simulation state, offline summary, and world threat level.
 *
 * Usage:
 * ```tsx
 * const { isSimulating, offlineSummary, dismissSummary } = useNPCBrain();
 * if (isSimulating) return <LoadingSimulation />;
 * if (offlineSummary) return <WhileYouWereAway summary={offlineSummary} onDismiss={dismissSummary} />;
 * ```
 */
export const useNPCBrain = (): NPCBrainState => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(
    null,
  );
  const [worldThreatLevel, setWorldThreatLevel] = useState(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { data } = event;

      if (data?.eventKey === 'event:database-initialization-success') {
        setIsSimulating(true);
      }

      if (data?.eventKey === 'event:npc-simulation-complete') {
        const summary = data.summary as SimulationSummary;
        setIsSimulating(false);
        setSimulationComplete(true);

        if (summary.offlineSummary) {
          setOfflineSummary(summary.offlineSummary);
        }
      }

      if (data?.eventKey === 'event:world-threat-update') {
        setWorldThreatLevel(data.level ?? 0);
      }
    };

    // Listen for simulation events
    // Note: In production, this would listen on the apiWorker reference
    // For now, we listen on the global message channel
    globalThis.addEventListener('message', handleMessage);

    return () => {
      globalThis.removeEventListener('message', handleMessage);
    };
  }, []);

  const dismissSummary = useCallback(() => {
    setOfflineSummary(null);
  }, []);

  return {
    isSimulating,
    simulationComplete,
    offlineSummary,
    worldThreatLevel,
    dismissSummary,
  };
};
