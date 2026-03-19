import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/(...report-id)/+types/page';
import { LootDisplay } from 'app/(game)/(village-slug)/(reports)/components/components/loot-display';
import { TroopTable } from 'app/(game)/(village-slug)/(reports)/components/components/troop-table';
import {
  TRIBE_ID_TO_SLUG,
  TRIBE_UNITS,
} from 'app/(game)/(village-slug)/(reports)/components/constants/tribe-units';
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
              : t('Report')}
        </Text>

        {combatData && (
          <div className="flex flex-col gap-8">
            <TroopTable
              title={t('Attacker')}
              villageName={combatData.attackerVillageName}
              tribe={TRIBE_ID_TO_SLUG[report.attackerFactionId || 1]}
              unitIds={
                TRIBE_UNITS[TRIBE_ID_TO_SLUG[report.attackerFactionId || 1]]
              }
              units={combatData.attackerUnits}
              losses={combatData.attackerLosses}
            />

            <TroopTable
              title={t('Defender')}
              villageName={combatData.defenderVillageName}
              tribe={TRIBE_ID_TO_SLUG[report.defenderFactionId || 1]}
              unitIds={
                TRIBE_UNITS[TRIBE_ID_TO_SLUG[report.defenderFactionId || 1]]
              }
              units={combatData.defenderUnits}
              losses={combatData.defenderLosses}
            />

            {combatData.loot && (
              <LootDisplay
                loot={combatData.loot}
                capacity={combatData.capacity}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ReportPage;
