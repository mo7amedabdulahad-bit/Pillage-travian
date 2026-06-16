import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Text } from 'app/components/text';
import { ActivityFeed } from './components/activity-feed';
import { FactionBreakdown } from './components/faction-breakdown';
import { GrowthChart } from './components/growth-chart';
import { OverviewCards } from './components/overview-cards';
import { VillageTable } from './components/village-table';

export default function NpcDashboardPage() {
  const { t } = useTranslation();
  const { fetcher } = use(ApiContext);

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

  const isLoading =
    overviewLoading || factionsLoading || villagesLoading || activityLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <Text
              as="h1"
              className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate"
            >
              {t('NPC Brain Dashboard')}
            </Text>
            <Text className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
              {t('Monitor and manage all NPC village activity in real time')}
            </Text>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground shrink-0">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {t('Live')}
            </div>
          )}
        </div>

        {/* Overview Cards */}
        <OverviewCards
          data={overview}
          isLoading={overviewLoading}
        />

        {/* Faction Breakdown */}
        <FactionBreakdown
          data={factions}
          isLoading={factionsLoading}
        />

        {/* Growth Chart + Activity Feed side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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

        {/* Village Table */}
        <VillageTable
          data={villages}
          isLoading={villagesLoading}
        />
      </div>
    </div>
  );
}
