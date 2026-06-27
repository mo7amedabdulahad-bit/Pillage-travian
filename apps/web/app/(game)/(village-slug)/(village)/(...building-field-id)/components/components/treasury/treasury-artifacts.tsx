import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useArtifactsAroundCurrentVillage } from 'app/(game)/(village-slug)/hooks/use-artifacts-around-current-village';
import { useHeroInventory } from 'app/(game)/(village-slug)/hooks/use-hero-inventory';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const CONSTRUCTION_PLAN_ITEM_ID = 200;

type UnoccupiedArtifactRowProps = {
  item: ReturnType<
    typeof useArtifactsAroundCurrentVillage
  >['artifactsAroundCurrentVillage'][0];
};

const UnoccupiedArtifactRow = ({ item }: UnoccupiedArtifactRowProps) => {
  const { t } = useTranslation();

  const itemDef = getItemDefinition(item.id);

  if (!itemDef) {
    return (
      <TableRow>
        <TableCell>{t('Unknown item')}</TableCell>
        <TableCell>{t('Unknown item')}</TableCell>
        <TableCell>{item.distance}</TableCell>
        <TableCell>
          <Link to={`../map?x=${item.coordinates.x}&y=${item.coordinates.y}`}>
            ({item.coordinates.x} | {item.coordinates.y})
          </Link>
        </TableCell>
      </TableRow>
    );
  }

  const { name } = itemDef;

  return (
    <TableRow>
      <TableCell>{itemDef.displayName ?? t(`ITEMS.${name}.NAME`)}</TableCell>
      <TableCell>
        {itemDef.description ?? t(`ITEMS.${name}.DESCRIPTION`)}
      </TableCell>
      <TableCell>{item.distance}</TableCell>
      <TableCell>
        <Link to={`../map?x=${item.coordinates.x}&y=${item.coordinates.y}`}>
          ({item.coordinates.x} | {item.coordinates.y})
        </Link>
      </TableCell>
    </TableRow>
  );
};

export const TreasuryArtifacts = () => {
  const { t } = useTranslation();
  const { artifactsAroundCurrentVillage } = useArtifactsAroundCurrentVillage();
  const { heroInventory } = useHeroInventory();
  const { currentVillage } = useCurrentVillage();

  // Check if player has Construction Plan in hero inventory
  const hasPlan = heroInventory.some(
    (item) => item.id === CONSTRUCTION_PLAN_ITEM_ID && item.amount > 0,
  );

  // Check if current village has Treasury level 10+
  const treasuryLevel =
    currentVillage.buildingFields.find((bf) => bf.buildingId === 'TREASURY')
      ?.level ?? 0;

  // Check if this village is already a WW village
  const isWwVillage = currentVillage.buildingFields.some(
    (bf) => bf.buildingId === 'WORLD_WONDER',
  );

  // Check if player already has a WW (from hero inventory or server state)
  // For now, just check if this village is a WW village
  const canStartWw = treasuryLevel >= 10 && hasPlan && !isWwVillage;

  const hasCurrentVillageArtifact = false;
  const hasAvailableArtifacts = artifactsAroundCurrentVillage.length > 0;

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="artifacts" />
        <Text as="h2">{t('Artifacts')}</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium
          ad autem distinctio nesciunt officia quas qui similique. Aperiam atque
          et excepturi fugiat labore quidem sed sit tempore totam voluptas.
          Iure!
        </Text>
      </SectionContent>

      {/* Construction Plan Panel */}
      <SectionContent>
        <Text as="h2">{t('Construction Plan')}</Text>
        <Text className="text-sm text-muted-foreground mb-4">
          {t(
            'A Construction Plan is required to start a World Wonder. Obtain one by attacking a Natar village with your Hero. The plan is consumed when the World Wonder reaches Level 1.',
          )}
        </Text>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <Text
              as="h3"
              className="mb-2"
            >
              {t('Your Construction Plan')}
            </Text>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                {hasPlan ? (
                  <Text className="text-2xl">📜</Text>
                ) : (
                  <Text className="text-2xl text-muted-foreground">📜</Text>
                )}
              </div>
              <div>
                <Text className="font-medium">
                  {hasPlan
                    ? t('Construction Plan (Owned)')
                    : t('No Construction Plan')}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {hasPlan
                    ? t(
                        "You hold a Construction Plan in your hero's inventory.",
                      )
                    : t(
                        'Attack a Natar village with your Hero to obtain a plan.',
                      )}
                </Text>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <Text
              as="h3"
              className="mb-2"
            >
              {t('Village Status')}
            </Text>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <Text>{t('Treasury Level')}</Text>
                <Text
                  className={
                    treasuryLevel >= 10 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {treasuryLevel} {t('of 10 required')}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text>{t('Construction Plan')}</Text>
                <Text className={hasPlan ? 'text-green-500' : 'text-red-500'}>
                  {hasPlan ? t('Owned') : t('Missing')}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text>{t('WW Village')}</Text>
                <Text
                  className={
                    isWwVillage ? 'text-yellow-500' : 'text-muted-foreground'
                  }
                >
                  {isWwVillage ? t('Yes (this village)') : t('No')}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {canStartWw && (
          <div className="mt-4">
            <Button
              onClick={() => {
                // Navigate to WW tab
                window.location.href = `${window.location.pathname}?tab=world-wonder`;
              }}
              className="w-full md:w-auto"
            >
              {t('Start World Wonder')}
            </Button>
          </div>
        )}

        {!canStartWw && hasPlan && treasuryLevel < 10 && (
          <Text className="mt-4 text-sm text-muted-foreground">
            {t('Upgrade your Treasury to Level 10 to start a World Wonder.')}
          </Text>
        )}

        {!canStartWw && !hasPlan && treasuryLevel >= 10 && (
          <Text className="mt-4 text-sm text-muted-foreground">
            {t(
              'Obtain a Construction Plan by attacking a Natar village with your Hero.',
            )}
          </Text>
        )}

        {!canStartWw && isWwVillage && (
          <Text className="mt-4 text-sm text-yellow-500">
            {t('This village already has a World Wonder.')}
          </Text>
        )}
      </SectionContent>

      <section className="flex flex-col gap-2">
        <Text as="h2">{t('Artifact in this village')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Name')}</TableHeaderCell>
              <TableHeaderCell>{t('Description')}</TableHeaderCell>
              <TableHeaderCell>{t('Actions')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {/*{hasCurrentVillageArtifact && (*/}
              {/*  <>*/}
              {/*    <TableCell>*/}
              {/*      {t(`ITEMS.${currentVillageArtifactId}.NAME`)}*/}
              {/*    </TableCell>*/}
              {/*    <TableCell>*/}
              {/*      {t(`ITEMS.${currentVillageArtifactId}.DESCRIPTION`)}*/}
              {/*    </TableCell>*/}
              {/*    <TableCell>/</TableCell>*/}
              {/*  </>*/}
              {/*)}*/}
              {!hasCurrentVillageArtifact && (
                <>
                  <TableCell
                    className="text-left"
                    colSpan={hasAvailableArtifacts ? 2 : 3}
                  >
                    {hasAvailableArtifacts
                      ? t(
                          'This village does not host an artifact. Select an artifact to assign.',
                        )
                      : t(
                          'This village does not host an artifact. Capture one first from the list bellow.',
                        )}
                  </TableCell>
                  {hasAvailableArtifacts && (
                    <TableCell className="text-left">TODO</TableCell>
                  )}
                </>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2">{t('Unoccupied artifacts')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Name')}</TableHeaderCell>
              <TableHeaderCell>{t('Description')}</TableHeaderCell>
              <TableHeaderCell>{t('Distance')}</TableHeaderCell>
              <TableHeaderCell>{t('Coordinates')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {artifactsAroundCurrentVillage.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-left"
                  colSpan={3}
                >
                  {t('There are no more artifacts to conquer.')}
                </TableCell>
              </TableRow>
            )}
            {artifactsAroundCurrentVillage.length > 0 &&
              artifactsAroundCurrentVillage.map((item) => (
                <UnoccupiedArtifactRow
                  key={item.id}
                  item={item}
                />
              ))}
          </TableBody>
        </Table>
      </section>
    </Section>
  );
};
