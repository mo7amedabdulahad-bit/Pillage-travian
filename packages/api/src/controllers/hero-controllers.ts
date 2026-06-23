import { z } from 'zod';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import type { ResourceProductionEffectId } from '@pillage-first/types/models/effect';
import { heroResourceToProduceSchema } from '@pillage-first/types/models/hero';
import { heroAdventuresSchema } from '@pillage-first/types/models/hero-adventures';
import type { Resource } from '@pillage-first/types/models/resource';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createController } from '../utils/controller';
import { updateVillageResourcesAt } from '../utils/village';
import { getHeroAppearanceSchema } from './schemas/hero-appearance-schemas';
import {
  getHeroInventorySchema,
  getHeroLoadoutSchema,
  getHeroSchema,
} from './schemas/hero-schemas';

export const getHero = createController('/players/:playerId/hero')(
  ({ database }) => {
    return database.selectObject({
      sql: `
        SELECT
          h.id,
          h.health,
          h.experience,
          h.base_attack_power,
          h.health_regeneration,
          h.damage_reduction,
          h.experience_modifier,
          h.speed,
          h.village_id,
          h.natarian_attack_bonus,
          h.attack_bonus,
          h.defence_bonus,
          h.resource_to_produce,
          hsa.attack_power,
          hsa.resource_production,
          hsa.attack_bonus,
          hsa.defence_bonus
        FROM
          heroes h
            JOIN
            hero_selectable_attributes hsa ON h.id = hsa.hero_id;
      `,
      schema: getHeroSchema,
    })!;
  },
);

export const getHeroLoadout = createController(
  '/players/:playerId/hero/equipped-items',
)(({ database }) => {
  return database.selectObjects({
    sql: `
      SELECT slot, item_id, amount
      FROM
        hero_equipped_items
      WHERE
        hero_id = (
          SELECT id
          FROM
            heroes
          LIMIT 1
          )
    `,
    schema: getHeroLoadoutSchema,
  })!;
});

export const getHeroInventory = createController(
  '/players/:playerId/hero/inventory',
)(({ database }) => {
  return database.selectObjects({
    sql: `
      SELECT i.item_id, i.amount
      FROM
        hero_inventory i
      WHERE
        i.hero_id = (
          SELECT h.id
          FROM
            heroes h
          ORDER BY h.id
          LIMIT 1
          )
    `,
    schema: getHeroInventorySchema,
  })!;
});

export const getHeroAdventures = createController(
  '/players/:playerId/hero/adventures',
)(({ database }) => {
  return database.selectObject({
    sql: 'SELECT available, completed FROM hero_adventures;',
    schema: heroAdventuresSchema,
  })!;
});

export const changeHeroAttributes = createController(
  '/players/:playerId/hero/attributes',
  'patch',
)(
  ({
    database,
    path: { playerId },
    body: { attackPower, resourceProduction, attackBonus, defenceBonus },
  }) => {
    database.transaction(() => {
      const hero = database.selectObject({
        sql: `
          SELECT h.id, ti.tribe
          FROM
            heroes h
              JOIN players p ON h.player_id = p.id
              JOIN tribe_ids ti ON p.tribe_id = ti.id
          WHERE
            p.id = $player_id
        `,
        bind: { $player_id: playerId },
        schema: z.strictObject({ id: z.number(), tribe: z.string() }),
      })!;

      database.exec({
        sql: `
          UPDATE hero_selectable_attributes
          SET
            attack_power = $attackPower,
            resource_production = $resourceProduction,
            attack_bonus = $attackBonus,
            defence_bonus = $defenceBonus
          WHERE
            hero_id = $hero_id
        `,
        bind: {
          $hero_id: hero.id,
          $attackPower: attackPower,
          $resourceProduction: resourceProduction,
          $attackBonus: attackBonus,
          $defenceBonus: defenceBonus,
        },
      });

      const strengthPerPoint = hero.tribe.toLowerCase() === 'romans' ? 100 : 80;
      const initialStrength = hero.tribe.toLowerCase() === 'romans' ? 100 : 80;

      const villageId = database.selectValue({
        sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.number(),
      })!;

      updateVillageResourcesAt(database, villageId, Date.now());

      database.exec({
        sql: `
          UPDATE heroes
          SET
            base_attack_power = $initialStrength + ($strengthPerPoint * $attackPower),
            attack_bonus = $attackBonus * 2, -- 0.2% * 10 (stored as integer)
            defence_bonus = $defenceBonus * 2
          WHERE
            id = $hero_id
        `,
        bind: {
          $hero_id: hero.id,
          $initialStrength: initialStrength,
          $strengthPerPoint: strengthPerPoint,
          $attackPower: attackPower,
          $attackBonus: attackBonus,
          $defenceBonus: defenceBonus,
        },
      });

      const isEgyptian = hero.tribe.toLowerCase() === 'egyptians';
      const sharedProductionPerPoint = isEgyptian ? 12 : 9;
      const focusedProductionPerPoint = isEgyptian ? 40 : 30;
      const resourceToProduce = database.selectValue({
        sql: 'SELECT resource_to_produce FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: heroResourceToProduceSchema,
      })!;

      const resourceProductionEffectIds = [
        'woodProduction',
        'clayProduction',
        'ironProduction',
        'wheatProduction',
      ];

      for (const effectId of resourceProductionEffectIds) {
        let value = sharedProductionPerPoint * resourceProduction;

        if (resourceToProduce !== 'shared') {
          const resourceMap: Record<Resource, ResourceProductionEffectId> = {
            wood: 'woodProduction',
            clay: 'clayProduction',
            iron: 'ironProduction',
            wheat: 'wheatProduction',
          };

          if (resourceMap[resourceToProduce] === effectId) {
            value = focusedProductionPerPoint * resourceProduction;
          } else {
            value = 0;
          }
        }

        database.exec({
          sql: `
            UPDATE effects
            SET
              value = $value
            WHERE
              source = 'hero'
              AND source_specifier = 0
              AND effect_id = (
                SELECT id
                FROM effect_ids
                WHERE effect = $effectId
                )
              AND village_id = $village_id
          `,
          bind: {
            $value: value,
            $effectId: effectId,
            $village_id: villageId,
          },
        });
      }
    });
  },
);

export const changeHeroResourceToProduce = createController(
  '/players/:playerId/hero/resource-to-produce',
  'patch',
)(({ database, path: { playerId }, body: { resource } }) => {
  database.transaction(() => {
    database.exec({
      sql: `
        UPDATE heroes
        SET
          resource_to_produce = $resource
        WHERE
          player_id = $player_id
      `,
      bind: {
        $player_id: playerId,
        $resource: resource,
      },
    });

    const hero = database.selectObject({
      sql: `
        SELECT hsa.resource_production, ti.tribe
        FROM
          hero_selectable_attributes hsa
            JOIN heroes h ON hsa.hero_id = h.id
            JOIN players p ON h.player_id = p.id
            JOIN tribe_ids ti ON p.tribe_id = ti.id
        WHERE
          p.id = $player_id
      `,
      bind: { $player_id: playerId },
      schema: z.strictObject({
        resource_production: z.number(),
        tribe: z.string(),
      }),
    })!;

    const isEgyptian = hero.tribe.toLowerCase() === 'egyptians';
    const sharedProductionPerPoint = isEgyptian ? 12 : 9;
    const focusedProductionPerPoint = isEgyptian ? 40 : 30;

    const villageId = database.selectValue({
      sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id',
      bind: { $player_id: playerId },
      schema: z.number(),
    })!;

    updateVillageResourcesAt(database, villageId, Date.now());

    const resourceProductionEffectIds = [
      'woodProduction',
      'clayProduction',
      'ironProduction',
      'wheatProduction',
    ];

    for (const effectId of resourceProductionEffectIds) {
      let value = sharedProductionPerPoint * hero.resource_production;

      if (resource !== 'shared') {
        const resourceMap: Record<string, string> = {
          wood: 'woodProduction',
          clay: 'clayProduction',
          iron: 'ironProduction',
          wheat: 'wheatProduction',
        };

        if (resourceMap[resource] === effectId) {
          value = focusedProductionPerPoint * hero.resource_production;
        } else {
          value = 0;
        }
      }

      database.exec({
        sql: `
          UPDATE effects
          SET
            value = $value
          WHERE
            source = 'hero'
            AND source_specifier = 0
            AND effect_id = (
              SELECT id
              FROM effect_ids
              WHERE effect = $effectId
              )
            AND village_id = $village_id
        `,
        bind: {
          $value: value,
          $effectId: effectId,
          $village_id: villageId,
        },
      });
    }
  });
});

export const equipHeroItem = createController(
  '/players/:playerId/hero/equipped-items',
  'patch',
)(({ database, path: { playerId }, body: { itemId, slot, amount } }) => {
  database.transaction(() => {
    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
      bind: { $player_id: playerId },
      schema: z.number(),
    })!;

    // 1. Get currently equipped item in this slot (if any)
    const currentlyEquipped = database.selectObject({
      sql: 'SELECT item_id, amount FROM hero_equipped_items WHERE hero_id = $hero_id AND slot = $slot',
      bind: { $hero_id: heroId, $slot: slot },
      schema: z.strictObject({ item_id: z.number(), amount: z.number() }),
    });

    if (currentlyEquipped && currentlyEquipped.item_id !== itemId) {
      // If a DIFFERENT item is there, move it back to inventory
      database.exec({
        sql: `
          INSERT INTO
            hero_inventory (hero_id, item_id, amount)
          VALUES
            ($hero_id, $equippedItemId, $equippedAmount)
          ON CONFLICT(hero_id, item_id) DO UPDATE SET
            amount = amount + EXCLUDED.amount
        `,
        bind: {
          $hero_id: heroId,
          $equippedItemId: currentlyEquipped.item_id,
          $equippedAmount: currentlyEquipped.amount,
        },
      });

      // Remove effects of replaced item
      database.exec({
        sql: "DELETE FROM effects WHERE source = 'hero' AND source_specifier = $itemId",
        bind: { $itemId: currentlyEquipped.item_id },
      });

      // Reverse direct stat modifications of replaced item
      const replacedItemDef = getItemDefinition(currentlyEquipped.item_id);
      if (replacedItemDef?.heroBonus) {
        for (const bonus of replacedItemDef.heroBonus) {
          if (bonus.attribute === 'power') {
            database.exec({
              sql: 'UPDATE heroes SET base_attack_power = MAX(0, base_attack_power - $value) WHERE id = $hero_id',
              bind: { $value: bonus.value, $hero_id: heroId },
            });
          }
        }
      }

      // Remove from equipped
      database.exec({
        sql: 'DELETE FROM hero_equipped_items WHERE hero_id = $hero_id AND slot = $slot',
        bind: { $hero_id: heroId, $slot: slot },
      });
    }

    // 2. Remove new item from inventory
    database.exec({
      sql: `
        DELETE
        FROM
          hero_inventory
        WHERE
          hero_id = $hero_id
          AND item_id = $itemId
          AND amount = $amount
      `,
      bind: { $hero_id: heroId, $itemId: itemId, $amount: amount },
    });

    database.exec({
      sql: `
        UPDATE hero_inventory
        SET
          amount = amount - $amount
        WHERE
          hero_id = $hero_id
          AND item_id = $itemId
          AND amount > $amount
      `,
      bind: { $hero_id: heroId, $itemId: itemId, $amount: amount },
    });

    // 3. Equip the new item
    database.exec({
      sql: `
        INSERT INTO
          hero_equipped_items (hero_id, slot, item_id, amount)
        VALUES
          ($hero_id, $slot, $itemId, $amount)
        ON CONFLICT(hero_id, slot) DO UPDATE SET
          amount = amount + EXCLUDED.amount
      `,
      bind: { $hero_id: heroId, $slot: slot, $itemId: itemId, $amount: amount },
    });

    // 4. Handle effects of newly equipped item via heroBonus
    const itemDef = getItemDefinition(itemId);
    if (itemDef?.heroBonus) {
      const villageId = database.selectValue({
        sql: 'SELECT id FROM villages WHERE player_id = $player_id LIMIT 1',
        bind: { $player_id: playerId },
        schema: z.number(),
      });

      for (const bonus of itemDef.heroBonus) {
        // Direct hero stat modifications
        if (bonus.attribute === 'power') {
          database.exec({
            sql: 'UPDATE heroes SET base_attack_power = base_attack_power + $value WHERE id = $hero_id',
            bind: { $value: bonus.value, $hero_id: heroId },
          });
          continue;
        }

        // Map heroBonus attributes to effect_ids where applicable
        const bonusToEffectMap: Record<string, string> = {
          infantryTraining: 'barracksTrainingDuration',
          cavalryTraining: 'stableTrainingDuration',
          troopSpeed: 'unitSpeedAfter20Fields',
        };

        const effectId = bonusToEffectMap[bonus.attribute];
        if (effectId && villageId) {
          database.exec({
            sql: `
              INSERT INTO
                effects (effect_id, value, type, scope, source, village_id, source_specifier)
              VALUES
                ((
                  SELECT id FROM effect_ids WHERE effect = $effectId
                ), $value, 'bonus', 'village', 'hero', $village_id, $itemId)
            `,
            bind: {
              $effectId: effectId,
              $value: bonus.value,
              $village_id: villageId,
              $itemId: itemId,
            },
          });
        }
      }
    }
  })!;
});

export const unequipHeroItem = createController(
  '/players/:playerId/hero/equipped-items/:slot',
  'delete',
)(({ database, path: { playerId, slot } }) => {
  database.transaction(() => {
    const heroId = database.selectValue({
      sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
      bind: { $player_id: playerId },
      schema: z.number(),
    })!;

    const equipped = database.selectObject({
      sql: 'SELECT item_id, amount FROM hero_equipped_items WHERE hero_id = $hero_id AND slot = $slot',
      bind: { $hero_id: heroId, $slot: slot },
      schema: z.strictObject({ item_id: z.number(), amount: z.number() }),
    });

    if (equipped) {
      // Move to inventory
      database.exec({
        sql: `
          INSERT INTO
            hero_inventory (hero_id, item_id, amount)
          VALUES
            ($hero_id, $itemId, $amount)
          ON CONFLICT(hero_id, item_id) DO UPDATE SET
            amount = amount + EXCLUDED.amount
        `,
        bind: {
          $hero_id: heroId,
          $itemId: equipped.item_id,
          $amount: equipped.amount,
        },
      });

      // Remove effect rows (handles training speed bonuses etc.)
      database.exec({
        sql: "DELETE FROM effects WHERE source = 'hero' AND source_specifier = $itemId",
        bind: { $itemId: equipped.item_id },
      });

      // Reverse direct hero stat modifications (power bonus)
      const itemDef = getItemDefinition(equipped.item_id);
      if (itemDef?.heroBonus) {
        for (const bonus of itemDef.heroBonus) {
          if (bonus.attribute === 'power') {
            database.exec({
              sql: 'UPDATE heroes SET base_attack_power = MAX(0, base_attack_power - $value) WHERE id = $hero_id',
              bind: { $value: bonus.value, $hero_id: heroId },
            });
          }
        }
      }

      // Remove from equipped
      database.exec({
        sql: 'DELETE FROM hero_equipped_items WHERE hero_id = $hero_id AND slot = $slot',
        bind: { $hero_id: heroId, $slot: slot },
      });
    }
  })!;
});

export const useHeroItem = createController(
  '/players/:playerId/hero/item',
  'post',
)(({ database, path: { playerId }, body: { itemId, amount } }) => {
  database.transaction(() => {
    const heroId = database.selectObject({
      sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
      bind: { $player_id: playerId },
      schema: z.strictObject({ id: z.number() }),
    })?.id;

    if (heroId === undefined) {
      throw new Error('Hero not found');
    }

    // Check inventory
    const inventoryAmount =
      database.selectObject({
        sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: { $hero_id: heroId, $itemId: itemId },
        schema: z.strictObject({ amount: z.number() }),
      })?.amount ?? 0;

    if (inventoryAmount < amount) {
      throw new Error('Not enough items in inventory');
    }

    let itemsToUse = amount;

    if (itemId === 106) {
      // OINTMENT (Heals 1% health per item)
      // HEALING_POTION
      const currentHealth = database.selectObject({
        sql: 'SELECT health FROM heroes WHERE id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ health: z.number() }),
      })!.health;

      const healthNeeded = 100 - currentHealth;
      if (healthNeeded <= 0) {
        return; // Already at full health
      }
      itemsToUse = Math.min(amount, healthNeeded);

      database.exec({
        sql: 'UPDATE heroes SET health = health + $healthToAdd WHERE id = $hero_id',
        bind: { $hero_id: heroId, $healthToAdd: itemsToUse },
      });
    } else if (itemId === 110) {
      // BOOK_OF_WISDOM
      // BOOK_OF_WISDOM
      itemsToUse = 1;

      const hero = database.selectObject({
        sql: `
          SELECT ti.tribe
          FROM
            heroes h
              JOIN players p ON h.player_id = p.id
              JOIN tribe_ids ti ON p.tribe_id = ti.id
          WHERE
            h.id = $hero_id
        `,
        bind: { $hero_id: heroId },
        schema: z.strictObject({ tribe: z.string() }),
      })!;

      const initialStrength = hero.tribe.toLowerCase() === 'romans' ? 100 : 80;

      const villageId = database.selectValue({
        sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id',
        bind: { $player_id: playerId },
        schema: z.number(),
      })!;

      updateVillageResourcesAt(database, villageId, Date.now());

      database.exec({
        sql: `
          UPDATE hero_selectable_attributes
          SET
            attack_power = 0,
            resource_production = 0,
            attack_bonus = 0,
            defence_bonus = 0
          WHERE
            hero_id = $hero_id
        `,
        bind: { $hero_id: heroId },
      });

      database.exec({
        sql: `
          UPDATE heroes
          SET
            base_attack_power = $initialStrength,
            attack_bonus = 0,
            defence_bonus = 0
          WHERE
            id = $hero_id
        `,
        bind: { $hero_id: heroId, $initialStrength: initialStrength },
      });

      const resourceProductionEffectIds = [
        'woodProduction',
        'clayProduction',
        'ironProduction',
        'wheatProduction',
      ];

      for (const effectId of resourceProductionEffectIds) {
        database.exec({
          sql: `
            UPDATE effects
            SET value = 0
            WHERE
              source = 'hero'
              AND source_specifier = 0
              AND effect_id = (SELECT id FROM effect_ids WHERE effect = $effectId)
              AND village_id = $village_id
          `,
          bind: {
            $effectId: effectId,
            $village_id: villageId,
          },
        });
      }
    } else if (itemId === 107) {
      // SCROLL (+10 experience per scroll)
      itemsToUse = amount;
      const experienceToAdd = 10 * amount;

      database.exec({
        sql: `
          UPDATE heroes
          SET
            experience = experience + $experienceToAdd
          WHERE
            id = $hero_id
        `,
        bind: { $hero_id: heroId, $experienceToAdd: experienceToAdd },
      });
    } else if (itemId === 108) {
      // BUCKET (Revives dead hero)
      itemsToUse = 1;
      const currentHealth = database.selectObject({
        sql: 'SELECT health FROM heroes WHERE id = $hero_id',
        bind: { $hero_id: heroId },
        schema: z.strictObject({ health: z.number() }),
      })!.health;

      if (currentHealth > 0) {
        throw new Error('Hero is not dead');
      }

      database.exec({
        sql: 'UPDATE heroes SET health = 100 WHERE id = $hero_id',
        bind: { $hero_id: heroId },
      });
    } else if (itemId === 111) {
      // ARTWORK
      // Usually adds CP equal to the production of the village in 24 hours.
      // For now, we add a flat 500 CP as a placeholder.
      itemsToUse = amount;
      const cpToAdd = 500 * amount;

      database.exec({
        sql: 'UPDATE players SET culture_points = culture_points + $cpToAdd WHERE id = $player_id',
        bind: { $player_id: playerId, $cpToAdd: cpToAdd },
      });
    } else {
      throw new Error('Item effect not implemented');
    }

    // Remove used items from inventory
    if (inventoryAmount === itemsToUse) {
      database.exec({
        sql: 'DELETE FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: { $hero_id: heroId, $itemId: String(itemId) },
      });
    } else {
      database.exec({
        sql: 'UPDATE hero_inventory SET amount = amount - $itemsUsed WHERE hero_id = $hero_id AND item_id = $itemId',
        bind: {
          $hero_id: heroId,
          $itemId: String(itemId),
          $itemsUsed: itemsToUse,
        },
      });
    }
  })!;
});

export const getHeroAppearance = createController(
  '/players/:playerId/hero/appearance',
)(({ database, path: { playerId } }) => {
  const appearance = database.selectObject({
    sql: `
        SELECT
          ha.gender,
          ha.skin_color,
          ha.hair_color,
          ha.eye_color,
          ha.jaw_id,
          ha.eyes_id,
          ha.brows_id,
          ha.nose_id,
          ha.mouth_id,
          ha.ears_id,
          ha.hair_id,
          ha.beard_id,
          ha.tattoo_id,
          ha.scar_id,
          ha.body_armor
        FROM hero_appearance ha
        JOIN heroes h ON ha.hero_id = h.id
        WHERE h.player_id = $player_id;
      `,
    bind: { $player_id: playerId },
    schema: getHeroAppearanceSchema,
  })!;

  if (!appearance) {
    return {
      gender: 'male',
      skinColor: 'skin1',
      hairColor: 'black',
      eyeColor: 'brown',
      jawId: 1,
      eyesId: 1,
      browsId: 1,
      noseId: 1,
      mouthId: 1,
      earsId: 1,
      hairId: 1,
      beardId: 0,
      tattooId: 0,
      scarId: 0,
      bodyArmor: 'teuton',
    };
  }

  return appearance;
});

export const updateHeroAppearance = createController(
  '/players/:playerId/hero/appearance',
  'patch',
)(
  ({
    database,
    path: { playerId },
    body: {
      gender,
      skinColor,
      hairColor,
      eyeColor,
      jawId,
      eyesId,
      browsId,
      noseId,
      mouthId,
      earsId,
      hairId,
      beardId,
      tattooId,
      scarId,
      bodyArmor,
    },
  }) => {
    database.exec({
      sql: `
      UPDATE hero_appearance
      SET
        gender = $gender,
        skin_color = $skinColor,
        hair_color = $hairColor,
        eye_color = $eyeColor,
        jaw_id = $jawId,
        eyes_id = $eyesId,
        brows_id = $browsId,
        nose_id = $noseId,
        mouth_id = $mouthId,
        ears_id = $earsId,
        hair_id = $hairId,
        beard_id = $beardId,
        tattoo_id = $tattooId,
        scar_id = $scarId,
        body_armor = $bodyArmor
      WHERE hero_id = (SELECT id FROM heroes WHERE player_id = $player_id)
    `,
      bind: {
        $player_id: playerId,
        $gender: gender,
        $skinColor: skinColor,
        $hairColor: hairColor,
        $eyeColor: eyeColor,
        $jawId: jawId,
        $eyesId: eyesId,
        $browsId: browsId,
        $noseId: noseId,
        $mouthId: mouthId,
        $earsId: earsId,
        $hairId: hairId,
        $beardId: beardId,
        $tattooId: tattooId,
        $scarId: scarId,
        $bodyArmor: bodyArmor,
      },
    });
  },
);

// ============================================================================
// Construction Plan helpers (Phase 4 — World Wonder endgame)
// ============================================================================
// Item ID 200 = CONSTRUCTION_PLAN (see packages/game-assets/src/items.ts)

/**
 * The item ID of the Construction Plan hero item.
 */
export const CONSTRUCTION_PLAN_ITEM_ID = 200;

/**
 * Check whether a hero already holds a Construction Plan.
 */
export const hasConstructionPlan = (
  database: DbFacade,
  heroId: number,
): boolean => {
  const row = database.selectObject({
    sql: 'SELECT amount FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $item_id',
    bind: { $hero_id: heroId, $item_id: CONSTRUCTION_PLAN_ITEM_ID },
    schema: z.strictObject({ amount: z.number() }),
  });
  return (row?.amount ?? 0) > 0;
};

/**
 * Grant a Construction Plan to a hero. Refuses if the hero already holds one.
 * Returns true on success, false if the hero already has a plan.
 */
export const grantConstructionPlan = (
  database: DbFacade,
  heroId: number,
): boolean => {
  if (hasConstructionPlan(database, heroId)) {
    return false;
  }
  database.exec({
    sql: `
      INSERT INTO hero_inventory (hero_id, item_id, amount)
      VALUES ($hero_id, $item_id, 1)
      ON CONFLICT(hero_id, item_id) DO UPDATE SET amount = amount + EXCLUDED.amount
    `,
    bind: { $hero_id: heroId, $item_id: CONSTRUCTION_PLAN_ITEM_ID },
  });
  return true;
};

/**
 * Remove the Construction Plan from a hero's inventory.
 * Called when the WW reaches Level 1 (plan is consumed).
 */
export const consumeConstructionPlan = (
  database: DbFacade,
  heroId: number,
): void => {
  database.exec({
    sql: 'DELETE FROM hero_inventory WHERE hero_id = $hero_id AND item_id = $item_id',
    bind: { $hero_id: heroId, $item_id: CONSTRUCTION_PLAN_ITEM_ID },
  });
};
