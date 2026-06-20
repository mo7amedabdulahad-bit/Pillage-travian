import type {
  OpfsSAHPoolDatabase,
  SAHPoolUtil,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';
import {
  applyFormulaBuildResult,
  type FormulaBuildResult,
  type FormulaFieldLevelData,
  type FormulaVillageData,
  processFormulaBuild,
} from '../controllers/resolvers/utils/npc-brain/subsystems/build-simulation';

// ─── State ───
let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;
let database: OpfsSAHPoolDatabase | null = null;
let dbFacade: DbFacade | null = null;

// ─── Message Types ───
interface WorkerInitMessage {
  type: 'WORKER_INIT';
  serverSlug: string;
}

interface BuildBatchMessage {
  type: 'BUILD_BATCH';
  villages: FormulaVillageData[];
  fieldLevels: FormulaFieldLevelData[];
  elapsedMs: number;
  speed: number;
}

interface WorkerCloseMessage {
  type: 'WORKER_CLOSE';
}

type IncomingMessage =
  | WorkerInitMessage
  | BuildBatchMessage
  | WorkerCloseMessage;

// ─── Initialization ───
const initialize = async (slug: string): Promise<void> => {
  if (sqlite3 === null) {
    const { default: sqlite3InitModule } = await import(
      '@sqlite.org/sqlite-wasm'
    );
    sqlite3 = await sqlite3InitModule();
  }

  opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
    directory: `/pillage-first-ask-questions-later/${slug}`,
  });

  database = new opfsSahPool.OpfsSAHPoolDb(`/${slug}.sqlite3`);
  dbFacade = createDbFacade(database, false);

  // Same pragmas as main worker, except locking_mode = NORMAL
  dbFacade.exec({
    sql: `
      PRAGMA foreign_keys = ON;
      PRAGMA locking_mode = NORMAL;
      PRAGMA journal_mode = OFF;
      PRAGMA synchronous = OFF;
      PRAGMA temp_store = MEMORY;
      PRAGMA cache_size = -10000;
      PRAGMA secure_delete = OFF;
      PRAGMA wal_autocheckpoint = 0;
    `,
  });

  globalThis.postMessage({ type: 'WORKER_READY' });
};

// ─── Build Processing ───
const processBuildBatch = (
  villages: FormulaVillageData[],
  fieldLevels: FormulaFieldLevelData[],
  elapsedMs: number,
  speed: number,
): void => {
  if (!dbFacade) {
    globalThis.postMessage({
      type: 'BUILD_ERROR',
      error: 'Database not initialized',
    });
    return;
  }

  try {
    const result: FormulaBuildResult = processFormulaBuild(
      dbFacade,
      villages,
      fieldLevels,
      elapsedMs,
      speed,
    );

    if (result.buildUpdates.length > 0 || result.budgetUpdates.length > 0) {
      applyFormulaBuildResult(dbFacade, result);
    }

    globalThis.postMessage({
      type: 'BUILD_COMPLETE',
      villagesBuilt: result.villagesBuilt,
    });
  } catch (e) {
    globalThis.postMessage({
      type: 'BUILD_ERROR',
      error: e instanceof Error ? e.message : String(e),
    });
  }
};

// ─── Cleanup ───
const cleanup = (): void => {
  if (dbFacade) {
    dbFacade.close();
    dbFacade = null;
  }
  if (database) {
    database.close();
    database = null;
  }
  opfsSahPool = null;
  globalThis.postMessage({ type: 'WORKER_CLOSED' });
};

// ─── Message Handler ───
globalThis.addEventListener('message', async (event: MessageEvent) => {
  const { data } = event;
  const msg = data as IncomingMessage;

  switch (msg.type) {
    case 'WORKER_INIT': {
      try {
        await initialize(msg.serverSlug);
      } catch (e) {
        globalThis.postMessage({
          type: 'BUILD_ERROR',
          error: `Init failed: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
      break;
    }

    case 'BUILD_BATCH': {
      processBuildBatch(
        msg.villages,
        msg.fieldLevels,
        msg.elapsedMs,
        msg.speed,
      );
      break;
    }

    case 'WORKER_CLOSE': {
      cleanup();
      break;
    }
  }
});
