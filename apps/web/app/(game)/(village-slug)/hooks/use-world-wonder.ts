import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { use } from 'react';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';

export type WorldWonderState = {
  villageId: number;
  ownerPlayerId: number | null;
  ownerFactionId: string;
  currentLevel: number;
  startedAt: number;
  name: string | null;
  lastAttackAt: number | null;
  nextAttackAt: number | null;
  cannotBeUpgradedReason: string | null;
  isNatarOwned: boolean;
  attackBlockUntil: number | null;
} | null;

export const useWorldWonder = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: worldWonder, isLoading } = useQuery({
    queryKey: ['world-wonder', currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher<WorldWonderState>(
        `/villages/${currentVillage.id}/world-wonder`,
      );
      return data;
    },
    enabled: !!currentVillage.id,
  });

  return {
    worldWonder,
    isLoading,
  };
};

export const useUpgradeWorldWonder = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetcher(`/villages/${currentVillage.id}/world-wonder/upgrade`, {
        method: 'POST',
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['world-wonder', currentVillage.id],
      });
    },
  });
};

export const useRenameWorldWonder = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      await fetcher(`/villages/${currentVillage.id}/world-wonder/name`, {
        method: 'PATCH',
        body: { name },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['world-wonder', currentVillage.id],
      });
    },
  });
};

export type WorldWonderLeaderboardEntry = {
  villageId: number;
  ownerPlayerId: number | null;
  ownerFactionId: string;
  currentLevel: number;
  startedAt: number;
  name: string | null;
  villageName: string;
  isWWVillage: number;
  x: number;
  y: number;
};

export const useWorldWonderLeaderboard = () => {
  const { fetcher } = use(ApiContext);

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['world-wonder-leaderboard'],
    queryFn: async () => {
      const { data } = await fetcher<WorldWonderLeaderboardEntry[]>(
        '/world-wonders/leaderboard',
      );
      return data;
    },
  });

  return {
    leaderboard,
    isLoading,
  };
};
