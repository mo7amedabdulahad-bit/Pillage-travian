import type { Config } from '@react-router/dev/config';
import {
  createSPAPagesWithPreloads,
  deleteSPAPreloadPage,
  replaceReactIconsSpritePlaceholdersOnPreRenderedPages,
} from './scripts/react-router-build-end-hook-scripts';

const publicPagesToPrerender = [
  '/',
  '/game-worlds',
  '/game-worlds/create',
  '/game-worlds/import',
  '/frequently-asked-questions',
  '/get-involved',
  '/latest-updates',
  '/404',
];

const reactRouterConfig: Config = {
  ssr: false,
  splitRouteModules: 'enforce',
  prerender: {
    concurrency: 4,
    paths: publicPagesToPrerender,
  },
  subResourceIntegrity: false,
  future: {
    unstable_optimizeDeps: true,
  },
  buildEnd: async (args) => {
    await createSPAPagesWithPreloads(args);
    await replaceReactIconsSpritePlaceholdersOnPreRenderedPages(args);
    await deleteSPAPreloadPage(args);
  },
};

export default reactRouterConfig;
