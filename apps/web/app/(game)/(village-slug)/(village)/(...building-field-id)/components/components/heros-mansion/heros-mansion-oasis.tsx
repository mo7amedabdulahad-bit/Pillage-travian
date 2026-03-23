import { clsx } from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useOccupiableOasisInRange } from 'app/(game)/(village-slug)/hooks/use-occupiable-oasis-in-range';
import { Icon } from 'app/components/icon';
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
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

type UnoccupiedOasisSlotProps = {
  heroMansionLevel: number;
  heroMansionLevelRequirement: number;
};

const UnoccupiedOasisSlot = ({
  heroMansionLevel,
  heroMansionLevelRequirement,
}: UnoccupiedOasisSlotProps) => {
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell
        className="text-left"
        colSpan={4}
      >
        <Text>
          {heroMansionLevel >= heroMansionLevelRequirement
            ? t('Free oasis slot')
            : t(
                "Next oasis slot available at Hero's mansion level {{heroMansionLevelRequirement}}",
                {
                  heroMansionLevelRequirement,
                },
              )}
        </Text>
      </TableCell>
    </TableRow>
  );
};

type OccupiableOasis = ReturnType<
  typeof useOccupiableOasisInRange
>['occupiableOasisInRange'][number];

type OccupiedOasisSlotProps = {
  occupiedOasis: OccupiableOasis;
};

const OccupiedOasisSlot = ({ occupiedOasis }: OccupiedOasisSlotProps) => {
  const { t } = useTranslation();
  const { abandonOasis, cancelRelease } = useOccupiableOasisInRange();

  const { x, y } = occupiedOasis.oasis.coordinates;
  const { loyalty, bonuses } = occupiedOasis.oasis;
  const pendingReleaseAt = occupiedOasis.pendingReleaseAt;

  const formatCountdown = (resolvesAt: number) => {
    const now = Date.now();
    const diff = Math.max(0, resolvesAt - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <TableRow>
      <TableCell>
        <Text variant="link">
          <Link to={`../map?x=${x}&y=${y}`}>
            ({x} | {y})
          </Link>
        </Text>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {bonuses.map(({ resource, bonus }, index) => (
          <span
            className={clsx(
              'inline-flex items-center gap-1',
              index > 0 && 'ml-2',
            )}
            key={resource}
          >
            <Icon
              type={resource}
              className="flex size-5"
            />
            {bonus}%
          </span>
        ))}
      </TableCell>
      <TableCell>
        <Text>{loyalty}%</Text>
      </TableCell>
      <TableCell>
        {pendingReleaseAt ? (
          <div className="flex flex-col gap-2">
            <Text className="text-red-500">
              {t('Releasing in {{time}}', {
                time: formatCountdown(pendingReleaseAt),
              })}
            </Text>
            <Button
              size="fit"
              variant="outline"
              onClick={() => cancelRelease({ oasisId: occupiedOasis.oasis.id })}
            >
              {t('Cancel release')}
            </Button>
          </div>
        ) : (
          <Button
            size="fit"
            onClick={() => abandonOasis({ oasisId: occupiedOasis.oasis.id })}
          >
            {t('Release oasis')}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

type OasisWithinReachSlotProps = {
  occupiableOasis: OccupiableOasis;
};

const OasisWithinReachSlot = ({
  occupiableOasis,
}: OasisWithinReachSlotProps) => {
  const { oasis, village, player } = occupiableOasis;

  return (
    <TableRow key={oasis.id}>
      <TableCell>
        {player === null && <Text>/</Text>}
        {player !== null && (
          <Text variant="link">
            <Link to={`../profile/${player.slug}`}>{player.name}</Link>
          </Text>
        )}
      </TableCell>
      <TableCell>
        {village === null && <Text>/</Text>}
        {village !== null && (
          <Text variant="link">
            <Link
              to={`../map?x=${village.coordinates.x}&y=${village.coordinates.y}`}
            >
              {village.name} ({village.coordinates.x} | {village.coordinates.y})
            </Link>
          </Text>
        )}
      </TableCell>
      <TableCell>
        <Text variant="link">
          <Link to={`../map?x=${oasis.coordinates.x}&y=${oasis.coordinates.y}`}>
            ({oasis.coordinates.x} | {oasis.coordinates.y})
          </Link>
        </Text>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {oasis.bonuses.map(({ resource, bonus }, index) => (
          <span
            className={clsx(
              'inline-flex items-center gap-1',
              index > 0 && 'ml-2',
            )}
            key={resource}
          >
            <Icon
              type={resource}
              className="flex size-5"
            />
            {bonus}%
          </span>
        ))}
      </TableCell>
    </TableRow>
  );
};

export const HerosMansionOasis = () => {
  const { t } = useTranslation();
  const { occupiableOasisInRange } = useOccupiableOasisInRange();
  const { currentVillage } = useCurrentVillage();

  const heroMansionLevel = useMemo(() => {
    return (
      currentVillage.buildingFields.find(
        ({ buildingId }) => buildingId === 'HEROS_MANSION',
      )?.level ?? 0
    );
  }, [currentVillage.buildingFields]);

  const oasisOccupiedByCurrentVillage = occupiableOasisInRange.filter(
    ({ village }) => {
      return village?.id === currentVillage.id;
    },
  );

  const [firstOccupiedOasis, secondOccupiedOasis, thirdOccupiedOasis]: (
    | OccupiableOasis
    | undefined
  )[] = oasisOccupiedByCurrentVillage;

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="oasis" />
        <Text as="h2">{t('Oasis management')}</Text>
        <Text>
          {t(
            "A village can occupy an oasis if it attacks the oasis and subdues all the animals that are present. The attack must also include a hero, who must survive the attack. The oasis will only be captured if there is a level 10, 15 or 20 hero's mansion built in the attacking village, and can still have an empty oasis slot (1 on level 10, 2 on level 15 and 3 on level 20).",
          )}
        </Text>
      </SectionContent>
      <Tabs defaultValue="occupied-oasis">
        <TabList>
          <Tab value="occupied-oasis">
            <Text>{t('Occupied oasis')}</Text>
          </Tab>
          <Tab value="oasis-within-reach">
            <Text>{t('Oasis within reach')}</Text>
          </Tab>
        </TabList>
        <TabPanel value="occupied-oasis">
          <SectionContent>
            <Text as="h2">{t('Occupied oasis')}</Text>
            <Text>
              {t(
                'Occupied oasis provide a resource production bonus of either 25% or 50% to one or multiple resources. If you choose to abandon an oasis, the abandoned oasis will start to regenerate animals.',
              )}
            </Text>
            <div className="overflow-x-scroll scrollbar-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>
                      <Text>{t('Coordinates')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Resources')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Loyalty')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Actions')}</Text>
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!!firstOccupiedOasis && (
                    <OccupiedOasisSlot occupiedOasis={firstOccupiedOasis} />
                  )}
                  {!firstOccupiedOasis && (
                    <UnoccupiedOasisSlot
                      heroMansionLevel={heroMansionLevel}
                      heroMansionLevelRequirement={10}
                    />
                  )}
                  {!!secondOccupiedOasis && (
                    <OccupiedOasisSlot occupiedOasis={secondOccupiedOasis} />
                  )}
                  {!secondOccupiedOasis && (
                    <UnoccupiedOasisSlot
                      heroMansionLevel={heroMansionLevel}
                      heroMansionLevelRequirement={15}
                    />
                  )}
                  {!!thirdOccupiedOasis && (
                    <OccupiedOasisSlot occupiedOasis={thirdOccupiedOasis} />
                  )}
                  {!thirdOccupiedOasis && (
                    <UnoccupiedOasisSlot
                      heroMansionLevel={heroMansionLevel}
                      heroMansionLevelRequirement={20}
                    />
                  )}
                </TableBody>
              </Table>
            </div>
          </SectionContent>
        </TabPanel>
        <TabPanel value="oasis-within-reach">
          <SectionContent>
            <Text as="h2">{t('Oasis within reach')}</Text>
            <Text>
              {t(
                'For an oasis to be occupiable, it has to be in a radius of 3 squares around your village. To successfully occupy an oasis, you have to attack it with your hero and win.',
              )}
            </Text>
            <div className="overflow-x-scroll scrollbar-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>
                      <Text>{t('Player')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Village')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Coordinates')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Resources')}</Text>
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {occupiableOasisInRange.map((occupiableOasis) => (
                    <OasisWithinReachSlot
                      key={occupiableOasis.oasis.id}
                      occupiableOasis={occupiableOasis}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionContent>
        </TabPanel>
      </Tabs>
    </Section>
  );
};
