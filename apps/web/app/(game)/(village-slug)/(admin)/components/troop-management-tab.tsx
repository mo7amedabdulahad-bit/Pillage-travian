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

type TroopEntry = {
  unitId: string;
  name: string;
  amount: number;
};

type VillageTroops = {
  villageId: number;
  troops: TroopEntry[];
};

const UNIT_TYPES = [
  { id: '1', name: 'Clubswinger' },
  { id: '2', name: 'Swordsman' },
  { id: '3', name: 'Axeman' },
  { id: '4', name: 'Scout' },
  { id: '5', name: 'Paladin' },
  { id: '6', name: 'Teutonic Knight' },
  { id: '7', name: 'Ram' },
  { id: '8', name: 'Catapult' },
  { id: '9', name: 'Nobleman' },
  { id: '10', name: 'Settler' },
];

export const TroopManagementTab = () => {
  const { fetcher } = use(ApiContext);
  const { spawnTroops, removeTroops } = useAdminDashboard();
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');
  const [spawnUnitId, setSpawnUnitId] = useState<string>('');
  const [spawnAmount, setSpawnAmount] = useState('1');
  const [removeUnitId, setRemoveUnitId] = useState<string>('');
  const [removeAmount, setRemoveAmount] = useState('1');

  const { data: villages } = useSuspenseQuery({
    queryKey: ['player-villages'],
    queryFn: async () => {
      const response = await fetcher<Village[]>('/me/villages');
      return response.data ?? [];
    },
  });

  const { data: troopData } = useSuspenseQuery({
    queryKey: ['admin-troop-data', selectedVillageId],
    queryFn: async () => {
      if (!selectedVillageId) {
        return null;
      }
      const response = await fetcher<VillageTroops>(
        `/villages/${selectedVillageId}/troops`,
      );
      return response.data;
    },
  });

  const handleSpawn = async () => {
    if (!selectedVillageId || !spawnUnitId || !spawnAmount) {
      return;
    }
    await spawnTroops({
      villageId: Number(selectedVillageId),
      troops: [{ unitId: spawnUnitId, amount: Number(spawnAmount) }],
    });
    setSpawnAmount('1');
  };

  const handleRemove = async () => {
    if (!selectedVillageId || !removeUnitId || !removeAmount) {
      return;
    }
    await removeTroops({
      villageId: Number(selectedVillageId),
      troops: [{ unitId: removeUnitId, amount: Number(removeAmount) }],
    });
    setRemoveAmount('1');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Select Village</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <Select
            value={selectedVillageId}
            onValueChange={setSelectedVillageId}
          >
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Choose a village" />
            </SelectTrigger>
            <SelectContent>
              {villages?.map((v) => (
                <SelectItem
                  key={v.id}
                  value={String(v.id)}
                >
                  {v.name} [{v.x},{v.y}]
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedVillageId && troopData && (
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              Troops in{' '}
              {villages?.find((v) => String(v.id) === selectedVillageId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="hidden md:block rounded-md border overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="sticky top-0 bg-background z-10 border-b">
                    <th className="p-3 text-left font-medium">Unit</th>
                    <th className="p-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {troopData.troops?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="p-3 text-center text-muted-foreground"
                      >
                        No troops
                      </td>
                    </tr>
                  ) : (
                    troopData.troops?.map((t) => (
                      <tr
                        key={t.unitId}
                        className="border-b last:border-0"
                      >
                        <td className="p-3">{t.name}</td>
                        <td className="p-3 text-right font-mono">
                          {t.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-2">
              {troopData.troops?.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm p-3">
                  No troops
                </div>
              ) : (
                troopData.troops?.map((t) => (
                  <div
                    key={t.unitId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm">{t.name}</span>
                    <span className="font-mono text-sm">
                      {t.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Spawn Troops</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={spawnUnitId}
                onValueChange={setSpawnUnitId}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Unit type" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((u) => (
                    <SelectItem
                      key={u.id}
                      value={u.id}
                    >
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={spawnAmount}
                onChange={(e) => setSpawnAmount(e.target.value)}
                className="w-full sm:w-24"
                min={1}
                placeholder="Amount"
              />
              <Button
                className="w-full sm:w-auto"
                disabled={!selectedVillageId || !spawnUnitId}
                onClick={handleSpawn}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              Remove Troops
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={removeUnitId}
                onValueChange={setRemoveUnitId}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Unit type" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((u) => (
                    <SelectItem
                      key={u.id}
                      value={u.id}
                    >
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={removeAmount}
                onChange={(e) => setRemoveAmount(e.target.value)}
                className="w-full sm:w-24"
                min={1}
                placeholder="Amount"
              />
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={!selectedVillageId || !removeUnitId}
                onClick={handleRemove}
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
