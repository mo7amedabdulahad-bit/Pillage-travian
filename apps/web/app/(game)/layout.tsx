import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { memo, Suspense, use, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
  type ShouldRevalidateFunction,
} from 'react-router';
import type { ToasterProps } from 'sonner';
import type { Route } from '@react-router/types/app/(game)/+types/layout';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { LoadingSimulation } from 'app/(game)/components/loading-simulation/LoadingSimulation';
import { Notifier } from 'app/(game)/components/notifier';
import { WhileYouWereAway } from 'app/(game)/components/while-you-were-away/WhileYouWereAway';
import { serverExistAndLockMiddleware } from 'app/(game)/middleware/server-already-open-middleware';
import { ApiContext, ApiProvider } from 'app/(game)/providers/api-provider';
import { HeadLinks } from 'app/components/head-links.tsx';
import { Spinner } from 'app/components/ui/spinner';
import { Toaster } from 'app/components/ui/toaster';
import { useNPCBrain } from 'app/hooks/use-npc-brain';
import { loadAppTranslations } from 'app/localization/loaders/app';
import { CookieContext, CookieProvider } from 'app/providers/cookie-provider';

export { ErrorBoundary } from 'app/(game)/error-boundary.tsx';

export const clientLoader = async ({
  context,
  params,
}: Route.ClientLoaderArgs) => {
  const { serverSlug } = params;

  const locale = 'en-US';

  const [sessionModule] = await Promise.all([
    import('app/context/session'),
    loadAppTranslations(locale),
  ]);

  const { sessionContext } = sessionModule;
  const { sessionId } = context.get(sessionContext);

  return {
    sessionId,
    serverSlug,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return false;
};

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  serverExistAndLockMiddleware,
];

const LayoutFallback = () => {
  return (
    <div className="h-dvh w-full flex items-center justify-center bg-background!">
      <Spinner size="large" />
    </div>
  );
};

/**
 * NPC Brain Gate — wraps game content, blocks rendering during simulation.
 * Must be rendered inside ApiProvider so it can access apiWorker via context.
 */
const NPCBrainGate = ({ children }: { children: React.ReactNode }) => {
  const { apiWorker } = useContext(ApiContext);
  const queryClient = useQueryClient();
  const {
    isSimulating,
    offlineSummary,
    dismissSummary,
    lastLiveTickTimestamp,
  } = useNPCBrain(apiWorker);

  // When the NPC Brain live tick fires, invalidate map/village queries
  // so the UI re-renders with fresh troop counts, field levels, loot availability
  useEffect(() => {
    if (lastLiveTickTimestamp === null) {
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['tiles'] });
  }, [lastLiveTickTimestamp, queryClient]);

  // Block game screen while offline simulation runs
  if (isSimulating) {
    return <LoadingSimulation />;
  }

  return (
    <>
      {/* Show offline summary modal if there are events to report */}
      {offlineSummary && (
        <WhileYouWereAway
          summary={offlineSummary}
          onDismiss={dismissSummary}
        />
      )}
      {children}
    </>
  );
};

const LayoutContent = memo<Route.ComponentProps>(
  ({ params, loaderData }) => {
    const { serverSlug } = params;
    const { sessionId } = loaderData as unknown as { sessionId: string };

    const { i18n } = useTranslation();
    const { uiColorScheme } = use(CookieContext);
    const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

    const [queryClient] = useState<QueryClient>(
      new QueryClient({
        defaultOptions: {
          queries: {
            networkMode: 'always',
            retry: false,
          },
          mutations: {
            networkMode: 'always',
            retry: false,
          },
        },
      }),
    );

    const toasterPosition: ToasterProps['position'] = isWiderThanLg
      ? 'bottom-right'
      : 'top-right';

    useEffect(() => {
      const { promise, resolve } = Promise.withResolvers();

      navigator.locks.request(`${serverSlug}:${sessionId}`, () => promise);

      return () => {
        resolve(null);
      };
    }, [serverSlug, sessionId]);

    return (
      <html
        lang={i18n.language}
        className={uiColorScheme === 'dark' ? 'dark' : ''}
      >
        <head>
          <HeadLinks />
          <Links />
        </head>
        <body className="bg-background text-foreground transition-colors duration-300">
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<LayoutFallback />}>
              <ApiProvider serverSlug={serverSlug!}>
                <NPCBrainGate>
                  <Outlet />
                  <Notifier serverSlug={serverSlug!} />
                </NPCBrainGate>
              </ApiProvider>
            </Suspense>
            <Toaster
              position={toasterPosition}
              closeButton
            />
          </QueryClientProvider>
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    );
  },
  (prev, next) => {
    return prev.params.serverSlug === next.params.serverSlug;
  },
);

const Layout = (props: Route.ComponentProps) => {
  return (
    <CookieProvider>
      <LayoutContent {...props} />
    </CookieProvider>
  );
};

export default Layout;
