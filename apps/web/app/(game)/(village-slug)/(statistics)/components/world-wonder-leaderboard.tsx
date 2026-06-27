import { useTranslation } from 'react-i18next';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { useWorldWonderLeaderboard } from 'app/(game)/(village-slug)/hooks/use-world-wonder';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const FACTION_LABELS: Record<string, string> = {
  natars: 'Natars',
  romans: 'Romans',
  teutons: 'Teutons',
  gauls: 'Gauls',
  egyptians: 'Egyptians',
  huns: 'Huns',
  spartans: 'Spartans',
  vikings: 'Vikings',
};

const FACTION_COLORS: Record<string, string> = {
  natars: 'text-gray-400',
  romans: 'text-red-400',
  teutons: 'text-blue-400',
  gauls: 'text-green-400',
  egyptians: 'text-yellow-400',
  huns: 'text-orange-400',
  spartans: 'text-purple-400',
  vikings: 'text-cyan-400',
};

export const WorldWonderLeaderboard = () => {
  const { t } = useTranslation();
  const { leaderboard, isLoading } = useWorldWonderLeaderboard();

  if (isLoading) {
    return (
      <Section>
        <Text>{t('Loading...')}</Text>
      </Section>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Section>
        <Text as="h2">{t('World Wonder Leaderboard')}</Text>
        <Text>{t('No World Wonders have been started yet.')}</Text>
      </Section>
    );
  }

  return (
    <Section>
      <Text as="h2">{t('World Wonder Leaderboard')}</Text>
      <Text>{t('All World Wonders on the server, sorted by level.')}</Text>
      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell />
              <TableHeaderCell>
                <Text>{t('Name')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Owner')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Faction')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Level')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Village')}</Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text>{t('Coordinates')}</Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map(
              (
                {
                  villageId,
                  ownerFactionId,
                  currentLevel,
                  name,
                  villageName,
                  x,
                  y,
                },
                index,
              ) => (
                <TableRow key={villageId}>
                  <TableCell>
                    <Text className="text-muted-foreground">{index + 1}</Text>
                  </TableCell>
                  <TableCell>
                    <Text className="font-medium">
                      {name || t('Unnamed Wonder')}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text
                      className={
                        ownerFactionId === 'natars'
                          ? 'text-gray-400'
                          : 'text-green-500'
                      }
                    >
                      {ownerFactionId === 'natars' ? t('Natars') : t('Player')}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text className={FACTION_COLORS[ownerFactionId] || ''}>
                      {FACTION_LABELS[ownerFactionId] || ownerFactionId}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text>{currentLevel} / 20</Text>
                  </TableCell>
                  <TableCell>
                    <Text>{villageName}</Text>
                  </TableCell>
                  <TableCell>
                    <Text>
                      ({x}|{y})
                    </Text>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
};
