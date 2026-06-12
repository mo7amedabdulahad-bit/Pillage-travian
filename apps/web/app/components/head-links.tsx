import { env } from '@pillage-first/utils/env';
import { SqlitePrefetchLink } from 'app/components/sqlite-prefetch-link.tsx';

export const HeadLinks = () => {
  return (
    <>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&display=swap"
        rel="stylesheet"
      />
      {env.MODE === 'production' && (
        <>
          <link
            rel="manifest"
            href="/manifest.webmanifest"
          />
          <link
            rel="preconnect"
            href={env.VITE_FARO_INGEST_ENDPOINT}
            crossOrigin="anonymous"
          />
        </>
      )}
      <link
        rel="icon"
        type="image/png"
        href={`/favicon-96x96.png?v=${env.GRAPHICS_VERSION}`}
        sizes="96x96"
      />
      <link
        rel="shortcut icon"
        href={`/favicon.ico?v=${env.GRAPHICS_VERSION}`}
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={`/apple-touch-icon.png?v=${env.GRAPHICS_VERSION}`}
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <meta
        name="apple-mobile-web-app-title"
        content="Pillage First!"
      />
      <SqlitePrefetchLink />
    </>
  );
};
