import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'app/components/ui/card';
import { Skeleton } from 'app/components/ui/skeleton';

interface OverviewData {
  totalNpcVillages: number;
  totalTroops: number;
  avgAggression: number;
  avgFieldLevel: number;
  totalBuilds: number;
  villagesWithHighAggression: number;
  totalPopulation: number;
}

const cards = [
  {
    key: 'totalNpcVillages',
    title: 'NPC Villages',
    icon: '🏘️',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'totalTroops',
    title: 'Total Troops',
    icon: '⚔️',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'totalPopulation',
    title: 'Total Population',
    icon: '👥',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'avgFieldLevel',
    title: 'Avg Field Level',
    icon: '🌾',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    format: (v: number) => v.toFixed(1),
  },
  {
    key: 'avgAggression',
    title: 'Avg Aggression',
    icon: '🔥',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    format: (v: number) => v.toFixed(2),
  },
  {
    key: 'totalBuilds',
    title: 'Builds Completed',
    icon: '🏗️',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'villagesWithHighAggression',
    title: 'High Threat',
    icon: '🚨',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    format: (v: number) => v.toLocaleString(),
  },
];

export const OverviewCards = ({
  data,
  isLoading,
}: {
  data?: OverviewData;
  isLoading: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
      {cards.map((card) => (
        <Card
          key={card.key}
          className="overflow-hidden"
        >
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <div className="flex items-center justify-between gap-1">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight truncate">
                {t(card.title)}
              </CardTitle>
              <div className={`rounded p-0.5 sm:p-1 shrink-0 ${card.bg}`}>
                <span className={`text-xs sm:text-sm ${card.color}`}>
                  {card.icon}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
            ) : (
              <div className="text-lg sm:text-xl md:text-2xl font-bold leading-tight truncate">
                {card.format(data?.[card.key as keyof OverviewData] ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
