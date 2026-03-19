import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useCallback, useMemo } from 'react';
import { z } from 'zod';
import type { Faction } from '@pillage-first/types/models/faction';
import {
  type Reputation,
  reputationSchema,
} from '@pillage-first/types/models/reputation';
import { reputationsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useReputations = () => {
  const { fetcher } = use(ApiContext);

  const { data: reputations } = useSuspenseQuery({
    queryKey: [reputationsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/reputations');

      return z.array(reputationSchema).parse(data);
    },
  });

  const reputationsMap = useMemo(() => {
    return new Map<Faction, Reputation>(
      reputations.map((reputation) => {
        return [reputation.faction, reputation];
      }),
    );
  }, [reputations]);

  const getReputation = useCallback(
    (faction: Faction): Reputation => {
      const reputation = reputationsMap.get(faction);
      if (!reputation) {
        // Fallback for missing factions to prevent crashes
        return {
          faction,
          reputation: 42_000,
          reputationLevel: 'neutral',
        };
      }
      return reputation;
    },
    [reputationsMap],
  );

  return {
    reputations,
    reputationsMap,
    getReputation,
  };
};
