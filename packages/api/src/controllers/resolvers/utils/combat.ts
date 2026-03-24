import { z } from 'zod';
import type {
  CombatTroop,
  DefenseModifiers,
  WallType,
} from '@pillage-first/game-assets/combat/combat-engine';
import { WALL_DURABILITY } from '@pillage-first/game-assets/combat/combat-engine';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';

/**
 * Fetches all troops stationed at a specific tile.
 * Includes both the owner's troops and reinforcements.
 */
export const fetchDefenderTroops = (
  database: DbFacade,
  tileId: number,
): CombatTroop[] => {
  const rows = database.selectObjects({
    sql: `
      SELECT 
        u.unit as unitId, 
        t.amount,
        COALESCE(ui.level, 0) as smithyLevel
      FROM troops t
      JOIN unit_ids u ON t.unit_id = u.id
      JOIN villages v_source ON t.source_tile_id = v_source.tile_id
      LEFT JOIN unit_improvements ui ON v_source.player_id = ui.player_id AND t.unit_id = ui.unit_id
      WHERE t.tile_id = $tile_id AND t.amount > 0;
    `,
    bind: { $tile_id: tileId },
    schema: z.object({
      unitId: z.string(),
      amount: z.number(),
      smithyLevel: z.number(),
    }),
  });

  return rows.map((row) => ({
    unitId: row.unitId as UnitId,
    amount: row.amount,
    smithyLevel: row.smithyLevel,
  }));
};

/**
 * Fetches the attacker's troops with their respective smithy levels.
 */
export const getAttackerTroopsWithSmithy = (
  database: DbFacade,
  villageId: number,
  troops: { unitId: string; amount: number }[],
): CombatTroop[] => {
  const { playerId } = database.selectObject({
    sql: 'SELECT player_id as playerId FROM villages WHERE id = $villageId',
    bind: { $villageId: villageId },
    schema: z.object({ playerId: z.number() }),
  })!;

  const smithyLevels = database.selectObjects({
    sql: 'SELECT u.unit as unitId, ui.level FROM unit_improvements ui JOIN unit_ids u ON ui.unit_id = u.id WHERE ui.player_id = $playerId',
    bind: { $playerId: playerId },
    schema: z.object({ unitId: z.string(), level: z.number() }),
  });

  const smithyMap = new Map(smithyLevels.map((s) => [s.unitId, s.level]));

  return troops.map((t) => ({
    unitId: t.unitId as UnitId,
    amount: t.amount,
    smithyLevel: smithyMap.get(t.unitId) ?? 0,
  }));
};

/**
 * Fetches village defense modifiers (wall, palace/residence).
 */
export const fetchDefenseModifiers = (
  database: DbFacade,
  villageId: number,
): DefenseModifiers => {
  const buildings = database.selectObjects({
    sql: `
      SELECT b.building as buildingId, bf.level
      FROM building_fields bf
      JOIN building_ids b ON bf.building_id = b.id
      WHERE bf.village_id = $villageId AND b.building IN (
        'ROMAN_WALL', 'GAUL_WALL', 'TEUTONIC_WALL', 'EGYPTIAN_WALL', 'HUN_WALL', 'SPARTAN_WALL', 'NATAR_WALL', 'NATURE_WALL',
        'RESIDENCE', 'COMMAND_CENTER'
      );
    `,
    bind: { $villageId: villageId },
    schema: z.object({ buildingId: z.string(), level: z.number() }),
  });

  let wallType: WallType | null = null;
  let wallLevel = 0;
  let wallDurability = 0;
  let palaceLevel = 0;

  for (const b of buildings) {
    if (b.buildingId.endsWith('_WALL')) {
      wallType = b.buildingId as WallType;
      wallLevel = b.level;
      wallDurability = WALL_DURABILITY[b.buildingId] ?? 1;
    } else if (
      b.buildingId === 'RESIDENCE' ||
      b.buildingId === 'COMMAND_CENTER'
    ) {
      palaceLevel = Math.max(palaceLevel, b.level);
    }
  }

  return { wallType, wallLevel, wallDurability, palaceLevel };
};

/**
 * Updates the wall level after combat if it was damaged.
 */
export const updateWallLevel = (
  database: DbFacade,
  villageId: number,
  wallType: WallType,
  newLevel: number,
): void => {
  database.exec({
    sql: `
      UPDATE building_fields
      SET level = $newLevel
      WHERE village_id = $villageId AND building_id = (SELECT id FROM building_ids WHERE building = $wallType);
    `,
    bind: { $villageId: villageId, $newLevel: newLevel, $wallType: wallType },
  });
};
