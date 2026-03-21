import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Report } from '@pillage-first/types/models/report';
import { icons } from 'app/components/icons/icons';
import { Checkbox } from 'app/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

type ReportListProps = {
  reports: Report[];
  selectedIds: number[];
  onSelectToggle: (id: number) => void;
  onSelectAllToggle: (allSelected: boolean) => void;
};

export const ReportList = ({
  reports,
  selectedIds,
  onSelectToggle,
  onSelectAllToggle,
}: ReportListProps) => {
  const { t } = useTranslation();

  const allSelected =
    reports.length > 0 && selectedIds.length === reports.length;

  const getReportSubject = (report: Report) => {
    if (report.type === 'adventure') {
      return t('Adventure report');
    }

    const data = report.data as
      | {
          attackerVillageName?: string;
          defenderVillageName?: string;
        }
      | undefined;

    if (report.type === 'attack') {
      return t('Attack on {{village}}', {
        village: data?.defenderVillageName ?? report.targetVillageId ?? '?',
      });
    }
    if (report.type === 'raid') {
      return t('Raid on {{village}}', {
        village: data?.defenderVillageName ?? report.targetVillageId ?? '?',
      });
    }
    if (report.type === 'defence') {
      return t('Defence against {{village}}', {
        village: data?.attackerVillageName ?? report.targetVillageId ?? '?',
      });
    }
    if (report.type === 'scout-attack') {
      return t('Scout on {{village}}', {
        village: data?.defenderVillageName ?? report.targetVillageId ?? '?',
      });
    }
    if (report.type === 'scout-defence') {
      return t('Scouts from {{village}}', {
        village: data?.attackerVillageName ?? report.targetVillageId ?? '?',
      });
    }

    return t('Report');
  };

  const getVillageLabel = (report: Report) => {
    const data = report.data as
      | {
          attackerVillageName?: string;
          defenderVillageName?: string;
          villageName?: string;
        }
      | undefined;

    if (report.type === 'defence') {
      return data?.defenderVillageName ?? report.villageId;
    }

    if (report.type === 'scout-defence') {
      return data?.defenderVillageName ?? report.villageId;
    }

    return data?.attackerVillageName ?? data?.villageName ?? report.villageId;
  };

  const getReportIcon = (report: Report) => {
    // For now, simple mapping based on type
    // In the future, this should use the 'data' to determine losses
    if (report.type === 'attack' || report.type === 'raid') {
      return icons.attackerNoLoss({ className: 'size-4' });
    }
    if (report.type === 'scout-attack' || report.type === 'scout-defence') {
      return icons.revealedIncomingTroopsAmount({ className: 'size-4' });
    }
    return icons.defence({ className: 'size-4' });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell className="w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => onSelectAllToggle(!!checked)}
            />
          </TableHeaderCell>
          <TableHeaderCell className="w-10">{t('Subject')}</TableHeaderCell>
          <TableHeaderCell>{t('Village')}</TableHeaderCell>
          <TableHeaderCell className="text-right">{t('Date')}</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center py-8 text-muted-foreground"
            >
              {t('No reports found.')}
            </TableCell>
          </TableRow>
        ) : (
          reports.map((report) => (
            <TableRow
              key={report.id}
              className={clsx(!report.isRead && 'bg-accent/50 font-semibold')}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(report.id)}
                  onCheckedChange={() => onSelectToggle(report.id)}
                />
              </TableCell>
              <TableCell>
                <Link
                  to={`./${report.id}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  {getReportIcon(report)}
                  <span>{getReportSubject(report)}</span>
                </Link>
              </TableCell>
              <TableCell>{getVillageLabel(report)}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {new Intl.DateTimeFormat('de-DE', {
                  year: '2-digit',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }).format(report.timestamp)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
