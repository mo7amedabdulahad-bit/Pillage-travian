import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useState } from 'react';
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

type Village = {
  id: number;
  name: string;
  x: number;
  y: number;
};

type WorldWonderData = {
  village_id: number;
  owner_faction_id: string;
  current_level: number;
  name: string | null;
};

export const WorldWonderTab = () => {
  const { fetcher } = use(ApiContext);
  const {
    startWorldWonder,
    setWorldWonderLevel,
    grantConstructionPlan,
    endServer,
    resetServerEnd,
  } = useAdminDashboard();
  const [startVillageId, setStartVillageId] = useState<string>('');
  const [levelVillageId, setLevelVillageId] = useState<string>('');
  const [wwLevel, setWwLevel] = useState('1');
  const [heroId, setHeroId] = useState('');

  const { data: villages } = useSuspenseQuery({
    queryKey: ['player-villages'],
    queryFn: async () => {
      const response = await fetcher<Village[]>('/me/villages');
      return response.data ?? [];
    },
  });

  const { data: _wonders } = useSuspenseQuery({
    queryKey: ['admin-world-wonders'],
    queryFn: async () => {
      const response = await fetcher<WorldWonderData[]>(
        '/admin/npc-dashboard/villages',
      );
      return response.data ?? [];
    },
  });

  const handleStart = async () => {
    if (!startVillageId) {
      return;
    }
    await startWorldWonder({ villageId: Number(startVillageId) });
  };

  const handleSetLevel = async () => {
    if (!levelVillageId) {
      return;
    }
    await setWorldWonderLevel({
      villageId: Number(levelVillageId),
      level: Number(wwLevel),
    });
  };

  const handleGrantPlan = async () => {
    if (!heroId) {
      return;
    }
    await grantConstructionPlan({ heroId: Number(heroId) });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            Your Villages ({villages?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="hidden md:block rounded-md border overflow-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-background z-10 border-b">
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Coords</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {villages?.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b last:border-0"
                  >
                    <td className="p-3">{v.name}</td>
                    <td className="p-3 text-muted-foreground">
                      [{v.x},{v.y}]
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStartVillageId(String(v.id))}
                      >
                        Select
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {villages?.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium text-sm">{v.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    [{v.x},{v.y}]
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStartVillageId(String(v.id))}
                >
                  Select
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              Start World Wonder
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={startVillageId}
                onValueChange={setStartVillageId}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Village" />
                </SelectTrigger>
                <SelectContent>
                  {villages?.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={String(v.id)}
                    >
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full sm:w-auto"
                disabled={!startVillageId}
                onClick={handleStart}
              >
                Start
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Set WW Level</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={levelVillageId}
                onValueChange={setLevelVillageId}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Village" />
                </SelectTrigger>
                <SelectContent>
                  {villages?.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={String(v.id)}
                    >
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={wwLevel}
                onChange={(e) => setWwLevel(e.target.value)}
                className="w-full sm:w-20"
                min={0}
                max={20}
              />
              <Button
                className="w-full sm:w-auto"
                disabled={!levelVillageId}
                onClick={handleSetLevel}
              >
                Set Level
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              Grant Construction Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="number"
                value={heroId}
                onChange={(e) => setHeroId(e.target.value)}
                className="w-full sm:w-[200px]"
                placeholder="Hero ID"
              />
              <Button
                className="w-full sm:w-auto"
                disabled={!heroId}
                onClick={handleGrantPlan}
              >
                Grant
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            Server End Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => endServer({ winnerType: 'player' })}
            >
              End (Player Wins)
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => endServer({ winnerType: 'natars' })}
            >
              End (Natars Win)
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => resetServerEnd()}
            >
              Reset Server End
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
