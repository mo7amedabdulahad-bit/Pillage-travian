import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'app/components/ui/card';
import { Skeleton } from 'app/components/ui/skeleton';

interface BuildHistoryEntry {
  hour: number;
  builds: number;
}

export const GrowthChart = ({
  data,
  isLoading,
}: {
  data?: BuildHistoryEntry[];
  isLoading: boolean;
}) => {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.map((d) => ({
      time: new Date(d.hour * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      builds: d.builds,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-2xl">
            {t('Building Activity (24h)')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Skeleton className="h-[200px] sm:h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-lg sm:text-2xl">
          {t('Building Activity (24h)')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[150px] sm:h-[200px] md:h-[300px] text-muted-foreground text-sm">
            {t('No building activity recorded yet')}
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={200}
          >
            <AreaChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="opacity-30"
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={45}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="builds"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
