import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { resourceSchema } from '@pillage-first/types/models/resource';
import type { Tile } from '@pillage-first/types/models/tile';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';

type AbandonOasisArgs = {
  oasisId: Tile['id'];
};

const getOccupiableOasisInRangeSchema = z.strictObject({
  oasis: z.strictObject({
    id: z.number(),
    coordinates: coordinatesSchema,
    bonuses: z.array(
      z.strictObject({
        resource: resourceSchema,
        bonus: z.number(),
      }),
    ),
    loyalty: z.number(),
  }),
  village: z
    .object({
      id: z.number(),
      coordinates: coordinatesSchema,
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
  player: z
    .object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
  pendingReleaseAt: z.number().nullable(),
});

const occupiableOasisInRangeCacheKey = 'occupiable-oasis-in-range';

export const useOccupiableOasisInRange = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const queryClient = useQueryClient();

  const { data: occupiableOasisInRange } = useSuspenseQuery({
    queryKey: [occupiableOasisInRangeCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(
        `/villages/${currentVillage.id}/occupiable-oasis`,
      );

      return z.array(getOccupiableOasisInRangeSchema).parse(data);
    },
  });

  const { mutate: abandonOasis } = useMutation<void, Error, AbandonOasisArgs>({
    mutationFn: async ({ oasisId }) => {
      await fetcher(`/villages/${currentVillage.id}/oasis/${oasisId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [occupiableOasisInRangeCacheKey],
      });
      await queryClient.invalidateQueries({
        queryKey: [effectsCacheKey],
      });
    },
    onError: (error) => {
      alert(`Failed to release oasis: ${error.message}`);
    },
  });

  return {
    occupiableOasisInRange,
    abandonOasis,
  };
};
