import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from 'app/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'app/components/ui/card';
import { Input } from 'app/components/ui/input';
import { Skeleton } from 'app/components/ui/skeleton';

interface VillageData {
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

const getAggressionBadge = (level: number) => {
  if (level >= 4) {
    return { label: 'Critical', className: 'bg-red-500 text-white' };
  }
  if (level >= 3) {
    return { label: 'High', className: 'bg-orange-500 text-white' };
  }
  if (level >= 2) {
    return { label: 'Medium', className: 'bg-yellow-500 text-black' };
  }
  if (level >= 1) {
    return { label: 'Low', className: 'bg-blue-500 text-white' };
  }
  return { label: 'Peaceful', className: 'bg-green-500 text-white' };
};

export const VillageTable = ({
  data,
  isLoading,
}: {
  data?: VillageData[];
  isLoading: boolean;
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof VillageData>('totalTroops');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    if (!data) {
      return [];
    }
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.villageName.toLowerCase().includes(q) ||
          v.factionKey.toLowerCase().includes(q) ||
          FACTION_NAMES[v.factionKey]?.toLowerCase().includes(q) ||
          String(v.villageId).includes(q),
      );
    }
    result = [...result].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return result;
  }, [data, search, sortKey, sortDir]);

  const handleSort = (key: keyof VillageData) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-2xl">
            {t('All NPC Villages')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Skeleton className="h-[200px] sm:h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <CardTitle className="text-lg sm:text-2xl">
            {t('All NPC Villages')} ({data?.length ?? 0})
          </CardTitle>
          <Input
            placeholder={t('Search villages...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {/* Desktop table */}
        <div className="hidden md:block rounded-md border overflow-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 bg-background z-10 border-b">
                <th
                  className="cursor-pointer hover:text-foreground p-3 text-left font-medium"
                  onClick={() => handleSort('villageName')}
                >
                  {t('Village')}
                  {sortKey === 'villageName' &&
                    (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className="cursor-pointer hover:text-foreground p-3 text-left font-medium"
                  onClick={() => handleSort('factionKey')}
                >
                  {t('Faction')}
                  {sortKey === 'factionKey' &&
                    (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className="cursor-pointer hover:text-foreground p-3 text-right font-medium"
                  onClick={() => handleSort('totalTroops')}
                >
                  {t('Troops')}
                  {sortKey === 'totalTroops' &&
                    (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className="cursor-pointer hover:text-foreground p-3 text-right font-medium"
                  onClick={() => handleSort('population')}
                >
                  {t('Pop.')}
                  {sortKey === 'population' &&
                    (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className="cursor-pointer hover:text-foreground p-3 text-right font-medium"
                  onClick={() => handleSort('fieldLevelSum')}
                >
                  {t('Fields')}
                  {sortKey === 'fieldLevelSum' &&
                    (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className="cursor-pointer hover:text-foreground p-3 text-right font-medium"
                  onClick={() => handleSort('aggressionLevel')}
                >
                  {t('Aggro')}
                  {sortKey === 'aggressionLevel' &&
                    (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className="cursor-pointer hover:text-foreground p-3 text-right font-medium"
                  onClick={() => handleSort('currentLoot')}
                >
                  {t('Loot')}
                  {sortKey === 'currentLoot' &&
                    (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th className="p-3 text-right font-medium">{t('Tier')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((village) => {
                const aggBadge = getAggressionBadge(village.aggressionLevel);
                const lootPercent = Math.round(village.currentLoot * 100);
                return (
                  <tr
                    key={village.villageId}
                    className="border-b last:border-0"
                  >
                    <td className="p-3">
                      <div>
                        <span className="font-medium">
                          {village.villageName}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          [{village.x},{village.y}]
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              FACTION_COLORS[village.factionKey] ?? '#94a3b8',
                          }}
                        />
                        <span className="text-xs truncate">
                          {FACTION_NAMES[village.factionKey] ??
                            village.factionKey}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      {village.totalTroops.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      {village.population.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      {village.fieldLevelSum}
                    </td>
                    <td className="p-3 text-right">
                      <Badge className={`${aggBadge.className} text-xs`}>
                        {aggBadge.label}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${lootPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {lootPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right text-xs text-muted-foreground">
                      {village.simulationTier}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-2">
          {filtered.map((village) => {
            const aggBadge = getAggressionBadge(village.aggressionLevel);
            const lootPercent = Math.round(village.currentLoot * 100);
            return (
              <div
                key={village.villageId}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          FACTION_COLORS[village.factionKey] ?? '#94a3b8',
                      }}
                    />
                    <span className="font-medium text-sm truncate">
                      {village.villageName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      [{village.x},{village.y}]
                    </span>
                  </div>
                  <Badge
                    className={`${aggBadge.className} text-[10px] px-1.5 py-0 shrink-0`}
                  >
                    {aggBadge.label}
                  </Badge>
                </div>

                <div className="flex items-center text-[11px] text-muted-foreground gap-1">
                  <span>
                    {FACTION_NAMES[village.factionKey] ?? village.factionKey}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="block text-foreground font-medium font-mono">
                      {village.totalTroops.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">{t('Troops')}</span>
                  </div>
                  <div>
                    <span className="block text-foreground font-medium font-mono">
                      {village.population.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">{t('Pop.')}</span>
                  </div>
                  <div>
                    <span className="block text-foreground font-medium font-mono">
                      {village.fieldLevelSum}
                    </span>
                    <span className="text-muted-foreground">{t('Fields')}</span>
                  </div>
                  <div>
                    <span className="block text-foreground font-medium font-mono">
                      {village.simulationTier}
                    </span>
                    <span className="text-muted-foreground">{t('Tier')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {t('Loot')}:
                  </span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${lootPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-7 text-right shrink-0">
                    {lootPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
