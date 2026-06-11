import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { debounce } from 'moderndash';
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useMemo,
} from 'react';
import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Server } from '@pillage-first/types/models/server';
import { eventsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useApiWorker } from 'app/(game)/hooks/use-api-worker';
import { cachesToClearOnResolve } from 'app/(game)/providers/constants/caches-to-clear-on-resolve';
import { isEventResolvedSuccessfullyNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import {
  createWorkerFetcher,
  type Fetcher,
} from 'app/(game)/providers/utils/worker-fetch';

type ApiProviderProps = {
  serverSlug: Server['slug'];
};

type ApiContextReturn = {
  apiWorker: Worker;
  fetcher: Fetcher;
};

export const ApiContext = createContext<ApiContextReturn>(
  {} as ApiContextReturn,
);

export const ApiProvider = ({
  children,
  serverSlug,
}: PropsWithChildren<ApiProviderProps>) => {
  const queryClient = useQueryClient();
  const { apiWorker } = useApiWorker(serverSlug);

  useEffect(() => {
    if (!apiWorker) {
      return;
    }

    const DEBOUNCE_MS = 150;
    const debouncedInvalidators = new Map<
      string,
      ReturnType<typeof debounce>
    >();

    const makeDebouncedInvalidator = (
      keyId: string,
      resolvedKey: readonly unknown[],
    ) => {
      const fn = async () => {
        try {
          await queryClient.invalidateQueries({
            queryKey: Array.from(resolvedKey),
          });
        } catch (error) {
          console.error('Failed to invalidate query', resolvedKey, error);
        }
      };

      // create debounced wrapper and store it
      const debounced = debounce(fn, DEBOUNCE_MS);
      debouncedInvalidators.set(keyId, debounced);
      return debounced;
    };

    const handleMessage = async (
      event: MessageEvent<EventApiNotificationEvent>,
    ) => {
      if (!isEventResolvedSuccessfullyNotificationMessageEvent(event)) {
        return;
      }

      const gameEvent = event.data as GameEvent;
      const { type } = gameEvent;

      // @ts-expect-error - We can't provide a generic here, so TS doesn't know which event it's dealing with
      const cachesToClear = cachesToClearOnResolve[type](gameEvent)!;

      for (const queryKey of cachesToClear) {
        const keyId = JSON.stringify(queryKey);

        const resolvedKey = Array.isArray(queryKey) ? queryKey : [queryKey];
        const debounced =
          debouncedInvalidators.get(keyId) ??
          makeDebouncedInvalidator(keyId, resolvedKey);
        debounced();
      }

      // also debounce invalidation of the global events cache key
      const eventsKeyId = JSON.stringify(eventsCacheKey);

      const evResolvedKey = [eventsCacheKey];
      const evDebounced =
        debouncedInvalidators.get(eventsKeyId) ??
        makeDebouncedInvalidator(eventsKeyId, evResolvedKey);
      evDebounced();

      // Trigger local notifications for completed events
      if (Capacitor.isNativePlatform()) {
        try {
          await LocalNotifications.requestPermissions();

          let title = '';
          let body = '';

          switch (type) {
            case 'buildingLevelChange': {
              const _buildingEvent =
                gameEvent as GameEvent<'buildingLevelChange'>;
              title = '🏗️ Construction Complete';
              body = 'Your building is ready!';
              break;
            }
            case 'troopTraining': {
              const _trainingEvent = gameEvent as GameEvent<'troopTraining'>;
              title = '⚔️ Training Complete';
              body = 'Your troops are ready!';
              break;
            }
            case 'troopMovementReturn': {
              title = '🏕️ Troops Returned';
              body = 'Your troops have returned!';
              break;
            }
            case 'adventurePointIncrease': {
              title = '🗺️ Adventure Ready';
              body = 'A new adventure is available!';
              break;
            }
          }

          if (title && body) {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title,
                  body,
                  id: Date.now(),
                  schedule: { at: new Date() },
                  sound: undefined,
                  smallIcon: 'ic_launcher',
                },
              ],
            });
          }
        } catch (error) {
          console.error('Failed to schedule notification:', error);
        }
      }
    };

    apiWorker.addEventListener('message', handleMessage);

    return () => {
      apiWorker.removeEventListener('message', handleMessage);

      // Attempt to cancel pending debounced calls
      for (const debounced of debouncedInvalidators.values()) {
        if (typeof debounced.cancel === 'function') {
          debounced.cancel();
        }
      }
      debouncedInvalidators.clear();
    };
  }, [apiWorker, queryClient]);

  const value: ApiContextReturn = useMemo(() => {
    return {
      apiWorker,
      fetcher: createWorkerFetcher(apiWorker),
    };
  }, [apiWorker]);

  return <ApiContext value={value}>{children}</ApiContext>;
};
