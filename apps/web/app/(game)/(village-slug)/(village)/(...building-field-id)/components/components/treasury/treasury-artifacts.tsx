import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useArtifactsAroundCurrentVillage } from 'app/(game)/(village-slug)/hooks/use-artifacts-around-current-village';
import { useHeroInventory } from 'app/(game)/(village-slug)/hooks/use-hero-inventory';
import { Text } from 'app/components/text';
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

  // Check if player has Construction Plan in hero inventory
  const hasPlan = heroInventory.some(
    (item) => item.id === CONSTRUCTION_PLAN_ITEM_ID && item.amount > 0,
  );

  const hasCurrentVillageArtifact = false;
  const hasAvailableArtifacts = artifactsAroundCurrentVillage.length > 0;

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="artifacts" />
        <Text as="h2">{t('Artifacts')}</Text>
        <Text>
          Artifacts are powerful items found throughout the world. Assign them
          to your villages for special bonuses.
        </Text>
      </SectionContent>

      {/* Construction Plan Status */}
      <SectionContent>
        <Text as="h2">{t('Construction Plan')}</Text>
        <Text className="text-sm text-muted-foreground mb-4">
          {t(
            'A Construction Plan is required to upgrade a World Wonder from Level 0 to Level 1. Obtain one by attacking a Natar village with your Hero.',
          )}
        </Text>

        <div className="rounded-lg border p-4">
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
                  ? t("You hold a Construction Plan in your hero's inventory.")
                  : t(
                      'Attack a Natar village with your Hero to obtain a plan.',
                    )}
              </Text>
            </div>
          </div>
        </div>
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
