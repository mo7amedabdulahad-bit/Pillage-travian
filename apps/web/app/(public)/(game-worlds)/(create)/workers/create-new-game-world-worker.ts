import { migrateAndSeed } from '@pillage-first/db';
import type { Server } from '@pillage-first/types/models/server';
import { env } from '@pillage-first/utils/env';
import { createDbFacade } from '@pillage-first/utils/facades/database';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';

export type CreateNewGameWorldWorkerPayload = {
  server: Server;
  port: MessagePort;
};

export type CreateNewGameWorldWorkerResponse =
  | {
      type: 'progress';
    }
  | {
      type: 'result';
      migrationDuration: number;
    }
  | {
      type: 'error';
      message: string;
      stack?: string;
    };

globalThis.addEventListener(
  'message',
  async (event: MessageEvent<CreateNewGameWorldWorkerPayload>) => {
    const { server, port } = event.data;

    try {
      const { default: sqlite3InitModule } = await import(
        '@sqlite.org/sqlite-wasm'
      );

      const sqlite3 = await sqlite3InitModule();
      const opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
        directory: `/pillage-first-ask-questions-later/${server.slug}`,
      });

      const database = new opfsSahPool.OpfsSAHPoolDb(`/${server.slug}.sqlite3`);

      const dbFacade = createDbFacade(database, false);

      dbFacade.exec({
        sql: `
          PRAGMA user_version=${encodeAppVersionToDatabaseUserVersion(env.VERSION)};
          PRAGMA locking_mode=EXCLUSIVE;
          PRAGMA foreign_keys=OFF;
          PRAGMA journal_mode=OFF;
          PRAGMA synchronous=OFF;
          PRAGMA temp_store=MEMORY;
          PRAGMA cache_size=-20000;
        `,
      });

      const migrationDuration = migrateAndSeed(dbFacade, server, () => {
        port.postMessage({
          type: 'progress',
        } satisfies CreateNewGameWorldWorkerResponse);
      });

      dbFacade.close();
      database.close();
      opfsSahPool.pauseVfs();

      port.postMessage({
        type: 'result',
        migrationDuration,
      } satisfies CreateNewGameWorldWorkerResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      port.postMessage({
        type: 'error',
        message,
        stack,
      } satisfies CreateNewGameWorldWorkerResponse);
    } finally {
      port.close();
      globalThis.close();
    }
  },
);
