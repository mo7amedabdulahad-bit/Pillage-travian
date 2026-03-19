import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { use } from 'react';
import type { Report } from '@pillage-first/types/models/report';
import { ApiContext } from 'app/(game)/providers/api-provider';

export type UseReportsOptions = {
  villageId: number;
  page?: number;
  pageSize?: number;
  type?: string;
  isArchived?: boolean;
};

export const useReports = ({
  villageId,
  page = 1,
  pageSize = 20,
  type,
  isArchived = false,
}: Partial<UseReportsOptions> = {}) => {
  const { fetcher } = use(ApiContext);

  const query = useQuery({
    queryKey: ['reports', villageId, page, pageSize, type, isArchived],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('pageSize', pageSize.toString());
      if (type) {
        queryParams.set('type', type);
      }
      queryParams.set('isArchived', isArchived.toString());

      const url = `/villages/${villageId}/reports?${queryParams.toString()}`;
      const { data } = await fetcher<{ items: Report[]; total: number }>(url);
      return data;
    },
    enabled: !!villageId,
  });

  return {
    ...query,
    reports: query.data?.items ?? [],
  };
};

export const useReport = (reportId: number) => {
  const { fetcher } = use(ApiContext);

  return useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const { data } = await fetcher<Report>(`/reports/${reportId}`);
      return data;
    },
    enabled: !!reportId,
  });
};

export const useReportActions = () => {
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: (reportIds: number[]) =>
      fetcher('/reports/mark-read', {
        method: 'POST',
        body: { reportIds },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const deleteReports = useMutation({
    mutationFn: (reportIds: number[]) =>
      fetcher('/reports', {
        method: 'DELETE',
        body: { reportIds },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const archiveReports = useMutation({
    mutationFn: (reportIds: number[]) =>
      fetcher('/reports/archive', {
        method: 'POST',
        body: { reportIds },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return { markAsRead, deleteReports, archiveReports };
};
