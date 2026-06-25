import { useQuery } from '@tanstack/react-query';
import { use, useState } from 'react';
import { ActivityFeed } from 'app/(game)/(village-slug)/(npc-dashboard)/components/activity-feed';
import { FactionBreakdown } from 'app/(game)/(village-slug)/(npc-dashboard)/components/faction-breakdown';
import { GrowthChart } from 'app/(game)/(village-slug)/(npc-dashboard)/components/growth-chart';
import { OverviewCards } from 'app/(game)/(village-slug)/(npc-dashboard)/components/overview-cards';
import { VillageTable } from 'app/(game)/(village-slug)/(npc-dashboard)/components/village-table';
import { useAdminDashboard } from 'app/(game)/(village-slug)/hooks/use-admin-dashboard';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Button } from 'app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'app/components/ui/card';
import { Input } from 'app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';

export const NpcBrainTab = () => {
  const { fetcher } = use(ApiContext);
  const { setNpcAggression, cancelRetaliation, triggerNpcBrainTick } =
    useAdminDashboard();
  const [aggressionVillageId, setAggressionVillageId] = useState('');
  const [aggressionLevel, setAggressionLevel] = useState('1');
  const [retaliationId, setRetaliationId] = useState('');
  const [tickResult, setTickResult] = useState<string | null>(null);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-npc-overview'],
    queryFn: async () => {
      const response = await fetcher<{
        totalNpcVillages: number;
        totalTroops: number;
        avgAggression: number;
        avgFieldLevel: number;
        totalBuilds: number;
        villagesWithHighAggression: number;
        totalPopulation: number;
      }>('/admin/npc-dashboard/overview');
      return response.data;
    },
    refetchInterval: 30_000,
  });

  const { data: factions, isLoading: factionsLoading } = useQuery({
    queryKey: ['admin-npc-factions'],
    queryFn: async () => {
      const response = await fetcher<
        {
          factionKey: string;
          factionName: string;
          villageCount: number;
          totalTroops: number;
          avgFieldLevel: number;
          totalPopulation: number;
          aggressionLevel: number;
          topVillageName: string;
          topVillageTroops: number;
        }[]
      >('/admin/npc-dashboard/factions');
      return response.data;
    },
    refetchInterval: 30_000,
  });

  const { data: villages, isLoading: villagesLoading } = useQuery({
    queryKey: ['admin-npc-villages'],
    queryFn: async () => {
      const response = await fetcher<
        {
          villageId: number;
          villageName: string;
          factionKey: string;
          x: number;
          y: number;
          aggressionLevel: number;
          currentLoot: number;
          maxLoot: number;
          simulationTier: number;
          needsTick: number;
          totalTroops: number;
          fieldLevelSum: number;
          population: number;
        }[]
      >('/admin/npc-dashboard/villages');
      return response.data;
    },
    refetchInterval: 30_000,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['admin-npc-activity'],
    queryFn: async () => {
      const response = await fetcher<{
        recentBuilds: {
          villageId: number;
          villageName: string;
          factionKey: string;
          building: string;
          fieldId: number;
          oldLevel: number;
          newLevel: number;
          timestamp: number;
        }[];
        recentRaids: {
          villageId: number;
          villageName: string;
          factionKey: string;
          timestamp: number;
          lootWood: number;
          lootClay: number;
          lootIron: number;
          lootWheat: number;
        }[];
        pendingRetaliations: {
          villageId: number;
          villageName: string;
          factionKey: string;
          executeAtMs: number;
          tier: number;
          scheduledAtMs: number;
        }[];
        buildHistory: {
          hour: number;
          builds: number;
        }[];
      }>('/admin/npc-dashboard/activity');
      return response.data;
    },
    refetchInterval: 15_000,
  });

  const handleSetAggression = async () => {
    if (!aggressionVillageId) {
      return;
    }
    await setNpcAggression({
      villageId: Number(aggressionVillageId),
      aggressionLevel: Number(aggressionLevel),
    });
  };

  const handleCancelRetaliation = async () => {
    if (!retaliationId) {
      return;
    }
    await cancelRetaliation({ retaliationId: Number(retaliationId) });
    setRetaliationId('');
  };

  const handleTick = async () => {
    const result = await triggerNpcBrainTick();
    setTickResult(JSON.stringify(result?.data, null, 2));
  };

  return (
    <div className="space-y-4">
      <OverviewCards
        data={overview}
        isLoading={overviewLoading}
      />

      <FactionBreakdown
        data={factions}
        isLoading={factionsLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GrowthChart
            data={activity?.buildHistory}
            isLoading={activityLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed
            data={activity}
            isLoading={activityLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              Set Aggression
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={aggressionVillageId}
                onValueChange={setAggressionVillageId}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Village" />
                </SelectTrigger>
                <SelectContent>
                  {villages?.map((v) => (
                    <SelectItem
                      key={v.villageId}
                      value={String(v.villageId)}
                    >
                      {v.villageName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={aggressionLevel}
                onChange={(e) => setAggressionLevel(e.target.value)}
                className="w-full sm:w-20"
                min={0}
                max={5}
              />
              <Button
                className="w-full sm:w-auto"
                disabled={!aggressionVillageId}
                onClick={handleSetAggression}
              >
                Set
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              Cancel Retaliation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="number"
                value={retaliationId}
                onChange={(e) => setRetaliationId(e.target.value)}
                className="w-full sm:w-[180px]"
                placeholder="Retaliation ID"
              />
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={!retaliationId}
                onClick={handleCancelRetaliation}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              NPC Brain Tick
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            <Button
              className="w-full sm:w-auto"
              onClick={handleTick}
            >
              Run Tick
            </Button>
            {tickResult && (
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                {tickResult}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      <VillageTable
        data={villages}
        isLoading={villagesLoading}
      />
    </div>
  );
};
