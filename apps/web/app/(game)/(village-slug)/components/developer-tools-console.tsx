import { useQuery } from '@tanstack/react-query';
import { type ComponentProps, use, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VscTerminal } from 'react-icons/vsc';
import {
  categoryDisplayNames,
  getItemsByCategory,
  itemCategories,
  items,
} from '@pillage-first/game-assets/items';
import { calculateHeroLevel } from '@pillage-first/game-assets/utils/hero';
import type { DeveloperSettings } from '@pillage-first/types/models/developer-settings';
import type { HeroItemCategory } from '@pillage-first/types/models/hero-item';
import type { Resource } from '@pillage-first/types/models/resource';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero.ts';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { ResourceIcon } from 'app/components/resource-icon';
import { Text } from 'app/components/text.tsx';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Input } from 'app/components/ui/input';
import { Label } from 'app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { Separator } from 'app/components/ui/separator';
import { Switch } from 'app/components/ui/switch';

export const DeveloperToolsButton = ({
  className,
  ...props
}: ComponentProps<'span'>) => {
  const { preferences } = usePreferences();

  if (!preferences.isDeveloperToolsConsoleEnabled) {
    return null;
  }

  return (
    <span
      className={className}
      {...props}
    >
      <VscTerminal className="text-inherit size-full" />
    </span>
  );
};

type DevToolsConsoleProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const RESOURCES: Resource[] = ['wood', 'clay', 'iron', 'wheat'];
const AMOUNTS: (100 | 1000 | 10000)[] = [100, 1000, 10000];

const INSTANT_SETTINGS: (keyof DeveloperSettings)[] = [
  'isInstantBuildingConstructionEnabled',
  'isInstantUnitTrainingEnabled',
  'isInstantUnitImprovementEnabled',
  'isInstantUnitResearchEnabled',
  'isInstantUnitTravelEnabled',
  'isInstantHeroReviveEnabled',
];

const FREE_SETTINGS: (keyof DeveloperSettings)[] = [
  'isFreeBuildingConstructionEnabled',
  'isFreeUnitTrainingEnabled',
  'isFreeUnitImprovementEnabled',
  'isFreeUnitResearchEnabled',
  'isFreeHeroReviveEnabled',
];

const UI_SETTINGS: (keyof DeveloperSettings)[] = ['isMaxLevelUpgradeEnabled'];

export const DeveloperToolsConsole = ({
  isOpen,
  onOpenChange,
}: DevToolsConsoleProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const {
    developerSettings,
    updateDeveloperSetting,
    updateVillageResources,
    spawnHeroItem,
    levelUpHero,
    incrementHeroAdventurePoints,
    killHero,
  } = useDeveloperSettings();
  const { hero } = useHero();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('1');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);

  const { level } = useMemo(() => {
    return calculateHeroLevel(hero.stats.experience);
  }, [hero.stats.experience]);

  // Get items filtered by selected category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }
    const categoryItems = getItemsByCategory(
      selectedCategory as HeroItemCategory,
    );

    // Check if this category has tiered items
    const hasTiers = categoryItems.some((item) => item.tier !== undefined);
    if (hasTiers) {
      return categoryItems.filter((item) => item.tier === Number(selectedTier));
    }
    return categoryItems;
  }, [selectedCategory, selectedTier]);

  // Check if selected category has tiers
  const categoryHasTiers = useMemo(() => {
    if (!selectedCategory) {
      return false;
    }
    const categoryItems = getItemsByCategory(
      selectedCategory as HeroItemCategory,
    );
    return categoryItems.some((item) => item.tier !== undefined);
  }, [selectedCategory]);

  const handleUpdateResource = (
    resource: Resource,
    amount: 100 | 1000 | 10000,
    direction: 'add' | 'subtract',
  ) => {
    updateVillageResources({
      villageId: currentVillage.id,
      resource,
      amount,
      direction,
    });
  };

  const handleUpdateSetting = (
    name: keyof DeveloperSettings,
    value: boolean,
  ) => {
    updateDeveloperSetting({ developerSettingName: name, value });
  };

  const handleSpawnItem = () => {
    if (!selectedItemId) {
      return;
    }
    spawnHeroItem({ itemId: Number(selectedItemId), amount });
  };

  const SETTING_LABELS: Record<keyof DeveloperSettings, string> = {
    isInstantBuildingConstructionEnabled: t('Instant building construction'),
    isInstantUnitTrainingEnabled: t('Instant unit training'),
    isInstantUnitImprovementEnabled: t('Instant unit improvement'),
    isInstantUnitResearchEnabled: t('Instant unit research'),
    isInstantUnitTravelEnabled: t('Instant unit travel'),
    isFreeBuildingConstructionEnabled: t('Free building construction'),
    isFreeUnitTrainingEnabled: t('Free unit training'),
    isFreeUnitImprovementEnabled: t('Free unit improvement'),
    isFreeUnitResearchEnabled: t('Free unit research'),
    isInstantHeroReviveEnabled: t('Instant hero revives'),
    isFreeHeroReviveEnabled: t('Free hero revives'),
    isMaxLevelUpgradeEnabled: t('Max level upgrade button'),
  };

  const SETTING_DESCRIPTIONS: Record<keyof DeveloperSettings, string> = {
    isInstantBuildingConstructionEnabled: t(
      'Buildings are constructed instantly without waiting.',
    ),
    isInstantUnitTrainingEnabled: t(
      'Units are trained instantly in buildings.',
    ),
    isInstantUnitImprovementEnabled: t(
      'Units are improved instantly in the smithy.',
    ),
    isInstantUnitResearchEnabled: t(
      'Units are researched instantly in the academy.',
    ),
    isInstantUnitTravelEnabled: t('Units reach their destination instantly.'),
    isFreeBuildingConstructionEnabled: t(
      'Buildings do not cost any resources to construct.',
    ),
    isFreeUnitTrainingEnabled: t('Units do not cost any resources to train.'),
    isFreeUnitImprovementEnabled: t(
      'Units do not cost any resources to improve.',
    ),
    isFreeUnitResearchEnabled: t(
      'Units do not cost any resources to research.',
    ),
    isInstantHeroReviveEnabled: t('Heroes are revived instantly.'),
    isFreeHeroReviveEnabled: t('Heroes do not cost any resources to revive.'),
    isMaxLevelUpgradeEnabled: t(
      'Shows a button to upgrade buildings directly to max level.',
    ),
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Developer tools')}</DialogTitle>
          <DialogDescription>
            {t(
              'Developer tools allow you to spawn resources and hero items, and disable or enable specific game functionalities for testing purposes.',
            )}
          </DialogDescription>
        </DialogHeader>

        <Section>
          <SectionContent>
            <Text as="h3">{t('Resources')}</Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RESOURCES.map((resource) => (
                <div
                  key={resource}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <ResourceIcon
                      resource={resource}
                      size="small"
                    />
                    <Label className="capitalize">
                      {t(`RESOURCES.${resource.toUpperCase()}`)}
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {AMOUNTS.map((amountToSpawn) => (
                        <Button
                          key={`${resource}-add-${amountToSpawn}`}
                          size="sm"
                          className="h-8 px-2 min-w-[3.5rem] flex-1"
                          onClick={() =>
                            handleUpdateResource(resource, amountToSpawn, 'add')
                          }
                        >
                          <span>
                            +
                            {amountToSpawn >= 1000
                              ? `${amountToSpawn / 1000}k`
                              : amountToSpawn}
                          </span>
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {AMOUNTS.map((amountToRemove) => (
                        <Button
                          key={`${resource}-subtract-${amountToRemove}`}
                          size="sm"
                          variant="destructive"
                          className="h-8 px-2 min-w-[3.5rem] flex-1"
                          onClick={() =>
                            handleUpdateResource(
                              resource,
                              amountToRemove,
                              'subtract',
                            )
                          }
                        >
                          <span>
                            -
                            {amountToRemove >= 1000
                              ? `${amountToRemove / 1000}k`
                              : amountToRemove}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionContent>

          <Separator orientation="horizontal" />

          <SectionContent>
            <Text as="h3">{t('Duration')}</Text>
            <div className="grid grid-cols-1 gap-4">
              {INSTANT_SETTINGS.map((setting) => (
                <div
                  key={setting}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor={setting}
                      className="text-sm font-semibold cursor-pointer"
                    >
                      {t(SETTING_LABELS[setting])}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {t(SETTING_DESCRIPTIONS[setting])}
                    </span>
                  </div>
                  <Switch
                    id={setting}
                    checked={developerSettings[setting]}
                    onCheckedChange={(checked) =>
                      handleUpdateSetting(setting, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </SectionContent>

          <Separator orientation="horizontal" />

          <SectionContent>
            <Text as="h3">{t('Cost')}</Text>
            <div className="grid grid-cols-1 gap-4">
              {FREE_SETTINGS.map((setting) => (
                <div
                  key={setting}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor={setting}
                      className="text-sm font-semibold cursor-pointer"
                    >
                      {t(SETTING_LABELS[setting])}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {t(SETTING_DESCRIPTIONS[setting])}
                    </span>
                  </div>
                  <Switch
                    id={setting}
                    checked={developerSettings[setting]}
                    onCheckedChange={(checked) =>
                      handleUpdateSetting(setting, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </SectionContent>

          <Separator orientation="horizontal" />

          <SectionContent>
            <Text as="h3">{t('UI')}</Text>
            <div className="grid grid-cols-1 gap-4">
              {UI_SETTINGS.map((setting) => (
                <div
                  key={setting}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor={setting}
                      className="text-sm font-semibold cursor-pointer"
                    >
                      {t(SETTING_LABELS[setting])}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {t(SETTING_DESCRIPTIONS[setting])}
                    </span>
                  </div>
                  <Switch
                    id={setting}
                    checked={developerSettings[setting]}
                    onCheckedChange={(checked) =>
                      handleUpdateSetting(setting, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </SectionContent>

          <Separator orientation="horizontal" />

          <SectionContent>
            <Text as="h3">{t('Hero items')}</Text>
            <div className="flex flex-col gap-4">
              {/* Category selector */}
              <div className="flex flex-col gap-2">
                <Label>{t('Category')}</Label>
                <Select
                  value={selectedCategory ?? undefined}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedItemId(null);
                    setSelectedTier('1');
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('Select item category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {itemCategories.map((cat) => (
                      <SelectItem
                        key={cat}
                        value={cat}
                      >
                        {categoryDisplayNames[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tier selector — only shown for tiered categories */}
              {categoryHasTiers && (
                <div className="flex flex-col gap-2">
                  <Label>{t('Tier')}</Label>
                  <Select
                    value={selectedTier}
                    onValueChange={(value) => {
                      setSelectedTier(value);
                      setSelectedItemId(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          Tier 1 (Common)
                        </span>
                      </SelectItem>
                      <SelectItem value="2">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Tier 2 (Uncommon)
                        </span>
                      </SelectItem>
                      <SelectItem value="3">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Tier 3 (Rare)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Item selector with image previews */}
              <div className="flex items-end gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <Label>{t('Item')}</Label>
                  <Select
                    value={selectedItemId ?? undefined}
                    onValueChange={(value) => setSelectedItemId(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('Select an item to spawn')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredItems.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={String(item.id)}
                        >
                          <span className="flex items-center gap-2">
                            <img
                              src={`/hero-assets/items/item${item.imageId}.png`}
                              alt={item.displayName}
                              className="w-6 h-6 object-contain"
                            />
                            <span className="flex flex-col">
                              <span className="font-medium">
                                {item.displayName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 w-24">
                  <Label htmlFor="item-amount">{t('Amount')}</Label>
                  <Input
                    id="item-amount"
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Selected item preview */}
              {selectedItemId &&
                (() => {
                  const selectedItem = filteredItems.find(
                    (i) => String(i.id) === selectedItemId,
                  );
                  if (!selectedItem) {
                    return null;
                  }
                  return (
                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md border">
                      <img
                        src={`/hero-assets/items/item${selectedItem.imageId}.png`}
                        alt={selectedItem.displayName}
                        className="w-12 h-12 object-contain"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {selectedItem.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedItem.description}
                        </span>
                        {selectedItem.tribe !== 'any' && (
                          <span className="text-xs text-amber-600 capitalize">
                            {selectedItem.tribe} only
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

              <div className="flex gap-2">
                <Button
                  onClick={handleSpawnItem}
                  disabled={!selectedItemId}
                  size="fit"
                >
                  {t('Spawn item')}
                </Button>
                <Button
                  variant="outline"
                  size="fit"
                  onClick={() => {
                    // Spawn one of every equippable item
                    for (const item of items) {
                      if (item.category !== 'consumable') {
                        spawnHeroItem({ itemId: item.id, amount: 1 });
                      }
                    }
                  }}
                >
                  {t('Spawn all equipment')}
                </Button>
              </div>
            </div>
          </SectionContent>

          <Separator orientation="horizontal" />

          <SectionContent>
            <Text as="h3">{t('Hero level')}</Text>
            <Button
              size="fit"
              onClick={() => levelUpHero()}
            >
              {t('Level up to level {{level}}', { level: level + 1 })}
            </Button>
          </SectionContent>

          <Separator orientation="horizontal" />

          <SectionContent>
            <Text as="h3">{t('Hero adventures')}</Text>
            <div className="flex items-center gap-4">
              <Button onClick={() => incrementHeroAdventurePoints()}>
                {t('Add 1 adventure point')}
              </Button>
            </div>
          </SectionContent>

          <Separator orientation="horizontal" />

          <SectionContent>
            <Text as="h3">{t('Hero death')}</Text>
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                onClick={() => killHero()}
              >
                {t('Kill hero')}
              </Button>
            </div>
          </SectionContent>

          <Separator orientation="horizontal" />

          <NpcBrainSection />
        </Section>
      </DialogContent>
    </Dialog>
  );
};

const NpcBrainSection = () => {
  const { t } = useTranslation();
  const { fetcher } = use(ApiContext);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState('');

  const { data: npcVillages } = useQuery({
    queryKey: ['npc-villages-list', searchTerm],
    queryFn: async () => {
      const params = searchTerm
        ? `?search=${encodeURIComponent(searchTerm)}`
        : '';
      const response = await fetcher<
        {
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
        }[]
      >(`/developer-settings/npc-villages${params}`);
      return response.data;
    },
  });

  const { data: debugInfo } = useQuery({
    queryKey: ['npc-village-debug', selectedVillageId],
    queryFn: async () => {
      const response = await fetcher<Record<string, unknown>>(
        `/developer-settings/npc-villages/${selectedVillageId}`,
      );
      return response.data;
    },
    enabled: !!selectedVillageId,
  });

  const selectedVillage = npcVillages?.find(
    (v) => String(v.villageId) === selectedVillageId,
  );

  return (
    <SectionContent>
      <Text as="h3">{t('NPC Brain')}</Text>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{npcVillages?.length ?? 0} NPC villages</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t('Search NPC Villages')}</Label>
          <Input
            placeholder="Search by name, faction, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t('Select NPC Village')}</Label>
          <Select
            value={selectedVillageId ?? undefined}
            onValueChange={(value) => setSelectedVillageId(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('Select a village')} />
            </SelectTrigger>
            <SelectContent>
              {npcVillages?.map((v) => (
                <SelectItem
                  key={v.villageId}
                  value={String(v.villageId)}
                >
                  [{v.villageId}] {v.villageName} ({v.factionKey}) [{v.x},{v.y}]
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVillage && (
          <div className="p-3 bg-muted/50 rounded-md border text-sm space-y-2">
            <div className="font-semibold">
              {selectedVillage.villageName} ({selectedVillage.factionKey})
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-muted-foreground">Position:</span>
              <span>
                ({selectedVillage.x}, {selectedVillage.y})
              </span>
              <span className="text-muted-foreground">Aggression:</span>
              <span>{selectedVillage.aggressionLevel}</span>
              <span className="text-muted-foreground">Loot:</span>
              <span>
                {Math.round(selectedVillage.currentLoot * 100)}% /{' '}
                {selectedVillage.maxLoot}
              </span>
              <span className="text-muted-foreground">Tier:</span>
              <span>{selectedVillage.simulationTier}</span>
              <span className="text-muted-foreground">Needs tick:</span>
              <span>{selectedVillage.needsTick ? 'Yes' : 'No'}</span>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="p-3 bg-muted/50 rounded-md border text-xs font-mono overflow-auto max-h-64">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </SectionContent>
  );
};
