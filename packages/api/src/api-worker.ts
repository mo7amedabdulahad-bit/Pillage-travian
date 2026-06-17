import type {
  OpfsSAHPoolDatabase,
  SAHPoolUtil,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { upgradeDb } from '@pillage-first/db';
import type {
  ApiNotificationEvent,
  ControllerErrorEvent,
  DatabaseInitializationErrorEvent,
} from '@pillage-first/types/api-events';
import { env } from '@pillage-first/utils/env';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';
import {
  parseAppVersion,
  parseDatabaseUserVersion,
} from '@pillage-first/utils/version';
import {
  getGameSpeed,
  getLastSimulationTimestamp,
  NPC_BRAIN_CONSTANTS,
  processNPCTick,
  setLastSimulationTimestamp,
  simulateElapsedTime,
} from './controllers/resolvers/utils/npc-brain/index.ts';
import { OutdatedDatabaseSchemaError } from './errors';
import { matchRoute } from './routes/route-matcher.ts';
import {
  cancelScheduling,
  initScheduler,
  scheduleNextEvent,
} from './scheduler/scheduler';
import { createSchedulerDataSource } from './scheduler/scheduler-data-source';

let sqlite3: Sqlite3Static | null = null;
let opfsSahPool: SAHPoolUtil | null = null;
let database: OpfsSAHPoolDatabase | null = null;
let dbFacade: DbFacade | null = null;
let liveTickInterval: ReturnType<typeof setInterval> | null = null;

const LIVE_TICK_INTERVAL_MS = 60_000;

globalThis.addEventListener('message', async (event: MessageEvent) => {
  const { data } = event;
  const { type } = data;

  switch (type) {
    case 'WORKER_INIT': {
      try {
        const urlParams = new URLSearchParams(globalThis.location.search);
        const serverSlug = urlParams.get('server-slug')!;

        if (sqlite3 === null) {
          const { default: sqlite3InitModule } = await import(
            '@sqlite.org/sqlite-wasm'
          );

          sqlite3 = await sqlite3InitModule();
        }

        opfsSahPool = await sqlite3.installOpfsSAHPoolVfs({
          directory: `/pillage-first-ask-questions-later/${serverSlug}`,
        });

        // Database doesn't exist, common when opening game worlds created before the engine rewrite or when opening a deleted game world
        if (opfsSahPool.getFileCount() === 0) {
          throw new OutdatedDatabaseSchemaError();
        }

        database = new opfsSahPool.OpfsSAHPoolDb(`/${serverSlug}.sqlite3`);

        dbFacade = createDbFacade(database, false);

        dbFacade.exec({
          sql: `
          PRAGMA foreign_keys = ON;        -- keep referential integrity
          PRAGMA locking_mode = EXCLUSIVE; -- single-writer optimization
          PRAGMA journal_mode = OFF;       -- fastest; no rollback journal
          PRAGMA synchronous = OFF;        -- don't wait for OS to flush (fast, risky)
          PRAGMA temp_store = MEMORY;      -- temp tables + indices kept in RAM
          PRAGMA cache_size = -20000;      -- negative = KB, so -20000 => 20 MB cache
          PRAGMA secure_delete = OFF;      -- faster deletes (don't overwrite freed pages)
          PRAGMA wal_autocheckpoint = 0;   -- no WAL checkpointing (noop unless WAL used)
        `,
        });

        const version = dbFacade.selectValue({
          sql: 'PRAGMA user_version',
          schema: z.number().nullable(),
        });

        if (!version) {
          throw new OutdatedDatabaseSchemaError();
        }

        const [, dbMinor] = parseDatabaseUserVersion(version);
        const [, appMinor] = parseAppVersion(env.VERSION);

        if (dbMinor !== appMinor) {
          throw new OutdatedDatabaseSchemaError();
        }

        upgradeDb(dbFacade);

        // ─── NPC Brain: Start live heartbeat ───
        // Runs every 60 real seconds while the player is in-game
        liveTickInterval = setInterval(() => {
          if (!dbFacade) {
            return;
          }
          try {
            const speed = getGameSpeed(dbFacade);
            processNPCTick(dbFacade, LIVE_TICK_INTERVAL_MS, speed);
            setLastSimulationTimestamp(dbFacade, Date.now());
            globalThis.postMessage({
              eventKey: 'event:npc-live-tick',
              timestamp: Date.now(),
            });
          } catch (_tickError) {}
        }, LIVE_TICK_INTERVAL_MS);

        const dataSource = createSchedulerDataSource(dbFacade);

        initScheduler(dataSource);
        scheduleNextEvent(dataSource);

        // ─── Signal UI that database is ready ───
        // This must fire BEFORE the simulation so NPCBrainGate mounts first
        globalThis.postMessage({
          eventKey: 'event:database-initialization-success',
        } satisfies ApiNotificationEvent);

        // ─── NPC Brain: Offline catch-up simulation ───
        // Fire start event AFTER database-init-success so the UI has time to
        // mount NPCBrainGate and attach its event listener.
        globalThis.postMessage({
          eventKey: 'event:npc-simulation-start',
        });

        try {
          const lastSimTimestamp = getLastSimulationTimestamp(dbFacade);

          // Brand new world — skip simulation, just set timestamp to now
          if (lastSimTimestamp === 0) {
            setLastSimulationTimestamp(dbFacade, Date.now());
            globalThis.postMessage({
              eventKey: 'event:npc-simulation-complete',
              summary: null,
            });
          } else {
            const elapsedMs = Date.now() - lastSimTimestamp;

            if (elapsedMs > NPC_BRAIN_CONSTANTS.MIN_SIMULATION_ELAPSED_MS) {
              const simulationSummary = await simulateElapsedTime(
                dbFacade,
                elapsedMs,
              );
              setLastSimulationTimestamp(dbFacade, Date.now());

              globalThis.postMessage({
                eventKey: 'event:npc-simulation-complete',
                summary: simulationSummary,
              });
            } else {
              // No simulation needed — still fire complete so UI unblocks
              globalThis.postMessage({
                eventKey: 'event:npc-simulation-complete',
                summary: null,
              });
            }
          }
        } catch (_simError) {
          globalThis.postMessage({
            eventKey: 'event:npc-simulation-complete',
            summary: null,
          });
        }
        break;
      } catch (error) {
        const safeError =
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : { name: 'UnknownError', message: String(error) };

        globalThis.postMessage({
          eventKey: 'event:database-initialization-error',
          error: safeError as Error,
        } satisfies DatabaseInitializationErrorEvent);
        break;
      }
    }
    case 'WORKER_MESSAGE': {
      const { data, ports } = event;

      const [port] = ports;
      const { url, method, body } = data;

      try {
        const { controller, path, query } = matchRoute(url, method);
        const result = controller(dbFacade!, { path, query, body });

        port.postMessage({
          data: result,
        });

        break;
      } catch (error) {
        console.error(error);
        globalThis.postMessage({
          eventKey: 'event:error',
          error: error as Error,
        } satisfies ControllerErrorEvent);
        break;
      }
    }
    case 'WORKER_CLOSE': {
      // Stop the live heartbeat
      if (liveTickInterval !== null) {
        clearInterval(liveTickInterval);
        liveTickInterval = null;
      }

      cancelScheduling();

      dbFacade!.close();
      dbFacade = null;

      database!.close();
      database = null;

      globalThis.postMessage({ type: 'WORKER_CLOSE_SUCCESS' });
      break;
    }
  }
});
