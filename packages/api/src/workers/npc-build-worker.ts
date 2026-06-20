import {
  computeFormulaBuild,
  type FormulaBuildResult,
  type FormulaFieldLevelData,
  type FormulaVillageData,
} from '../controllers/resolvers/utils/npc-brain/subsystems/build-simulation';

interface BuildBatchMessage {
  type: 'BUILD_BATCH';
  villages: FormulaVillageData[];
  fieldLevels: FormulaFieldLevelData[];
  buildingIdMap: Record<string, number>;
  buildingLevels: {
    villageId: number;
    fieldId: number;
    buildingKey: string;
    level: number;
  }[];
  elapsedMs: number;
  speed: number;
}

globalThis.addEventListener('message', (event: MessageEvent) => {
  const msg = event.data as BuildBatchMessage;

  if (msg.type === 'BUILD_BATCH') {
    try {
      const result: FormulaBuildResult = computeFormulaBuild(
        msg.villages,
        msg.fieldLevels,
        msg.buildingIdMap,
        msg.buildingLevels,
        msg.elapsedMs,
        msg.speed,
      );

      globalThis.postMessage({ type: 'BUILD_RESULT', result });
    } catch (e) {
      globalThis.postMessage({
        type: 'BUILD_ERROR',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
});
