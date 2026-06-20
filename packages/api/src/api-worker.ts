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
import type {
  FormulaFieldLevelData,
  FormulaVillageData,
} from './controllers/resolvers/utils/npc-brain/subsystems/build-simulation';
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
let npcBuildWorker: Worker | null = null;

const runOfflineSimulation = async () => {
  if (!dbFacade) {
    return;
  }

  globalThis.postMessage({
    eventKey: 'event:npc-simulation-start',
  });

  try {
    const lastSimTimestamp = getLastSimulationTimestamp(dbFacade);

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
};

const LIVE_TICK_INTERVAL_MS = 60_000;

/**
 * Fetch village data needed by the background build worker.
 * Returns villages and resource field levels.
 */
const fetchBuildWorkerData = (
  db: DbFacade,
): { villages: FormulaVillageData[]; fieldLevels: FormulaFieldLevelData[] } => {
  const villages = db.selectObjects({
    sql: `
      SELECT
        nvs.village_id AS villageId,
        nvs.faction_key AS factionKey,
        ti.tribe,
        t.x,
        t.y,
        nvs.building_budget AS buildingBudget,
        nvs.last_raided_ms AS lastRaidedMs,
        nvs.loot_at_last_raid AS lootAtLastRaid,
        nvs.max_loot_capacity AS maxLoot
      FROM npc_village_state nvs
      JOIN villages v ON v.id = nvs.village_id
      JOIN tiles t ON t.id = v.tile_id
      JOIN players p ON p.id = v.player_id
      LEFT JOIN tribe_ids ti ON ti.id = p.tribe_id;
    `,
    schema: z.any(),
  }) as unknown as FormulaVillageData[];

  const villageIds = villages.map((v) => v.villageId);
  if (villageIds.length === 0) {
    return { villages: [], fieldLevels: [] };
  }

  const placeholders = villageIds.map((_, i) => `$v${i}`).join(',');
  const binds: Record<string, number> = {};
  villageIds.forEach((vid, i) => {
    binds[`$v${i}`] = vid;
  });

  const fieldLevels = db.selectObjects({
    sql: `
      SELECT village_id AS villageId, field_id AS fieldId, level
      FROM building_fields
      WHERE village_id IN (${placeholders})
        AND field_id <= 18;
    `,
    bind: binds,
    schema: z.any(),
  }) as unknown as FormulaFieldLevelData[];

  return { villages, fieldLevels };
};

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
          PRAGMA locking_mode = NORMAL;    -- allow background worker to co-write
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

            // Send village data to background worker for building computation
            if (npcBuildWorker) {
              const { villages, fieldLevels } = fetchBuildWorkerData(dbFacade);
              // biome-ignore lint/suspicious/noConsole: Tick diagnostic
              console.log(
                '[NPC Tick] Sending',
                villages.length,
                'villages to build worker',
              );
              npcBuildWorker.postMessage({
                type: 'BUILD_BATCH',
                villages,
                fieldLevels,
                elapsedMs: LIVE_TICK_INTERVAL_MS,
                speed,
              });
            } else {
              // biome-ignore lint/suspicious/noConsole: Tick diagnostic
              console.warn('[NPC Tick] Build worker not available');
            }

            globalThis.postMessage({
              eventKey: 'event:npc-live-tick',
              timestamp: Date.now(),
            });
          } catch (_tickError) {}
        }, LIVE_TICK_INTERVAL_MS);

        // ─── Spawn background NPC build worker ───
        try {
          npcBuildWorker = new Worker(
            new URL('./workers/npc-build-worker.ts', import.meta.url),
            { type: 'module' },
          );

          npcBuildWorker.addEventListener('message', (e) => {
            const msg = e.data;
            if (msg.type === 'BUILD_ERROR') {
              // biome-ignore lint/suspicious/noConsole: Background worker error logging
              console.warn('[NPC Build Worker] Error:', msg.error);
            }
            if (msg.type === 'BUILD_COMPLETE') {
              // biome-ignore lint/suspicious/noConsole: Background worker diagnostic
              console.log(
                '[NPC Build Worker] Built:',
                msg.villagesBuilt,
                'buildings',
              );
            }
            if (msg.type === 'WORKER_READY') {
              // biome-ignore lint/suspicious/noConsole: Background worker diagnostic
              console.log('[NPC Build Worker] Ready');
            }
          });

          npcBuildWorker.addEventListener('error', (e) => {
            console.error('[NPC Build Worker] Fatal error:', e.message);
            npcBuildWorker = null;
          });

          npcBuildWorker.postMessage({
            type: 'WORKER_INIT',
            serverSlug,
          });
        } catch (_workerError) {
          // Background worker failed to spawn — building will be skipped
          npcBuildWorker = null;
        }

        const dataSource = createSchedulerDataSource(dbFacade);

        initScheduler(dataSource);
        scheduleNextEvent(dataSource);

        // ─── Signal UI that database is ready ───
        // NPCBrainGate will send WORKER_READY_FOR_SIMULATION back
        // once its listener is attached, then we run the simulation.
        globalThis.postMessage({
          eventKey: 'event:database-initialization-success',
        } satisfies ApiNotificationEvent);
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
    case 'WORKER_READY_FOR_SIMULATION': {
      runOfflineSimulation();
      break;
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

      // Terminate background build worker
      if (npcBuildWorker !== null) {
        npcBuildWorker.postMessage({ type: 'WORKER_CLOSE' });
        npcBuildWorker = null;
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
