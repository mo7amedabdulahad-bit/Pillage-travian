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
  resources?: {
    lumber: number;
    clay: number;
    iron: number;
    crop: number;
  };
};

const BULK_AMOUNT = 100_000;

export const EconomyTab = () => {
  const { fetcher } = use(ApiContext);
  const { setResources, addResources } = useAdminDashboard();
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');
  const [lumber, setLumber] = useState('0');
  const [clay, setClay] = useState('0');
  const [iron, setIron] = useState('0');
  const [crop, setCrop] = useState('0');

  const { data: villages } = useSuspenseQuery({
    queryKey: ['admin-all-villages'],
    queryFn: async () => {
      const { data } = await fetcher('/admin/villages');
      return (data ?? []) as Village[];
    },
  });

  const handleSet = async () => {
    if (!selectedVillageId) {
      return;
    }
    await setResources({
      villageId: Number(selectedVillageId),
      lumber: Number(lumber),
      clay: Number(clay),
      iron: Number(iron),
      crop: Number(crop),
    });
  };

  const handleAdd = async () => {
    if (!selectedVillageId) {
      return;
    }
    await addResources({
      villageId: Number(selectedVillageId),
      lumber: Number(lumber),
      clay: Number(clay),
      iron: Number(iron),
      crop: Number(crop),
    });
  };

  const handleBulkAll = async () => {
    if (!villages) {
      return;
    }
    for (const v of villages) {
      await addResources({
        villageId: v.id,
        lumber: BULK_AMOUNT,
        clay: BULK_AMOUNT,
        iron: BULK_AMOUNT,
        crop: BULK_AMOUNT,
      });
    }
  };

  const selectedVillage = villages?.find(
    (v) => String(v.id) === selectedVillageId,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            Resource Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="hidden md:block rounded-md border overflow-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-background z-10 border-b">
                  <th className="p-3 text-left font-medium">Village</th>
                  <th className="p-3 text-right font-medium">Lumber</th>
                  <th className="p-3 text-right font-medium">Clay</th>
                  <th className="p-3 text-right font-medium">Iron</th>
                  <th className="p-3 text-right font-medium">Crop</th>
                </tr>
              </thead>
              <tbody>
                {villages?.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedVillageId(String(v.id))}
                  >
                    <td className="p-3">
                      <div className="font-medium">{v.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        [{v.x},{v.y}]
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono">
                      {v.resources?.lumber?.toLocaleString() ?? 0}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {v.resources?.clay?.toLocaleString() ?? 0}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {v.resources?.iron?.toLocaleString() ?? 0}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {v.resources?.crop?.toLocaleString() ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {villages?.map((v) => (
              <button
                type="button"
                key={v.id}
                className="rounded-lg border p-3 space-y-2 cursor-pointer w-full text-left"
                onClick={() => setSelectedVillageId(String(v.id))}
              >
                <div className="font-medium text-sm">{v.name}</div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="block font-mono text-foreground">
                      {v.resources?.lumber?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Lumber</span>
                  </div>
                  <div>
                    <span className="block font-mono text-foreground">
                      {v.resources?.clay?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Clay</span>
                  </div>
                  <div>
                    <span className="block font-mono text-foreground">
                      {v.resources?.iron?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Iron</span>
                  </div>
                  <div>
                    <span className="block font-mono text-foreground">
                      {v.resources?.crop?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Crop</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            Modify Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <Select
            value={selectedVillageId}
            onValueChange={setSelectedVillageId}
          >
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select village" />
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label
                htmlFor="lumber"
                className="text-xs text-muted-foreground"
              >
                Lumber
              </label>
              <Input
                id="lumber"
                type="number"
                value={lumber}
                onChange={(e) => setLumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="clay"
                className="text-xs text-muted-foreground"
              >
                Clay
              </label>
              <Input
                id="clay"
                type="number"
                value={clay}
                onChange={(e) => setClay(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="iron"
                className="text-xs text-muted-foreground"
              >
                Iron
              </label>
              <Input
                id="iron"
                type="number"
                value={iron}
                onChange={(e) => setIron(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="crop"
                className="text-xs text-muted-foreground"
              >
                Crop
              </label>
              <Input
                id="crop"
                type="number"
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="w-full sm:w-auto"
              disabled={!selectedVillageId}
              onClick={handleSet}
            >
              Set Resources
            </Button>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={!selectedVillageId}
              onClick={handleAdd}
            >
              Add Resources
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            Bulk Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Give {BULK_AMOUNT.toLocaleString()} of each resource to all{' '}
              {villages?.length ?? 0} villages
            </div>
            <Button
              variant="confirm"
              className="w-full sm:w-auto"
              onClick={handleBulkAll}
            >
              Give 100k All Resources
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedVillage && (
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">
              {selectedVillage.name} - Current Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold font-mono">
                  {selectedVillage.resources?.lumber?.toLocaleString() ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">Lumber</div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono">
                  {selectedVillage.resources?.clay?.toLocaleString() ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">Clay</div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono">
                  {selectedVillage.resources?.iron?.toLocaleString() ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">Iron</div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono">
                  {selectedVillage.resources?.crop?.toLocaleString() ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">Crop</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
