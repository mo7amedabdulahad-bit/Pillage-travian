import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import {
  type HeroLoadoutSlot,
  heroLoadoutSlotSchema,
} from '@pillage-first/types/models/hero-loadout';
import {
  heroInventoryCacheKey,
  heroLoadoutCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

const equippedItemSchema = z.strictObject({
  itemId: z.number(),
  slot: heroLoadoutSlotSchema,
  amount: z.number(),
});

export type EquippedItem = z.infer<typeof equippedItemSchema>;

export const useHeroLoadout = () => {
  const { fetcher } = use(ApiContext);

  const { data: loadout } = useSuspenseQuery({
    queryKey: [heroLoadoutCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/hero/equipped-items');
      return z.array(equippedItemSchema).parse(data);
    },
  });

  const { mutate: equipItem } = useMutation<
    void,
    Error,
    { itemId: number; slot: HeroLoadoutSlot; amount: number }
  >({
    mutationFn: async (body) => {
      await fetcher('/me/hero/equipped-items', {
        method: 'PATCH',
        body,
      });
    },
    onSuccess: async (_, __, ___, context) => {
      await Promise.all([
        context.client.invalidateQueries({
          queryKey: [heroLoadoutCacheKey],
        }),
        context.client.invalidateQueries({
          queryKey: [heroInventoryCacheKey],
        }),
      ]);
    },
  });

  const { mutate: unequipItem } = useMutation<
    void,
    Error,
    { slot: HeroLoadoutSlot }
  >({
    mutationFn: async ({ slot }) => {
      await fetcher(`/me/hero/equipped-items/${slot}`, {
        method: 'DELETE',
      });
    },
    onSuccess: async (_, __, ___, context) => {
      await Promise.all([
        context.client.invalidateQueries({
          queryKey: [heroLoadoutCacheKey],
        }),
        context.client.invalidateQueries({
          queryKey: [heroInventoryCacheKey],
        }),
      ]);
    },
  });

  return {
    loadout,
    equipItem,
    unequipItem,
  };
};
