import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportFilters } from 'app/(game)/(village-slug)/(reports)/components/components/report-filters';
import { ReportList } from 'app/(game)/(village-slug)/(reports)/components/components/report-list';
import { useReportFilters } from 'app/(game)/(village-slug)/(reports)/components/hooks/use-report-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import {
  useReportActions,
  useReportsForVillages,
} from 'app/(game)/(village-slug)/hooks/use-reports';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Pagination } from 'app/components/ui/pagination';

export const Reports = () => {
  const { t } = useTranslation();
  const { playerVillages } = usePlayerVillageListing();
  const { reportFilters, onReportFiltersChange } = useReportFilters();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const pageSize = 20;

  const { markAsRead, deleteReports, archiveReports } = useReportActions();
  const { reports: allVillageReports } = useReportsForVillages({
    villageIds: playerVillages.map(({ id }) => id),
    isArchived: false,
  });

  const filteredReports = useMemo(() => {
    const reportFilterSet = new Set(reportFilters);

    return allVillageReports
      .filter((report) => reportFilterSet.has(report.type))
      .sort((left, right) => right.timestamp - left.timestamp);
  }, [allVillageReports, reportFilters]);

  const total = filteredReports.length;

  const pagination = usePagination(
    useMemo(() => new Array(total).fill(null), [total]),
    pageSize,
  );

  const { page } = pagination;

  // Re-fetch reports when page changes (the initial query above should use 'page')
  // Let's refine the query to use the page from pagination
  const displayReports = useMemo(() => {
    const start = (page - 1) * pageSize;

    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, page]);

  const onSelectToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const onSelectAllToggle = (allSelected: boolean) => {
    setSelectedIds(allSelected ? displayReports.map((r) => r.id) : []);
  };

  const handleMarkAsRead = () => {
    markAsRead.mutate(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const handleDelete = () => {
    if (confirm(t('Are you sure you want to delete selected reports?'))) {
      deleteReports.mutate(selectedIds, {
        onSuccess: () => setSelectedIds([]),
      });
    }
  };

  const handleArchive = () => {
    archiveReports.mutate(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('All reports')}</Text>
        <Text>
          {t(
            'This is a categorized view of in-game reports. You can toggle different types of reports by using report filters below.',
          )}
        </Text>
      </SectionContent>
      <ReportFilters
        reportFilters={reportFilters}
        onChange={onReportFiltersChange}
      />

      <div className="flex flex-col gap-4">
        <ReportList
          reports={displayReports}
          selectedIds={selectedIds}
          onSelectToggle={onSelectToggle}
          onSelectAllToggle={onSelectAllToggle}
        />

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.length === 0 || markAsRead.isPending}
              onClick={handleMarkAsRead}
            >
              {t('Mark as read')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.length === 0 || archiveReports.isPending}
              onClick={handleArchive}
            >
              {t('Archive')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={selectedIds.length === 0 || deleteReports.isPending}
              onClick={handleDelete}
            >
              {t('Delete')}
            </Button>
          </div>

          <Pagination {...pagination} />
        </div>
      </div>
    </Section>
  );
};
