import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { use, useCallback } from 'react';
import { z } from 'zod';
import type { TroopMovementEventType } from '@pillage-first/types/models/game-event';
import {
  eventsCacheKey,
  playerTroopsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { ApiContext } from 'app/(game)/providers/api-provider';

export type SendTroopsArgs = {
  type: TroopMovementEventType;
  troops: { unitId: string; amount: number }[];
  targetId: number;
};

const villageSearchResultSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  player_name: z.string(),
  faction: z.string(),
});

export const useRallyPoint = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const queryClient = useQueryClient();
  const { villageTroops, getDeployableTroops } = useVillageTroops();
  const { eventsByType: movements } = useEventsByType('troopMovement');

  const { data: farmLists } = useSuspenseQuery({
    queryKey: ['farm-lists', currentVillage.playerId],
    queryFn: async () => {
      const { data } = await fetcher(
        `/players/${currentVillage.playerId}/farm-lists`,
      );
      return z
        .array(z.object({ id: z.number(), name: z.string() }))
        .parse(data);
    },
  });

  const getFarmList = async (farmListId: number) => {
    const { data } = await fetcher(`/farm-lists/${farmListId}`);
    return data;
  };

  const { mutateAsync: raidFarmList, isPending: isRaiding } = useMutation({
    mutationFn: async (farmListId: number) => {
      await fetcher(
        `/villages/${currentVillage.id}/farm-lists/${farmListId}/raid`,
        {
          method: 'POST',
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [eventsCacheKey, 'troopMovement', currentVillage.id],
      });
    },
  });

  const { mutateAsync: raidFarmTile, isPending: isRaidingTile } = useMutation({
    mutationFn: async ({
      farmListId,
      tileId,
    }: {
      farmListId: number;
      tileId: number;
    }) => {
      await fetcher(
        `/villages/${currentVillage.id}/farm-lists/${farmListId}/tiles/${tileId}/raid`,
        {
          method: 'POST',
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [eventsCacheKey, 'troopMovement', currentVillage.id],
      });
    },
  });

  const { mutateAsync: addTileToFarmList, isPending: isAddingToFarmList } =
    useMutation({
      mutationFn: async ({
        farmListId,
        tileId,
      }: {
        farmListId: number;
        tileId: number;
      }) => {
        await fetcher(`/farm-lists/${farmListId}/tiles`, {
          method: 'POST',
          body: { tileId },
        });
      },
    });

  const searchVillage = useCallback(
    async (x?: number, y?: number, name?: string) => {
      const query = new URLSearchParams();
      if (x !== undefined) {
        query.set('x', String(x));
      }
      if (y !== undefined) {
        query.set('y', String(y));
      }
      if (name) {
        query.set('name', name);
      }

      const { data } = await fetcher<z.infer<
        typeof villageSearchResultSchema
      > | null>(`/villages/search?${query.toString()}`);
      if (!data) {
        return null;
      }

      return villageSearchResultSchema.parse(data);
    },
    [fetcher],
  );

  const { mutateAsync: sendTroops, isPending: isSending } = useMutation({
    mutationFn: async ({ targetId, type, troops }: SendTroopsArgs) => {
      await fetcher('/events', {
        method: 'POST',
        body: {
          villageId: currentVillage.id,
          type,
          targetId,
          troops,
        },
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [playerTroopsCacheKey, currentVillage.tileId],
        }),
        queryClient.invalidateQueries({
          queryKey: [eventsCacheKey, 'troopMovement', currentVillage.id],
        }),
      ]);
    },
  });

  return {
    villageTroops,
    deployableTroops: getDeployableTroops(),

    movements,
    farmLists,
    getFarmList,
    raidFarmList,
    isRaiding,
    raidFarmTile,
    isRaidingTile,
    addTileToFarmList,
    isAddingToFarmList,
    searchVillage,
    sendTroops,
    isSending,
  };
};
