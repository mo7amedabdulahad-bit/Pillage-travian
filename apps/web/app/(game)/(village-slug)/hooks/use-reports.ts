import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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

type ReportsResponse = {
  items: Report[];
  total: number;
};

const buildReportsUrl = ({
  villageId,
  page,
  pageSize,
  type,
  isArchived,
}: {
  villageId: number;
  page: number;
  pageSize: number;
  type?: string;
  isArchived: boolean;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('pageSize', pageSize.toString());
  if (type) {
    queryParams.set('type', type);
  }
  queryParams.set('isArchived', isArchived.toString());

  return `/villages/${villageId}/reports?${queryParams.toString()}`;
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
      const { data } = await fetcher<ReportsResponse>(
        buildReportsUrl({
          villageId: villageId!,
          page,
          pageSize,
          type,
          isArchived,
        }),
      );
      return data;
    },
    enabled: !!villageId,
    refetchInterval: 2000,
  });

  return {
    ...query,
    reports: query.data?.items ?? [],
  };
};

export const useReportsForVillages = ({
  villageIds,
  pageSize = 100,
  isArchived = false,
}: {
  villageIds: number[];
  pageSize?: number;
  isArchived?: boolean;
}) => {
  const { fetcher } = use(ApiContext);

  const queries = useQueries({
    queries: villageIds.map((villageId) => ({
      queryKey: ['reports', villageId, 1, pageSize, undefined, isArchived],
      queryFn: async () => {
        const { data } = await fetcher<ReportsResponse>(
          buildReportsUrl({
            villageId,
            page: 1,
            pageSize,
            type: undefined,
            isArchived,
          }),
        );
        return data;
      },
      enabled: !!villageId,
      refetchInterval: 2000,
    })),
  });

  return {
    reports: queries.flatMap((query) => query.data?.items ?? []),
    isPending: queries.some((query) => query.isPending),
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
