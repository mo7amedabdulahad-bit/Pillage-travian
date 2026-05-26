import { useMutation, useQueryClient } from '@tanstack/react-query';
import { use } from 'react';
import {
  heroInventoryCacheKey,
  heroLoadoutCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

interface UseHeroItemArgs {
  itemId: number;
  amount: number;
}

export function useUseHeroItem() {
  const queryClient = useQueryClient();
  const { fetcher } = use(ApiContext);

  return useMutation<void, Error, UseHeroItemArgs>({
    mutationFn: async ({ itemId, amount }) => {
      await fetcher('/me/hero/item', {
        method: 'POST',
        body: JSON.stringify({ itemId, amount }),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [heroLoadoutCacheKey] }),
        queryClient.invalidateQueries({ queryKey: [heroInventoryCacheKey] }),
      ]);
    },
  });
}
