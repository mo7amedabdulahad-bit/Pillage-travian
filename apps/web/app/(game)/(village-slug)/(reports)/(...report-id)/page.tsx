import { useTranslation } from 'react-i18next';
import { unitsMap } from '@pillage-first/game-assets/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/(...report-id)/+types/page';
import { LootDisplay } from 'app/(game)/(village-slug)/(reports)/components/components/loot-display';
import { TroopTable } from 'app/(game)/(village-slug)/(reports)/components/components/troop-table';
import { TRIBE_UNITS } from 'app/(game)/(village-slug)/(reports)/components/constants/tribe-units';
import { useReport } from 'app/(game)/(village-slug)/hooks/use-reports';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';

const ReportPage = ({ params }: Route.ComponentProps) => {
  const { reportId: reportIdParam, villageSlug, serverSlug } = params;
  const { t } = useTranslation();

  const reportId = Number.parseInt(reportIdParam ?? '0', 10);
  const { data: report, isLoading } = useReport(reportId);

  const title = `${t('Report - {{reportId}}', { reportId })} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  if (isLoading) {
    return <Text>{t('Loading...')}</Text>;
  }

  if (!report) {
    return <Text>{t('Report not found')}</Text>;
  }

  const combatData = report.data;
  const toUnitCounts = (
    tribe: Tribe,
    troops: { unitId: string; amount: number }[] = [],
  ) => {
    return TRIBE_UNITS[tribe].map(
      (unitId) => troops.find((troop) => troop.unitId === unitId)?.amount ?? 0,
    );
  };

  if (report.type === 'adventure') {
    return (
      <>
        <title>{title}</title>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="../reports">{t('Reports')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {t('Report - {{reportId}}', { reportId })}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 flex flex-col gap-6">
          <Text
            as="h1"
            className="border-b border-border pb-2 text-2xl font-bold"
          >
            {t('Adventure')}
          </Text>
          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/10 p-4">
            <Text className="font-semibold">
              {combatData.playerName} - {combatData.villageName}
            </Text>
            <Text>
              {combatData.heroDied
                ? t('Your hero did not survive the adventure.')
                : t(
                    'Your hero completed the adventure and is on the way back.',
                  )}
            </Text>
            <Text>
              {t('Damage taken')}: {combatData.damageTaken}
            </Text>
            <Text>
              {t('Current health')}: {combatData.health}
            </Text>
            <Text>
              {t('Completed adventures')}: {combatData.completed}
            </Text>
          </div>
        </div>
      </>
    );
  }

  if (report.type === 'scout-attack' || report.type === 'scout-defence') {
    return (
      <>
        <title>{title}</title>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="../reports">{t('Reports')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {t('Report - {{reportId}}', { reportId })}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-4 flex flex-col gap-6">
          <Text
            as="h1"
            className="border-b border-border pb-2 text-2xl font-bold"
          >
            {report.type === 'scout-attack' ? t('Scout') : t('Scout defence')}
          </Text>
          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/10 p-4">
            <Text className="font-semibold">
              {combatData.attackerVillageName}
              {' -> '}
              {combatData.defenderVillageName}
            </Text>
            <Text>
              {combatData.wasDetected
                ? t('Enemy scouts were present.')
                : t('No enemy scouts defended the village.')}
            </Text>
            <Text>
              {t('Attacker losses')}:{' '}
              {combatData.attackerLosses.reduce(
                (sum: number, troop: { amount: number }) => sum + troop.amount,
                0,
              )}
            </Text>
            <Text>
              {t('Defender losses')}:{' '}
              {combatData.defenderLosses.reduce(
                (sum: number, troop: { amount: number }) => sum + troop.amount,
                0,
              )}
            </Text>
            {report.type === 'scout-attack' && combatData.resources && (
              <LootDisplay
                loot={combatData.resources}
                capacity={combatData.resources.reduce(
                  (sum: number, value: number) => sum + value,
                  0,
                )}
              />
            )}
            {report.type === 'scout-attack' && (
              <>
                <Text>
                  {t('Wall level')}: {combatData.wallLevel ?? 0}
                </Text>
                <Text>
                  {t('Residence/Command Center level')}:{' '}
                  {combatData.palaceLevel ?? 0}
                </Text>
              </>
            )}
          </div>
          {report.type === 'scout-attack' && combatData.troops && (
            <TroopTable
              title={t('Spotted troops')}
              villageName={combatData.defenderVillageName}
              tribe={combatData.defenderTribe as Tribe}
              unitIds={TRIBE_UNITS[combatData.defenderTribe as Tribe]}
              units={toUnitCounts(
                combatData.defenderTribe as Tribe,
                combatData.troops,
              )}
              losses={toUnitCounts(combatData.defenderTribe as Tribe, [])}
            />
          )}
        </div>
      </>
    );
  }

  const attackerTribe = combatData.attackerTribe as Tribe;
  const defenderTribe = combatData.defenderTribe as Tribe;
  const attackerUnits = toUnitCounts(
    attackerTribe,
    combatData.initialAttackerTroops,
  );
  const defenderUnits = toUnitCounts(
    defenderTribe,
    combatData.initialDefenderTroops,
  );
  const attackerLosses = toUnitCounts(attackerTribe, combatData.attackerLosses);
  const defenderLosses = toUnitCounts(defenderTribe, combatData.defenderLosses);
  const lootCapacity = (combatData.attackerSurvivors ?? []).reduce(
    (total: number, troop: { unitId: string; amount: number }) => {
      return (
        total +
        (unitsMap.get(troop.unitId as UnitId)?.unitCarryCapacity ?? 0) *
          troop.amount
      );
    },
    0,
  );

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="../reports">{t('Reports')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {t('Report - {{reportId}}', { reportId })}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-6 mt-4">
        <Text
          as="h1"
          className="text-2xl font-bold border-b border-border pb-2"
        >
          {report.type === 'attack'
            ? t('Attack')
            : report.type === 'raid'
              ? t('Raid')
              : report.type === 'defence'
                ? t('Defence')
                : t('Report')}
        </Text>

        {combatData && (
          <div className="flex flex-col gap-8">
            <TroopTable
              title={t('Attacker')}
              villageName={combatData.attackerVillageName}
              tribe={attackerTribe}
              unitIds={TRIBE_UNITS[attackerTribe]}
              units={attackerUnits}
              losses={attackerLosses}
            />

            <TroopTable
              title={t('Defender')}
              villageName={combatData.defenderVillageName}
              tribe={defenderTribe}
              unitIds={TRIBE_UNITS[defenderTribe]}
              units={defenderUnits}
              losses={defenderLosses}
            />

            {combatData.loot && (
              <LootDisplay
                loot={combatData.loot}
                capacity={lootCapacity}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ReportPage;
