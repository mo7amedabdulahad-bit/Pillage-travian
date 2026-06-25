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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Input } from 'app/components/ui/input';

type Village = {
  id: number;
  name: string;
  slug: string;
  x: number;
  y: number;
  hero?: {
    health: number;
    maxHealth: number;
    level: number;
    items: Array<{ id: number; name: string; amount: number }>;
  };
  resources?: {
    lumber: number;
    clay: number;
    iron: number;
    crop: number;
  };
  buildings?: Array<{
    fieldId: number;
    name: string;
    level: number;
    x: number;
    y: number;
  }>;
  troops?: Array<{ unitId: string; name: string; amount: number }>;
};

export const PlayerVillageTab = () => {
  const { fetcher } = use(ApiContext);
  const { renameVillage, deleteVillage, upgradeBuilding, downgradeBuilding } =
    useAdminDashboard();
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [renameTarget, setRenameTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [buildingEdits, setBuildingEdits] = useState<Record<number, number>>(
    {},
  );

  const { data: villages } = useSuspenseQuery({
    queryKey: ['admin-all-villages'],
    queryFn: async () => {
      const { data } = await fetcher('/admin/villages');
      return (data ?? []) as Village[];
    },
  });

  const { data: heroData } = useSuspenseQuery({
    queryKey: ['admin-hero-overview'],
    queryFn: async () => {
      const { data } = await fetcher('/admin/hero-overview');
      return data as Record<string, unknown> | undefined;
    },
  });

  const handleRename = async (villageId: number) => {
    if (!renameValue.trim()) {
      return;
    }
    await renameVillage({ villageId, name: renameValue.trim() });
    setRenameTarget(null);
    setRenameValue('');
  };

  const handleDelete = async (villageId: number) => {
    await deleteVillage({ villageId });
    setSelectedVillage(null);
  };

  const handleBuildingLevelChange = async (
    villageId: number,
    fieldId: number,
    targetLevel: number,
  ) => {
    if (targetLevel < 0) {
      await downgradeBuilding({ villageId, fieldId, targetLevel });
    } else {
      await upgradeBuilding({ villageId, fieldId, targetLevel });
    }
    setBuildingEdits((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            Player Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold">
                {((heroData as Record<string, unknown>)?.level as number) ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Hero Level</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold">
                {((heroData as Record<string, unknown>)?.health as number) ?? 0}
                /
                {((heroData as Record<string, unknown>)?.maxHealth as number) ??
                  0}
              </div>
              <div className="text-xs text-muted-foreground">Health</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold">
                {((heroData as Record<string, unknown>)?.items as unknown[])
                  ?.length ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Items</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold">
                {villages?.length ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Villages</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            All Villages ({villages?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="hidden md:block rounded-md border overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-background z-10 border-b">
                  <th className="p-3 text-left font-medium">Village</th>
                  <th className="p-3 text-left font-medium">Coords</th>
                  <th className="p-3 text-right font-medium">Lumber</th>
                  <th className="p-3 text-right font-medium">Clay</th>
                  <th className="p-3 text-right font-medium">Iron</th>
                  <th className="p-3 text-right font-medium">Crop</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {villages?.map((village) => (
                  <tr
                    key={village.id}
                    className="border-b last:border-0"
                  >
                    <td className="p-3 font-medium">{village.name}</td>
                    <td className="p-3 text-muted-foreground">
                      [{village.x},{village.y}]
                    </td>
                    <td className="p-3 text-right font-mono">
                      {village.resources?.lumber?.toLocaleString() ?? 0}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {village.resources?.clay?.toLocaleString() ?? 0}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {village.resources?.iron?.toLocaleString() ?? 0}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {village.resources?.crop?.toLocaleString() ?? 0}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVillage(village)}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRenameTarget({
                              id: village.id,
                              name: village.name,
                            });
                            setRenameValue(village.name);
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(village.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {villages?.map((village) => (
              <div
                key={village.id}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{village.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      [{village.x},{village.y}]
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedVillage(village)}
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRenameTarget({ id: village.id, name: village.name });
                        setRenameValue(village.name);
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(village.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="block font-mono text-foreground">
                      {village.resources?.lumber?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Lumber</span>
                  </div>
                  <div>
                    <span className="block font-mono text-foreground">
                      {village.resources?.clay?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Clay</span>
                  </div>
                  <div>
                    <span className="block font-mono text-foreground">
                      {village.resources?.iron?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Iron</span>
                  </div>
                  <div>
                    <span className="block font-mono text-foreground">
                      {village.resources?.crop?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Crop</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedVillage}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVillage(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedVillage?.name}</DialogTitle>
          </DialogHeader>
          {selectedVillage && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Resources</h4>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="block font-mono">
                      {selectedVillage.resources?.lumber?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Lumber</span>
                  </div>
                  <div>
                    <span className="block font-mono">
                      {selectedVillage.resources?.clay?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Clay</span>
                  </div>
                  <div>
                    <span className="block font-mono">
                      {selectedVillage.resources?.iron?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Iron</span>
                  </div>
                  <div>
                    <span className="block font-mono">
                      {selectedVillage.resources?.crop?.toLocaleString() ?? 0}
                    </span>
                    <span className="text-muted-foreground">Crop</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Buildings</h4>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {selectedVillage.buildings?.map((building) => (
                    <div
                      key={building.fieldId}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="flex-1 truncate">{building.name}</span>
                      <span className="text-muted-foreground">
                        [{building.x},{building.y}]
                      </span>
                      <span className="font-mono w-8 text-right">
                        Lvl {building.level}
                      </span>
                      <Input
                        type="number"
                        className="w-16 h-7"
                        value={buildingEdits[building.fieldId] ?? ''}
                        placeholder="Lv"
                        onChange={(e) =>
                          setBuildingEdits((prev) => ({
                            ...prev,
                            [building.fieldId]: Number(e.target.value),
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        onClick={() =>
                          handleBuildingLevelChange(
                            selectedVillage.id,
                            building.fieldId,
                            buildingEdits[building.fieldId] ?? building.level,
                          )
                        }
                      >
                        Set
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Troops</h4>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {selectedVillage.troops?.map((troop) => (
                    <div
                      key={troop.unitId}
                      className="flex justify-between"
                    >
                      <span className="truncate">{troop.name}</span>
                      <span className="font-mono ml-2">
                        {troop.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedVillage.hero && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Hero</h4>
                  <div className="text-xs space-y-1">
                    <div>
                      Level:{' '}
                      <span className="font-mono">
                        {selectedVillage.hero.level}
                      </span>
                    </div>
                    <div>
                      Health:{' '}
                      <span className="font-mono">
                        {selectedVillage.hero.health}/
                        {selectedVillage.hero.maxHealth}
                      </span>
                    </div>
                    <div>
                      Items:{' '}
                      <span className="font-mono">
                        {selectedVillage.hero.items.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Village</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New name"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                className="w-full sm:w-auto"
                onClick={() => renameTarget && handleRename(renameTarget.id)}
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setRenameTarget(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
