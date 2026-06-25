import { useSuspenseQuery } from '@tanstack/react-query';
import { use, useMemo, useState } from 'react';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'app/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Pagination } from 'app/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { SmartLogPanel } from './smart-log-panel';

type Report = {
  id: number;
  type: string;
  read: boolean;
  createdAt: string;
  data: Record<string, unknown>;
  fromPlayerId?: number;
  toPlayerId?: number;
  villageId?: number;
};

const REPORT_TYPES = [
  'attack',
  'defense',
  'scout',
  'trade',
  'npcRaid',
  'system',
];

export const LogsReportsTab = () => {
  const { fetcher } = use(ApiContext);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [readFilter, setReadFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data: reports } = useSuspenseQuery({
    queryKey: ['admin-reports', typeFilter, readFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) {
        params.set('type', typeFilter);
      }
      if (readFilter) {
        params.set('read', readFilter);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const { data } = await fetcher(`/admin/reports${query}`);
      return (data ?? []) as Report[];
    },
  });

  const filteredReports = useMemo(() => {
    return reports ?? [];
  }, [reports]);

  const pagination = usePagination(filteredReports, 20);

  return (
    <div className="space-y-4">
      <SmartLogPanel />

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {REPORT_TYPES.map((t) => (
                  <SelectItem
                    key={t}
                    value={t}
                  >
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={readFilter}
              onValueChange={setReadFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="true">Read</SelectItem>
                <SelectItem value="false">Unread</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setTypeFilter('');
                setReadFilter('');
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">
            Reports ({filteredReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="hidden md:block rounded-md border overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-background z-10 border-b">
                  <th className="p-3 text-left font-medium">ID</th>
                  <th className="p-3 text-left font-medium">Type</th>
                  <th className="p-3 text-center font-medium">Read</th>
                  <th className="p-3 text-left font-medium">Created</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.currentPageItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-3 text-center text-muted-foreground"
                    >
                      No reports
                    </td>
                  </tr>
                ) : (
                  pagination.currentPageItems.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedReport(report)}
                    >
                      <td className="p-3 font-mono">{report.id}</td>
                      <td className="p-3">
                        <Badge variant="outline">{report.type}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        {report.read ? (
                          <Badge className="bg-green-500 text-white">
                            Read
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500 text-white">
                            Unread
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {pagination.currentPageItems.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm p-3">
                No reports
              </div>
            ) : (
              pagination.currentPageItems.map((report) => (
                <button
                  type="button"
                  key={report.id}
                  className="rounded-lg border p-3 space-y-2 cursor-pointer w-full text-left"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">#{report.id}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                      >
                        {report.type}
                      </Badge>
                    </div>
                    {report.read ? (
                      <Badge className="bg-green-500 text-white text-[10px]">
                        Read
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500 text-white text-[10px]">
                        Unread
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(report.createdAt).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>

          {filteredReports.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination {...pagination} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedReport}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReport(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Report #{selectedReport?.id} - {selectedReport?.type}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  {selectedReport.read ? (
                    <Badge className="bg-green-500 text-white">Read</Badge>
                  ) : (
                    <Badge className="bg-blue-500 text-white">Unread</Badge>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="font-mono">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedReport.fromPlayerId && (
                  <div>
                    <span className="text-muted-foreground">From Player: </span>
                    <span className="font-mono">
                      {selectedReport.fromPlayerId}
                    </span>
                  </div>
                )}
                {selectedReport.toPlayerId && (
                  <div>
                    <span className="text-muted-foreground">To Player: </span>
                    <span className="font-mono">
                      {selectedReport.toPlayerId}
                    </span>
                  </div>
                )}
                {selectedReport.villageId && (
                  <div>
                    <span className="text-muted-foreground">Village ID: </span>
                    <span className="font-mono">
                      {selectedReport.villageId}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Report Data</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[300px]">
                  {JSON.stringify(selectedReport.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
