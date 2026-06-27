import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  calculateWorldWonderCostForLevel,
  calculateWorldWonderDurationForLevel,
} from '@pillage-first/game-assets/utils/buildings';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useHeroInventory } from 'app/(game)/(village-slug)/hooks/use-hero-inventory';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import {
  useRenameWorldWonder,
  useUpgradeWorldWonder,
  useWorldWonder,
} from 'app/(game)/(village-slug)/hooks/use-world-wonder';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { formatTime } from 'app/utils/time';

const MAX_LEVEL = 20;
const CONSTRUCTION_PLAN_ITEM_ID = 200;

const PrerequisiteRow = ({ label, met }: { label: string; met: boolean }) => {
  return (
    <span className="flex items-center gap-2">
      <span className={met ? 'text-green-500' : 'text-red-500'}>
        {met ? '\u2713' : '\u2717'}
      </span>
      <Text className={met ? '' : 'text-muted-foreground'}>{label}</Text>
    </span>
  );
};

export const WorldWonderTab = () => {
  const { t } = useTranslation();
  const { worldWonder } = useWorldWonder();
  const { heroInventory } = useHeroInventory();
  const { serverSpeed } = useServer();
  const upgradeMutation = useUpgradeWorldWonder();
  const renameMutation = useRenameWorldWonder();

  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');

  const hasPlan = heroInventory.some(
    (item) => item.id === CONSTRUCTION_PLAN_ITEM_ID && item.amount > 0,
  );

  const nextLevel = worldWonder ? worldWonder.currentLevel + 1 : 1;
  const nextLevelCost = calculateWorldWonderCostForLevel(nextLevel);
  const nextLevelDuration = calculateWorldWonderDurationForLevel(
    nextLevel,
    serverSpeed,
  );
  const isMaxLevel = worldWonder
    ? worldWonder.currentLevel >= MAX_LEVEL
    : false;

  const handleUpgrade = () => {
    upgradeMutation.mutate();
  };

  const handleRename = () => {
    if (newName.trim().length > 0 && newName.length <= 25) {
      renameMutation.mutate(newName.trim());
      setIsRenaming(false);
      setNewName('');
    }
  };

  // Show Natar-owned WW status (not yet conquered)
  if (worldWonder?.isNatarOwned) {
    return (
      <Section>
        <SectionContent>
          <Bookmark tab="world-wonder" />
          <Text as="h2">{t('World Wonder Village (Natar-Owned)')}</Text>
          <Text>
            {t(
              'This village is owned by Natars and contains a World Wonder. Conquer it using Chiefs/Senators to take control.',
            )}
          </Text>
        </SectionContent>

        <SectionContent>
          <Text as="h3">{t('Status')}</Text>
          <div className="flex flex-col gap-1 text-sm">
            <Text>
              {t('Current Level')}: {worldWonder.currentLevel} / {MAX_LEVEL}
            </Text>
            <Text>
              {t('Owner')}: {t('Natars')}
            </Text>
            {worldWonder.attackBlockUntil && (
              <Text className="text-yellow-500">
                {t('Attacks open')}:{' '}
                {new Date(worldWonder.attackBlockUntil).toLocaleDateString()}
              </Text>
            )}
          </div>
        </SectionContent>

        <SectionContent>
          <Text as="h3">{t('How to Conquer')}</Text>
          <Text className="text-sm text-muted-foreground">
            {t(
              'Send Chiefs/Senators to lower the loyalty. When loyalty reaches 0, the village joins your empire. The World Wonder retains its current level.',
            )}
          </Text>
        </SectionContent>
      </Section>
    );
  }

  // No WW in this village
  if (!worldWonder) {
    return (
      <Section>
        <SectionContent>
          <Bookmark tab="world-wonder" />
          <Text as="h2">{t('World Wonder')}</Text>
          <Text>
            {t(
              'This village does not contain a World Wonder. Conquer a Natar World Wonder village to take control of one.',
            )}
          </Text>
        </SectionContent>
      </Section>
    );
  }

  const progressPercent = (worldWonder.currentLevel / MAX_LEVEL) * 100;

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="world-wonder" />
        <Text as="h2">
          {worldWonder.name || t('World Wonder')} -{' '}
          {t('Level {{level}}', { level: worldWonder.currentLevel })} /{' '}
          {MAX_LEVEL}
        </Text>

        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-yellow-500 h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </SectionContent>

      {!isMaxLevel && (
        <SectionContent>
          <Text as="h3">
            {t('Upgrade to Level {{level}}', { level: nextLevel })}
          </Text>
          <Resources resources={nextLevelCost} />
          <Text className="text-sm text-muted-foreground">
            {t('Duration')}: {formatTime(nextLevelDuration)}
          </Text>

          {worldWonder.currentLevel === 0 && (
            <div className="mt-2">
              <Text className="text-sm font-medium mb-1">
                {t('Prerequisites for Level 0 to Level 1:')}
              </Text>
              <div className="flex flex-col gap-1">
                <PrerequisiteRow
                  label={t('Construction Plan in hero inventory')}
                  met={hasPlan}
                />
              </div>
            </div>
          )}

          {worldWonder.cannotBeUpgradedReason && (
            <Text className="text-sm text-red-500 mb-2">
              {t(worldWonder.cannotBeUpgradedReason)}
            </Text>
          )}
          <Button
            onClick={handleUpgrade}
            disabled={
              !!worldWonder.cannotBeUpgradedReason || upgradeMutation.isPending
            }
          >
            {upgradeMutation.isPending
              ? t('Upgrading...')
              : t('Upgrade World Wonder')}
          </Button>
        </SectionContent>
      )}

      {isMaxLevel && (
        <SectionContent>
          <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4">
            <Text className="font-semibold text-yellow-500">
              {t('World Wonder Complete!')}
            </Text>
            <Text>
              {t(
                'Your World Wonder has reached Level 20. Your faction has won the game!',
              )}
            </Text>
          </div>
        </SectionContent>
      )}

      <SectionContent>
        <Text as="h3">{t('Details')}</Text>
        <div className="flex flex-col gap-1 text-sm">
          <Text>
            {t('Owner faction')}: {worldWonder.ownerFactionId}
          </Text>
          <Text>
            {t('Started')}:{' '}
            {new Date(worldWonder.startedAt).toLocaleDateString()}
          </Text>
        </div>
      </SectionContent>

      {worldWonder.currentLevel < 11 && (
        <SectionContent>
          {isRenaming ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={25}
                placeholder={t('Enter name (max 25 chars)')}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <Button
                onClick={handleRename}
                disabled={
                  newName.trim().length === 0 ||
                  newName.length > 25 ||
                  renameMutation.isPending
                }
              >
                {t('Save')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRenaming(false);
                  setNewName('');
                }}
              >
                {t('Cancel')}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setIsRenaming(true);
                setNewName(worldWonder.name ?? '');
              }}
            >
              {worldWonder.name ? t('Rename') : t('Set name')}
            </Button>
          )}
        </SectionContent>
      )}
    </Section>
  );
};
