import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { use, useMemo, useState } from 'react';
import { useAdminDashboard } from 'app/(game)/(village-slug)/hooks/use-admin-dashboard';
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

type GameEvent = {
  id: number;
  type: string;
  resolved: boolean;
  createdAt: string;
  args: Record<string, unknown>;
  villageId?: number;
  playerId?: number;
};

const EVENT_TYPES = [
  'buildingLevelChange',
  'troopTraining',
  'troopMovementReturn',
  'adventurePointIncrease',
  'heroRevive',
  'resourceProduction',
  'npcRaid',
  'npcRetaliation',
];

export const EventInspectorTab = () => {
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();
  const { cancelEvent } = useAdminDashboard();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [resolvedFilter, setResolvedFilter] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);

  const { data: events } = useSuspenseQuery({
    queryKey: ['admin-events', typeFilter, resolvedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) {
        params.set('type', typeFilter);
      }
      if (resolvedFilter) {
        params.set('resolved', resolvedFilter);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const { data } = await fetcher(`/admin/events${query}`);
      return (data ?? []) as GameEvent[];
    },
  });

  const filteredEvents = useMemo(() => {
    return events ?? [];
  }, [events]);

  const pagination = usePagination(filteredEvents, 20);

  const handleCancel = async (eventId: number) => {
    await cancelEvent({ eventId });
    setSelectedEvent(null);
    await queryClient.invalidateQueries({ queryKey: ['admin-events'] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Event Filters</CardTitle>
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
                {EVENT_TYPES.map((t) => (
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
              value={resolvedFilter}
              onValueChange={setResolvedFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="true">Resolved</SelectItem>
                <SelectItem value="false">Unresolved</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setTypeFilter('');
                setResolvedFilter('');
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
            Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="hidden md:block rounded-md border overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-background z-10 border-b">
                  <th className="p-3 text-left font-medium">ID</th>
                  <th className="p-3 text-left font-medium">Type</th>
                  <th className="p-3 text-center font-medium">Status</th>
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
                      No events
                    </td>
                  </tr>
                ) : (
                  pagination.currentPageItems.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <td className="p-3 font-mono">{event.id}</td>
                      <td className="p-3">
                        <Badge variant="outline">{event.type}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        {event.resolved ? (
                          <Badge className="bg-green-500 text-white">
                            Resolved
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-black">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(event.id);
                          }}
                          disabled={event.resolved}
                        >
                          Cancel
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
                No events
              </div>
            ) : (
              pagination.currentPageItems.map((event) => (
                <button
                  type="button"
                  key={event.id}
                  className="rounded-lg border p-3 space-y-2 cursor-pointer w-full text-left"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">#{event.id}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                      >
                        {event.type}
                      </Badge>
                    </div>
                    {event.resolved ? (
                      <Badge className="bg-green-500 text-white text-[10px]">
                        Resolved
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500 text-black text-[10px]">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{new Date(event.createdAt).toLocaleString()}</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 px-2 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(event.id);
                      }}
                      disabled={event.resolved}
                    >
                      Cancel
                    </Button>
                  </div>
                </button>
              ))
            )}
          </div>

          {filteredEvents.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination {...pagination} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvent(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Event #{selectedEvent?.id} - {selectedEvent?.type}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  {selectedEvent.resolved ? (
                    <Badge className="bg-green-500 text-white">Resolved</Badge>
                  ) : (
                    <Badge className="bg-yellow-500 text-black">Pending</Badge>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="font-mono">
                    {new Date(selectedEvent.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedEvent.villageId && (
                  <div>
                    <span className="text-muted-foreground">Village ID: </span>
                    <span className="font-mono">{selectedEvent.villageId}</span>
                  </div>
                )}
                {selectedEvent.playerId && (
                  <div>
                    <span className="text-muted-foreground">Player ID: </span>
                    <span className="font-mono">{selectedEvent.playerId}</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Args</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-[300px]">
                  {JSON.stringify(selectedEvent.args, null, 2)}
                </pre>
              </div>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={selectedEvent.resolved}
                onClick={() => handleCancel(selectedEvent.id)}
              >
                Cancel Event
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
