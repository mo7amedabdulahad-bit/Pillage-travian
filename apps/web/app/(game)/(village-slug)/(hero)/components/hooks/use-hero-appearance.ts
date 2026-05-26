import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { HeroAppearance } from '@pillage-first/types/models/hero-appearance';
import { heroAppearanceSchema } from '@pillage-first/types/models/hero-appearance';
import { heroAppearanceCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useHeroAppearance = () => {
  const { fetcher } = use(ApiContext);

  const { data: appearance } = useSuspenseQuery({
    queryKey: [heroAppearanceCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/hero/appearance');
      return heroAppearanceSchema.parse(data);
    },
  });

  const { mutate: updateAppearance } = useMutation<void, Error, HeroAppearance>(
    {
      mutationFn: async (newAppearance) => {
        await fetcher('/me/hero/appearance', {
          method: 'PATCH',
          body: newAppearance,
        });
      },
      onSuccess: async (_, _args, _onMutateResult, context) => {
        await context.client.invalidateQueries({
          queryKey: [heroAppearanceCacheKey],
        });
      },
    },
  );

  return {
    appearance,
    updateAppearance,
  };
};
