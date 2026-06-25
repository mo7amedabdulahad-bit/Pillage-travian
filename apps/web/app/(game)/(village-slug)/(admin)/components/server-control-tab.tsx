import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useState } from 'react';
import { useAdminDashboard } from 'app/(game)/(village-slug)/hooks/use-admin-dashboard';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Button } from 'app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'app/components/ui/card';
import { Input } from 'app/components/ui/input';

export const ServerControlTab = () => {
  const { fetcher } = use(ApiContext);
  const { developerSettings, updateDeveloperSetting } = useDeveloperSettings();
  const { setGameSpeed, endServer, resetServerEnd, triggerNpcBrainTick } =
    useAdminDashboard();
  const [speed, setSpeed] = useState('1');
  const [tickResult, setTickResult] = useState<string | null>(null);

  const { data: server } = useSuspenseQuery({
    queryKey: ['server'],
    queryFn: async () => {
      const response = await fetcher<Record<string, unknown>>('/server');
      return response.data;
    },
  });

  const handleSetSpeed = () => {
    setGameSpeed({ speed: Number.parseFloat(speed) });
  };

  const handleEndServer = (winnerType: 'player' | 'natars') => {
    endServer({ winnerType });
  };

  const handleResetEnd = () => {
    resetServerEnd();
  };

  const handleTick = async () => {
    const result = await triggerNpcBrainTick();
    setTickResult(JSON.stringify(result?.data, null, 2));
  };

  const settingsKeys = [
    'isInstantBuildingConstructionEnabled',
    'isInstantUnitTrainingEnabled',
    'isInstantUnitImprovementEnabled',
    'isInstantUnitResearchEnabled',
    'isInstantUnitTravelEnabled',
    'isFreeBuildingConstructionEnabled',
    'isFreeUnitTrainingEnabled',
    'isFreeUnitImprovementEnabled',
    'isFreeUnitResearchEnabled',
    'isInstantHeroReviveEnabled',
    'isFreeHeroReviveEnabled',
    'isMaxLevelUpgradeEnabled',
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Server Status</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-2 text-xs sm:text-sm">
          <div>Speed: {server?.speed as number}</div>
          <div>Map Size: {server?.mapSize as number}</div>
          <div>Winner: {(server?.winnerType as string) ?? 'None'}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Game Speed</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex gap-2">
            <Input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="w-20"
              min={0.5}
              max={10}
              step={0.5}
            />
            <Button
              size="sm"
              onClick={handleSetSpeed}
            >
              Set
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            Server Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleEndServer('player')}
            >
              End (Player Wins)
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleEndServer('natars')}
            >
              End (Natars Win)
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetEnd}
          >
            Reset Server End
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">NPC Brain</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
          <Button
            size="sm"
            onClick={handleTick}
          >
            Run NPC Brain Tick
          </Button>
          {tickResult && (
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {tickResult}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            Developer Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {settingsKeys.map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={developerSettings[key]}
                  onChange={(e) =>
                    updateDeveloperSetting({
                      developerSettingName: key,
                      value: e.target.checked,
                    })
                  }
                />
                <span>
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^is/, '')
                    .trim()}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
