import { useTranslation } from 'react-i18next';
import { Badge } from 'app/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'app/components/ui/card';
import { Skeleton } from 'app/components/ui/skeleton';

interface ActivityData {
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

const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${days}d ago`;
};

const formatTimeUntil = (timestamp: number) => {
  const diff = timestamp - Date.now();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  if (minutes < 1) {
    return 'imminent';
  }
  if (minutes < 60) {
    return `in ${minutes}m`;
  }
  return `in ${hours}h`;
};

export const ActivityFeed = ({
  data,
  isLoading,
}: {
  data?: ActivityData;
  isLoading: boolean;
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-2xl">
            {t('Recent Activity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
              key={i}
              className="h-10 sm:h-12 w-full"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  const allEvents: {
    type: 'build' | 'raid' | 'retaliation';
    timestamp: number;
    villageName: string;
    factionKey: string;
    description: string;
    detail: string;
  }[] = [];

  for (const build of data?.recentBuilds?.slice(0, 15) ?? []) {
    allEvents.push({
      type: 'build',
      timestamp: build.timestamp * (build.timestamp < 1e12 ? 1000 : 1),
      villageName: build.villageName,
      factionKey: build.factionKey,
      description: `Built ${build.building}`,
      detail: `Level ${build.oldLevel} → ${build.newLevel}`,
    });
  }

  for (const raid of data?.recentRaids?.slice(0, 10) ?? []) {
    const totalLoot =
      raid.lootWood + raid.lootClay + raid.lootIron + raid.lootWheat;
    allEvents.push({
      type: 'raid',
      timestamp: raid.timestamp,
      villageName: raid.villageName,
      factionKey: raid.factionKey,
      description: 'Raided by player',
      detail: `${Math.round(totalLoot)} resources stolen`,
    });
  }

  for (const ret of data?.pendingRetaliations?.slice(0, 5) ?? []) {
    allEvents.push({
      type: 'retaliation',
      timestamp: ret.scheduledAtMs,
      villageName: ret.villageName,
      factionKey: ret.factionKey,
      description: `Retaliation queued (Tier ${ret.tier})`,
      detail: formatTimeUntil(ret.executeAtMs),
    });
  }

  allEvents.sort((a, b) => b.timestamp - a.timestamp);
  const events = allEvents.slice(0, 20);

  return (
    <Card className="h-full">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-lg sm:text-2xl">
          {t('Recent Activity')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-[150px] sm:h-[200px] text-muted-foreground text-sm">
            {t('No activity yet')}
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
            {events.map((event, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable sort order, index is safe
                key={`${event.type}-${event.timestamp}-${i}`}
                className="flex items-start gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 text-xs sm:text-sm"
              >
                <div
                  className="mt-1 h-2 w-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      event.type === 'build'
                        ? '#8b5cf6'
                        : event.type === 'raid'
                          ? '#ef4444'
                          : '#f59e0b',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {event.villageName}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] sm:text-[10px] px-1 py-0"
                      style={{
                        borderColor:
                          FACTION_COLORS[event.factionKey] ?? '#94a3b8',
                        color: FACTION_COLORS[event.factionKey] ?? '#94a3b8',
                      }}
                    >
                      {event.factionKey}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-0.5 truncate">
                    {event.description}{' '}
                    <span className="text-foreground">{event.detail}</span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {formatTimeAgo(event.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
