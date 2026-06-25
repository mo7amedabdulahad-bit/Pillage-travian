import { useMutation } from '@tanstack/react-query';
import { use, useCallback } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type AdminActionResponse = {
  success: boolean;
  message?: string;
  data?: unknown;
};

export const useAdminDashboard = () => {
  const { fetcher } = use(ApiContext);

  const fetch = useCallback(
    async <TBody>(path: string, body: TBody): Promise<AdminActionResponse> => {
      const response = await fetcher<AdminActionResponse>(path, {
        method: 'POST',
        body,
      });
      return response.data;
    },
    [fetcher],
  );

  const { mutateAsync: spawnTroops } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      troops: Array<{ unitId: string; amount: number }>;
    }
  >({
    mutationFn: (args) => fetch('/admin/spawn-troops', args),
  });

  const { mutateAsync: removeTroops } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      troops: Array<{ unitId: string; amount: number }>;
    }
  >({
    mutationFn: (args) => fetch('/admin/remove-troops', args),
  });

  const { mutateAsync: setResources } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      lumber: number;
      clay: number;
      iron: number;
      crop: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/set-resources', args),
  });

  const { mutateAsync: addResources } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      lumber: number;
      clay: number;
      iron: number;
      crop: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/add-resources', args),
  });

  const { mutateAsync: upgradeBuilding } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      fieldId: number;
      targetLevel: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/upgrade-building', args),
  });

  const { mutateAsync: downgradeBuilding } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      fieldId: number;
      targetLevel: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/downgrade-building', args),
  });

  const { mutateAsync: spawnHeroItem } = useMutation<
    AdminActionResponse,
    Error,
    {
      heroId: number;
      itemId: number;
      amount?: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/spawn-hero-item', args),
  });

  const { mutateAsync: setHeroHealth } = useMutation<
    AdminActionResponse,
    Error,
    {
      heroId: number;
      health: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/set-hero-health', args),
  });

  const { mutateAsync: levelUpHero } = useMutation<
    AdminActionResponse,
    Error,
    {
      heroId: number;
      levels?: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/level-up-hero', args),
  });

  const { mutateAsync: createNatarVillage } = useMutation<
    AdminActionResponse,
    Error,
    {
      x: number;
      y: number;
      garrisonStrength?: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/create-natar-village', args),
  });

  const { mutateAsync: grantConstructionPlan } = useMutation<
    AdminActionResponse,
    Error,
    {
      heroId: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/grant-construction-plan', args),
  });

  const { mutateAsync: startWorldWonder } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/start-world-wonder', args),
  });

  const { mutateAsync: setWorldWonderLevel } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      level: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/set-world-wonder-level', args),
  });

  const { mutateAsync: endServer } = useMutation<
    AdminActionResponse,
    Error,
    {
      winnerType: 'player' | 'natars';
    }
  >({
    mutationFn: (args) => fetch('/admin/end-server', args),
  });

  const { mutateAsync: resetServerEnd } = useMutation<
    AdminActionResponse,
    Error
  >({
    mutationFn: () => fetch('/admin/reset-server-end', {}),
  });

  const { mutateAsync: triggerNpcBrainTick } = useMutation<
    AdminActionResponse,
    Error
  >({
    mutationFn: () => fetch('/admin/trigger-npc-brain-tick', {}),
  });

  const { mutateAsync: setGameSpeed } = useMutation<
    AdminActionResponse,
    Error,
    {
      speed: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/set-game-speed', args),
  });

  const { mutateAsync: setNpcAggression } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      aggressionLevel: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/set-npc-aggression', args),
  });

  const { mutateAsync: cancelRetaliation } = useMutation<
    AdminActionResponse,
    Error,
    {
      retaliationId: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/cancel-retaliation', args),
  });

  const { mutateAsync: cancelEvent } = useMutation<
    AdminActionResponse,
    Error,
    {
      eventId: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/cancel-event', args),
  });

  const { mutateAsync: teleportVillage } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      x: number;
      y: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/teleport-village', args),
  });

  const { mutateAsync: renameVillage } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
      name: string;
    }
  >({
    mutationFn: (args) => fetch('/admin/rename-village', args),
  });

  const { mutateAsync: deleteVillage } = useMutation<
    AdminActionResponse,
    Error,
    {
      villageId: number;
    }
  >({
    mutationFn: (args) => fetch('/admin/delete-village', args),
  });

  return {
    spawnTroops,
    removeTroops,
    setResources,
    addResources,
    upgradeBuilding,
    downgradeBuilding,
    spawnHeroItem,
    setHeroHealth,
    levelUpHero,
    createNatarVillage,
    grantConstructionPlan,
    startWorldWonder,
    setWorldWonderLevel,
    endServer,
    resetServerEnd,
    triggerNpcBrainTick,
    setGameSpeed,
    setNpcAggression,
    cancelRetaliation,
    cancelEvent,
    teleportVillage,
    renameVillage,
    deleteVillage,
  };
};
