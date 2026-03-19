import { useCallback } from 'react';
import { useParams } from 'react-router';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server.ts';

export const useGameNavigation = () => {
  const { serverSlug } = useServer();
  const { villageSlug } = useParams<{ villageSlug: string }>();

  const getNewVillageUrl = useCallback(
    (slug: string) => {
      return `/game/${serverSlug}/${slug}/resources`;
    },
    [serverSlug],
  );

  const getRallyPointUrl = useCallback(
    (fieldId: number) => {
      return `/game/${serverSlug}/${villageSlug}/village/${fieldId}?tab=send-troops`;
    },
    [serverSlug, villageSlug],
  );

  const getMarketplaceUrl = useCallback(
    (fieldId: number) => {
      return `/game/${serverSlug}/${villageSlug}/village/${fieldId}?tab=send-resources`;
    },
    [serverSlug, villageSlug],
  );

  return {
    getNewVillageUrl,
    getRallyPointUrl,
    getMarketplaceUrl,
  };
};
