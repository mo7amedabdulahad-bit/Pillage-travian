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

  const getReportIcon = (report: Report) => {
    // For now, simple mapping based on type
    // In the future, this should use the 'data' to determine losses
    if (report.type === 'attack' || report.type === 'raid') {
      return icons.attackerNoLoss({ className: 'size-4' });
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
                  <span>{t('Attack on...')}</span>{' '}
                  {/* Subject should be more dynamic */}
                </Link>
              </TableCell>
              <TableCell>
                {report.villageId} {/* Village name would be better */}
              </TableCell>
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
