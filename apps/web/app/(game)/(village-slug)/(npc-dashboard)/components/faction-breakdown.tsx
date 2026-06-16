import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from 'app/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'app/components/ui/card';
import { Skeleton } from 'app/components/ui/skeleton';

interface FactionData {
  factionKey: string;
  factionName: string;
  villageCount: number;
  totalTroops: number;
  avgFieldLevel: number;
  totalPopulation: number;
  aggressionLevel: number;
  topVillageName: string;
  topVillageTroops: number;
}

const FACTION_COLORS: Record<string, string> = {
  npc1: '#ef4444',
  npc2: '#f59e0b',
  npc3: '#3b82f6',
  npc4: '#10b981',
  npc5: '#8b5cf6',
  npc6: '#ec4899',
  npc7: '#06b6d4',
  npc8: '#f97316',
  npc9: '#6366f1',
};

const FACTION_NAMES: Record<string, string> = {
  npc1: 'Iron Legion',
  npc2: 'Golden Empire',
  npc3: 'Blue Horde',
  npc4: 'Emerald Wardens',
  npc5: 'Violet Storm',
  npc6: 'Crimson Fang',
  npc7: 'Cyan Coalition',
  npc8: 'Amber Pact',
  npc9: 'Indigo Bastion',
};

const getAggressionColor = (level: number) => {
  if (level >= 4) {
    return 'bg-red-500';
  }
  if (level >= 3) {
    return 'bg-orange-500';
  }
  if (level >= 2) {
    return 'bg-yellow-500';
  }
  if (level >= 1) {
    return 'bg-blue-500';
  }
  return 'bg-green-500';
};

const getAggressionLabel = (level: number) => {
  if (level >= 4) {
    return 'Critical';
  }
  if (level >= 3) {
    return 'High';
  }
  if (level >= 2) {
    return 'Medium';
  }
  if (level >= 1) {
    return 'Low';
  }
  return 'Peaceful';
};

export const FactionBreakdown = ({
  data,
  isLoading,
}: {
  data?: FactionData[];
  isLoading: boolean;
}) => {
  const { t } = useTranslation();

  const pieData = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.map((f) => ({
      name: FACTION_NAMES[f.factionKey] ?? f.factionKey,
      value: f.villageCount,
      fill: FACTION_COLORS[f.factionKey] ?? '#94a3b8',
    }));
  }, [data]);

  const barData = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.map((f) => ({
      name: FACTION_NAMES[f.factionKey] ?? f.factionKey,
      troops: f.totalTroops,
      population: f.totalPopulation,
      villages: f.villageCount,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-2xl">
            {t('Faction Breakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Skeleton className="h-[200px] sm:h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-lg sm:text-2xl">
          {t('Faction Breakdown')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Pie Chart - Village Distribution */}
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-4">
              {t('Villages by Faction')}
            </h3>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Pie
                      // biome-ignore lint/suspicious/noArrayIndexKey: Recharts Pie requires positional fills
                      key={`pie-${index}`}
                      fill={entry.fill}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Military & Population */}
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-4">
              {t('Military & Population by Faction')}
            </h3>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="opacity-30"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="troops"
                  name={t('Troops')}
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="population"
                  name={t('Population')}
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Faction Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
          {data?.map((faction) => (
            <div
              key={faction.factionKey}
              className="rounded-lg border p-3 sm:p-4 space-y-2 sm:space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        FACTION_COLORS[faction.factionKey] ?? '#94a3b8',
                    }}
                  />
                  <span className="font-semibold text-xs sm:text-sm truncate">
                    {FACTION_NAMES[faction.factionKey] ?? faction.factionKey}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`${getAggressionColor(faction.aggressionLevel)} text-white text-[10px] sm:text-xs shrink-0`}
                >
                  {getAggressionLabel(faction.aggressionLevel)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <div>
                  <span className="block text-foreground font-medium">
                    {faction.villageCount}
                  </span>
                  {t('Villages')}
                </div>
                <div>
                  <span className="block text-foreground font-medium">
                    {faction.totalTroops.toLocaleString()}
                  </span>
                  {t('Troops')}
                </div>
                <div>
                  <span className="block text-foreground font-medium">
                    {faction.avgFieldLevel.toFixed(1)}
                  </span>
                  {t('Avg Field Lvl')}
                </div>
                <div>
                  <span className="block text-foreground font-medium">
                    {faction.totalPopulation.toLocaleString()}
                  </span>
                  {t('Population')}
                </div>
              </div>

              {faction.topVillageName && (
                <div className="text-[10px] sm:text-xs text-muted-foreground border-t pt-1.5 sm:pt-2">
                  <span className="text-foreground font-medium truncate block">
                    {faction.topVillageName}
                  </span>
                  <span>
                    {faction.topVillageTroops.toLocaleString()} {t('troops')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
