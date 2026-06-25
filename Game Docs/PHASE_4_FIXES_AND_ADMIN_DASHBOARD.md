# Phase 4 Bug Fixes + Full Admin Dashboard — Implementation Plan

> **Status:** Planning only — no code changes yet.
> **Scope:** Fix every bug found in the Phase 4 audit, then build a full admin dashboard that gives control of the entire server.
> **Ordered:** Part 1 (bug fixes) and Part 2 (admin dashboard) are **fully decoupled** — Part 2 depends on Part 1's bug fixes being committed, but the dashboard work items do not reference or touch the same code paths.

---

## Part 1 — Phase 4 Bug Fixes

Each fix below is independently committable. Run the full test suite (`@pillage-first/api` + `@pillage-first/db`) and type-check + lint after each fix.

---

### 1.1 CRITICAL — `garrison_power` never seeded

**Bug:** The `garrison_power` column on `npc_village_state` defaults to `0` and is never populated by any seeder or runtime code. The NPC wonder competition's strength gate (`factionPower < natarVillage.garrisonPower * 0.8` in `npc-wonder-competition.ts:186`) becomes `factionPower < 0`, which is always false. Every NPC faction captures a Natar plan immediately after the 24h warmup, regardless of troop strength. The entire "must be 80% as strong" gate is a no-op.

**Root cause:** `troop-seeder.ts` populates the `troops` table for Natar villages but never reflects the garrison strength into `npc_village_state.garrison_power`. `natar-villages-seeder.ts` and `npc-village-state-seeder.ts` also don't set it.

**Files to modify:**
- `packages/db/src/seeders/npc-village-state-seeder.ts`
- `packages/db/src/seeders/natar-villages-seeder.ts`

**Implementation:**

1. **In `npc-village-state-seeder.ts`** — after the existing `has_plan = 1` UPDATE (line 262), add a garrison-power recompute for **all** NPC villages (Natar + regular NPC). This ensures the column is correct for any village that has troops:

```sql
UPDATE npc_village_state
SET garrison_power = (
  SELECT COALESCE(SUM(t.amount), 0)
  FROM troops t
  JOIN villages v ON v.tile_id = t.tile_id
  WHERE v.id = npc_village_state.village_id
    AND t.source_tile_id = t.tile_id
    AND t.amount > 0
)
```

The recompute runs **after** `troop-seeder.ts` has populated the `troops` table. Since `troop-seeder.ts` runs after `npc-village-state-seeder.ts` (check migrate.ts line ordering), this UPDATE must be placed **at the end of `troop-seeder.ts`** instead — after all Natar garrisons are seeded.

2. **In `troop-seeder.ts`** — at the very end of the seeder, after all troops are inserted, add the same garrison-power recompute UPDATE above. This ensures the value reflects the actual seeded garrison.

3. **Alternative (also include for robustness):** Add the same UPDATE to `migrate.ts` immediately after the `troopSeeder(db, server)` call (lines 243-244), so even if a seeder is re-run without seeding troops, the value stays correct.

**Why not compute it in JS?** The SQL subquery is a single round-trip and runs after troops exist. It's cheaper and thread-safe (the DB is in a transaction during migration).

**Test:**
- Add test to `packages/api/src/controllers/__tests__/world-wonder.test.ts`:
  - Seed a test DB, query `npc_village_state` for a Natar village, assert `garrison_power > 0`.
  - Assert `garrison_power` is approximately equal to the sum of Natar garrison troop amounts.

---

### 1.2 CRITICAL — `construction_plan_held` never set to 1

**Bug:** `grantConstructionPlan` (in `hero-controllers.ts:891`) only inserts into `hero_inventory` but never updates `villages.construction_plan_held = 1`. Meanwhile, `startWorldWonder` (in `world-wonder-controllers.ts:46`) checks `construction_plan_held === 1` **first** and throws `'Village does not hold a Construction Plan'` before reaching the `hasConstructionPlan` hero-inventory check. A player who captures a plan can never start a WW.

**Root cause:** The plan-drop block in `combat-resolver.ts` calls `grantConstructionPlan` but doesn't update the village's `construction_plan_held` column.

**Decision:** The `construction_plan_held` column serves a different purpose than the hero-inventory check — it's a denormalized flag for "this village has the plan". But the plan follows the **hero**, not the village. The player's WW village may be different from the village that attacked the Natar village. So `construction_plan_held` should NOT be set on the attacker village — it should be set on the village where the WW is actually started.

**Fix — remove the broken precondition instead of setting it wrongly:**

**Files to modify:**
- `packages/api/src/controllers/world-wonder-controllers.ts`

**Implementation:**

In `world-wonder-controllers.ts` (the `startWorldWonder` controller), **remove** the `construction_plan_held !== 1` check (lines ~45-48). The `hasConstructionPlan(database, heroRow.id)` check on line ~93 is the correct and sufficient gate — it checks the hero's inventory for item ID 200.

The `construction_plan_held` column on `villages` becomes unused after this fix. We can leave it in the schema for future use (e.g. UI display) or remove the resolver's `SET construction_plan_held = 0` line too. **Decision: keep the column and the `SET construction_plan_held = 0` line** — the resolver sets it to 0 at WW level 1 for any future UI use, and the column stays at its default 0 otherwise. No migration needed.

**Also fix `grantConstructionPlan` to not use `ON CONFLICT DO UPDATE ... amount + EXCLUDED.amount`:**

In `hero-controllers.ts`, change the `grantConstructionPlan` INSERT to `ON CONFLICT DO NOTHING` (or keep the existing `ON CONFLICT` but the `hasConstructionPlan` guard prevents it from ever stacking). Since the guard already checks and throws, the `ON CONFLICT` path is unreachable in normal flow. Leave it as is — the guard is sufficient.

**Test:**
- Add test: simulate a plan drop (call `grantConstructionPlan`), then call `startWorldWonder` — it should succeed (not throw "Village does not hold a Construction Plan").

---

### 1.3 CRITICAL — Milestone reports saved to only one village

**Bug:** `saveNpcWonderMilestoneReport` (in `reports.ts`) inserts a single report row to one village (the WW owner's village, or `villageId = 0` if none found). The plan requires broadcasting milestone reports to **all** player villages so every player sees the milestone notification.

**Root cause:** The function doesn't iterate all village IDs, unlike `endServer` which does iterate.

**Files to modify:**
- `packages/api/src/controllers/resolvers/utils/reports.ts`

**Implementation:**

Rewrite `saveNpcWonderMilestoneReport` to broadcast to all player villages (mirror the `endServer` pattern at `world-wonder-resolvers.ts:113-130`):

```ts
export const saveNpcWonderMilestoneReport = (
  database: DbFacade,
  factionKey: string,
  milestoneType: NpcWonderMilestoneType,
  level?: number,
): void => {
  const now = Date.now();

  // Find the WW village for this faction (for the report data, not the target)
  const wwVillage = database.selectObject({
    sql: `
      SELECT ww.village_id AS villageId, ww.current_level AS currentLevel
      FROM world_wonders ww
      WHERE ww.owner_faction_id = $faction
      LIMIT 1
    `,
    bind: { $faction: factionKey },
    schema: z.strictObject({
      villageId: z.number(),
      currentLevel: z.number(),
    }),
  });

  const currentLevel = level ?? wwVillage?.currentLevel ?? 0;
  const data = JSON.stringify({
    factionKey,
    milestoneType,
    level: currentLevel,
    timestamp: now,
  });

  // Broadcast to every player village (mirrors endServer pattern)
  const allVillageIds = database.selectValues({
    sql: 'SELECT id FROM villages WHERE player_id = $playerId',
    bind: { $playerId: PLAYER_ID },
    schema: z.number(),
  });

  for (const villageId of allVillageIds) {
    database.exec({
      sql: `
        INSERT INTO reports (
          type, village_id, target_village_id, timestamp,
          attacker_faction_id, defender_faction_id, data, is_read
        )
        VALUES ($type, $villageId, NULL, $timestamp, NULL, NULL, $data, 0)
      `,
      bind: {
        $type: 'npc_wonder_milestone',
        $villageId: villageId,
        $timestamp: now,
        $data: data,
      },
    });
  }
};
```

**Key change:** `SELECT id FROM villages WHERE player_id = $playerId` — only the player's villages get the report (NPC villages don't need it). The `target_village_id` is `NULL` (this is a system message, not a combat report). The `data` JSON includes `factionKey`, `milestoneType`, `level`, `timestamp`.

**Test:**
- Add test: call `saveNpcWonderMilestoneReport`, assert the number of `npc_wonder_milestone` report rows equals the number of player villages.
- Add test: assert the report data JSON contains the correct `factionKey`, `milestoneType`, and `level`.

---

### 1.4 CRITICAL — NPC reaching WW Level 20 doesn't end the game

**Bug:** In `world-wonder-resolvers.ts:54`, `endServer` is gated on `ownerPlayerId !== null`. For NPC factions, the `ownerPlayerId` is a synthetic NPC player ID (it's non-null), but the resolver always calls `endServer(database, 'player', ownerPlayerId, resolvesAt)`. There's no path that calls `endServer(database, 'natars', ownerPlayerId, resolvesAt)` for NPC wins. An NPC faction reaching WW Level 20 silently does nothing — the server never ends.

**Root cause:** The `targetLevel === 20` branch checks `ownerPlayerId !== null` to distinguish "someone owns this WW" from "nobody", but doesn't check `ownerFactionId` to distinguish player vs NPC.

**Files to modify:**
- `packages/api/src/controllers/resolvers/world-wonder-resolvers.ts`

**Implementation:**

Replace the `targetLevel === 20` block (lines 54-67) with faction-aware logic:

```ts
// 4. At Level 20: trigger server end
if (targetLevel === 20) {
  if (ownerFactionId === 'player' && ownerPlayerId !== null) {
    // Player wins
    endServer(database, 'player', ownerPlayerId, resolvesAt);
    saveNpcWonderMilestoneReport(database, 'player', 'finished', targetLevel);
  } else if (ownerFactionId !== 'player' && ownerPlayerId !== null) {
    // NPC faction wins — Defeat for the player
    endServer(database, 'natars', ownerPlayerId, resolvesAt);
    saveNpcWonderMilestoneReport(database, ownerFactionId, 'finished', targetLevel);
  }
}
```

The `winnerType` is `'natars'` for any NPC faction win (because the plan says "any NPC's Wonder reaches 20 → Defeat"). The `winnerPlayerId` is the synthetic NPC player ID (for record-keeping). The `saveNpcWonderMilestoneReport` broadcast (`'finished'`) tells all player villages about the defeat.

**Test:**
- Add test: call `worldWonderUpgradeResolver` with `targetLevel: 20, ownerFactionId: 'npc1', ownerPlayerId: <npc_player_id>`, assert `servers.winner_type === 'natars'`.
- Add test: assert `npc_wonder_milestone` reports with `milestoneType: 'finished'` are created for all player villages.

---

### 1.5 HIGH — Scheduler doesn't short-circuit when server ends

**Bug:** Per plan §7.4, `resolveEvent` should short-circuit when `servers.ended_at IS NOT NULL`. No such check exists in `resolveEvent`, `scheduler.ts`, or `scheduler-data-source.ts`. After a WW reaches L20, all pending events (troop returns, building completions, etc.) still resolve.

**Root cause:** The scheduler and resolver were never updated to read `ended_at`.

**Files to modify:**
- `packages/api/src/scheduler/scheduler-data-source.ts`

**Implementation:**

In `scheduler-data-source.ts`, add `AND (SELECT ended_at FROM servers LIMIT 1) IS NULL` to the `getPastEventIds` and `getNextEvent` queries. This prevents the scheduler from ever fetching events after the server has ended. Events remain in the DB (per plan: "leave the events table intact for post-game inspection"), but none are selected for resolution.

```ts
// getPastEventIds query:
SELECT id FROM events
WHERE resolves_at <= $now
  AND resolved_at IS NULL
  AND (SELECT ended_at FROM servers LIMIT 1) IS NULL
```

```ts
// getNextEvent query:
SELECT id FROM events
WHERE resolved_at IS NULL
  AND (SELECT ended_at FROM servers LIMIT 1) IS NULL
ORDER BY resolves_at ASC
LIMIT 1
```

**Why the scheduler-data-source and not resolveEvent?** Blocking at the data-source layer is cleaner — the resolver never sees the event, so no side effects fire. Doing it in `resolveEvent` means the event is already dequeued and the resolver would need to re-insert or mark it, which is messier.

**Test:**
- Add test: insert an event with `resolves_at < now`, set `servers.ended_at = now`, call `getPastEventIds` — assert empty array.
- Reset `ended_at = NULL`, call `getPastEventIds` — assert non-empty array.

---

### 1.6 HIGH — Enemy aggression boost missing WW level ≥ 5 gate

**Bug:** In `proactive-attack.ts:536-538`, the +30% distance reduction (`dist *= 0.7`) applies to ALL WW villages regardless of level. The plan (§8.4) says "AND target WW level ≥ 5". Even a freshly-started L0 WW gets the enemy-preference targeting. Also the threshold uses `ALLY_THRESHOLD` (45000 = "friendly") instead of the plan's "reputation < 50" — but 45000 is the in-code friendly level, so this is acceptable.

**Root cause:** The WW-level gate was omitted.

**Files to modify:**
- `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/proactive-attack.ts`

**Implementation:**

The `getPlayerVillages` query (lines ~181-203) returns `is_world_wonder_village` as a 0/1 number. Extend it to also return `world_wonder_level`:

```sql
SELECT
  v.id AS villageId,
  v.tile_id AS tileId,
  t.x,
  t.y,
  v.is_world_wonder_village AS isWwVillage,
  v.world_wonder_level AS wwLevel
FROM villages v
JOIN tiles t ON t.id = v.tile_id
WHERE v.player_id = $playerId;
```

Then in the nearest-village selection (lines ~527-542), gate the distance boost on `wwLevel >= 5`:

```ts
// Find nearest player village (enemy factions prefer WW villages at L≥5: -30% distance)
const isEnemy = reputation < ALLY_THRESHOLD;
let nearestPlayerVillage = playerVillages[0];
let nearestDistance = Number.POSITIVE_INFINITY;
for (const pv of playerVillages) {
  let dist = mapDistance(
    { x: village.x, y: village.y },
    { x: pv.x, y: pv.y },
  );
  // Enemy factions preferentially target WW villages at level ≥ 5
  if (isEnemy && pv.isWwVillage && pv.wwLevel >= 5) {
    dist *= 0.7;
  }
  if (dist < nearestDistance) {
    nearestDistance = dist;
    nearestPlayerVillage = pv;
  }
}
```

**Test:**
- Add test to the NPC brain reconciliation test suite: seed a WW village at level 3, verify enemy faction does NOT preferentially target it. Seed at level 5, verify it does.

---

### 1.7 HIGH — Only 1 level queueable instead of 2

**Bug:** The plan (§3.3) says "2 levels queueable" for WW villages. The validation in `events.ts:523-537` rejects `targetLevel N+2` while `N+1` is pending because `world_wonder_level` is only bumped at resolution, not creation. The resolver's docstring falsely claims "level has already been incremented at event creation time".

**Root cause:** No creation-time level bump — the WW level stays at N until the L→N+1 event resolves. The validation reads the current level and rejects N+2.

**Decision:** Implement creation-time level bump (as the misleading comment suggests). This correctly mirrors how the vanilla game queues 2 levels.

**Files to modify:**
- `packages/api/src/controllers/world-wonder-controllers.ts` (start + upgrade controllers)
- `packages/api/src/controllers/resolvers/world-wonder-resolvers.ts` (remove the comment and the level bump from the resolver)
- `packages/api/src/controllers/utils/events.ts` (validation logic)

**Implementation:**

1. **In `world-wonder-controllers.ts`** — when `startWorldWonder` or `upgradeWorldWonder` calls `createEvents<'worldWonderUpgrade'>`, also bump the level **immediately**:

```ts
// After createEvents call:
db.exec({
  sql: 'UPDATE world_wonders SET current_level = $level WHERE village_id = $villageId',
  bind: { $level: targetLevel, $villageId: villageId },
});
db.exec({
  sql: 'UPDATE villages SET world_wonder_level = $level WHERE id = $villageId',
  bind: { $level: targetLevel, $villageId: villageId },
});
```

2. **In `world-wonder-resolvers.ts`** — remove the level bump from `worldWonderUpgradeResolver` (lines 28-37). The resolver should only handle side effects (plan consumption at L1, endServer at L20, milestone reports). Update the docstring to reflect this: "When the event fires, the WW level has already been incremented at event creation time. This resolver handles side effects only."

3. **In `events.ts` `validateEventCreationPrerequisites`** — the validation `targetLevel !== (currentLevel ?? 0) + 1` stays the same, but now `currentLevel` reflects the **bumped** level. So if L1→L2 is in-flight, `currentLevel` is 2, and queuing L2→L3 passes validation (`3 === 2 + 1`). Queuing L3→L4 fails (`4 !== 2 + 1`). This correctly allows exactly 2 levels in-flight.

4. **In the NPC `queueNextNpcWwUpgrade`** (`npc-wonder-competition.ts`) — no change needed. It calls `createEvents<'worldWonderUpgrade'>`, which will trigger the same creation-time bump if we wire it into `createEvents` or the controller. **Decision: put the bump in the controller** (both player and NPC paths go through `createEvents`, but the NPC path calls `createEvents` directly, not the controller). So either:
   - Add the bump inside `createEvents` when `type === 'worldWonderUpgrade'` (centralized), OR
   - Add the bump in both the player controller and the NPC `queueNextNpcWwUpgrade`.

   **Prefer centralized:** Add the bump inside `events.ts` `createEvents` (or `runEventCreationSideEffects`) when the event type is `worldWonderUpgrade`.

**Test:**
- Add test: queue L1→L2, then queue L2→L3 while L1→L2 is pending — assert both succeed.
- Add test: queue L3→L4 while L1→L2 is pending — assert it throws "must be upgraded one level at a time".
- Add test: assert `world_wonders.current_level` is bumped at creation time, not at resolution time.

---

### 1.8 HIGH — WW village not unconquerable after Level 1

**Bug:** The plan (§3.3) says "After Level 1, village cannot be conquered". The conquest path in `combat-resolver.ts:1946-1962` only checks for palace/residence presence. There's no check on `is_world_wonder_village` or `world_wonder_level >= 1`. A player WW village at L1+ can be chiefed.

**Root cause:** No WW check in the conquest blocker.

**Files to modify:**
- `packages/api/src/controllers/resolvers/utils/combat-resolver.ts`

**Implementation:**

In the conquest block (around line 1946), add a WW check. After the existing `adminBuilding` check, add:

```ts
if (newLoyalty === 0) {
  // Check if admin building blocks conquest
  const adminBuilding = _hasPalaceOrResidence(database, targetId);
  if (!adminBuilding.exists) {
    // Check if WW village blocks conquest (plan §3.3: unconquerable after L1)
    const wwLevel = database.selectValue({
      sql: 'SELECT world_wonder_level FROM villages WHERE id = $villageId',
      bind: { $villageId: targetId },
      schema: z.number(),
    }) ?? 0;
    if (wwLevel >= 1) {
      // WW village cannot be conquered — report as defended
      reportConquered = false;
      // Optionally: set loyalty back to a small value to reflect "cannot conquer"
      database.exec({
        sql: 'UPDATE villages SET loyalty = $loyalty WHERE id = $villageId',
        bind: { $loyalty: 100, $villageId: targetId },
      });
    } else {
      _transferVillageOwnership(database, targetId, PLAYER_ID, resolvesAt);
      reportConquered = true;
    }
  }
  // ... existing report logic
}
```

**Test:**
- Add test to `combat-conquest.test.ts`: seed a WW village at level 1, send a chief attack that reduces loyalty to 0, assert the village is NOT conquered and loyalty resets.

---

### 1.9 HIGH — retaliation-execution.ts doesn't skip Natars

**Bug:** `retaliation-execution.ts` has no `isPassiveFaction` check. If a Natar village ever gets a `npc_retaliation_queue` entry, the system would launch a Natar retaliation attack — contradicting the "passive defenders" design. Currently mitigated by upstream skips in `reputation-impact.ts` and `proactive-attack.ts`, but this is a defense-in-depth violation.

**Root cause:** No faction filter in the execution layer.

**Files to modify:**
- `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/retaliation-execution.ts`

**Implementation:**

1. Import `isPassiveFaction` at the top:
```ts
import { isPassiveFaction } from '../npc-brain-types';
```

2. In the due-queue-items processing loop (around line 73), add a skip:
```ts
for (const item of dueQueueItems) {
  if (isPassiveFaction(item.factionKey)) {
    continue;
  }
  // ... existing processing
}
```

3. In the armed-revenge-intents loop (around line 151), add the same skip:
```ts
for (const intent of armedIntents) {
  if (isPassiveFaction(intent.factionKey)) {
    continue;
  }
  // ... existing processing
}
```

**Test:**
- Add test: manually insert a `npc_retaliation_queue` row for a Natar village, call `processDueRetaliations`, assert no attack event is created.

---

### 1.10 MEDIUM — No walls/residence/palace restriction in WW village

**Bug:** The plan (§3.3) says "No walls/residence/palace buildable in WW village". Not implemented anywhere.

**Root cause:** No WW-village check in the building-construction validation path.

**Files to modify:**
- `packages/api/src/controllers/utils/events.ts` — in `validateEventCreationPrerequisites`, add a check for building-construction events.

**Implementation:**

In `validateEventCreationPrerequisites`, for `buildingConstruction` / `buildingLevelChange` / `buildingScheduledConstruction` events, add:

```ts
// Check if target village is a WW village and the building is forbidden
if ('buildingId' in event && event.buildingId) {
  const isWwVillage = database.selectValue({
    sql: 'SELECT is_world_wonder_village FROM villages WHERE id = $villageId',
    bind: { $villageId: event.villageId },
    schema: z.number(),
  }) ?? 0;
  if (isWwVillage === 1) {
    const forbiddenInWw = ['ROMAN_WALL', 'TEUTONIC_WALL', 'HUN_WALL', 'GAUL_WALL', 'EGYPTIAN_WALL', 'SPARTAN_WALL', 'NATAR_WALL', 'NATURE_WALL', 'VIKING_WALL', 'RESIDENCE', 'PALACE'];
    if (forbiddenInWw.includes(event.buildingId)) {
      throw new Error(`${event.buildingId} cannot be built in a World Wonder village`);
    }
  }
}
```

**Test:**
- Add test: seed a WW village, attempt to queue a `RESIDENCE` construction — assert it throws.
- Add test: attempt to queue a `BARRACKS` construction — assert it succeeds (allowed).

---

### 1.11 MEDIUM — `holds_plan` set on ALL faction villages

**Bug:** In `npc-wonder-competition.ts:200-207`, `UPDATE npc_village_state SET holds_plan = 1 WHERE faction_key = $faction` marks every village of that faction as holding the plan. Functionally works because the consume-side uses the same broad UPDATE, but it's semantically wrong — only one village should hold the plan.

**Root cause:** Over-broad UPDATE without a village-id constraint.

**Files to modify:**
- `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/npc-wonder-competition.ts`

**Implementation:**

In `tryAcquirePlan` (lines 191-207), instead of updating all faction villages, just track plan ownership at the faction level. The simplest fix: keep the broad UPDATE but rename the column semantically — it means "this faction holds a plan" (not "this village holds a plan"). The `holds_plan` column on `npc_village_state` is misnamed; it should be on `npc_faction_state` instead.

**Minimal fix (no schema change):** Set `holds_plan = 1` only on the faction's WW-designated village (the one with the highest population), and set it to 0 on all others. This correctly models "one village holds the plan".

```ts
// In tryAcquirePlan, replace the broad UPDATE with:
// Find the faction's strongest village
const wwVillage = database.selectValue({
  sql: `
    SELECT v.id FROM villages v
    JOIN players p ON p.id = v.player_id
    JOIN faction_ids fi ON fi.id = p.faction_id
    WHERE fi.faction = $faction
    ORDER BY v.total_fields DESC LIMIT 1
  `,
  bind: { $faction: factionKey },
  schema: z.number(),
});

if (!wwVillage) return;

// Set holds_plan only on the WW village, clear it on all others
database.exec({
  sql: 'UPDATE npc_village_state SET holds_plan = CASE WHEN village_id = $wwVillage THEN 1 ELSE 0 END WHERE faction_key = $faction',
  bind: { $faction: factionKey, $wwVillage: wwVillage },
});
```

**Test:**
- Add test: after `tryAcquirePlan`, assert only ONE village of the faction has `holds_plan = 1`.

---

### 1.12 MEDIUM — Natar garrison unit set differs from plan

**Bug:** The plan specifies 9 units: Pikeman, Thorned Warrior, Guardsman, Bird of Prey, Axerider, Natarian Knight, War Elephant, Ballista, Natarian Emperor. The implementation uses `NATARIAN_SCOUT, NATARIAN_RAM, NATARIAN_CATAPULT, NATARIAN_CHIEF` instead of `BIRD_OF_PREY, WAR_ELEPHANT, BALLISTA, NATARIAN_EMPEROR`. The latter three exist in `units.ts` but are unused. `BIRD_OF_PREY` does not exist anywhere — `NATARIAN_SCOUT` is the scout-equivalent.

**Root cause:** The seeder was written with different units than the plan specifies.

**Decision:** This may be an intentional rebalancing (rams/catapults/chief are thematically appropriate). **Leave as is** but document the discrepancy. If the plan owner wants the plan's units, replace `NATARIAN_SCOUT → NATARIAN_SCOUT` (keep, it's the only scout), `NATARIAN_RAM → WAR_ELEPHANT`, `NATARIAN_CATAPULT → BALLISTA`, `NATARIAN_CHIEF → NATARIAN_EMPEROR` in `NATAR_GARRISON_WEIGHTS`.

**No code change required unless the plan owner requests it.** Mark as a documented discrepancy.

---

### 1.13 MEDIUM — Natar village placement range doesn't match plan

**Bug:** The plan says "place them between 35%-50% of map radius". The implementation uses `≥30% of map size dimension` with no upper cap. Villages can spawn at the map edge.

**Root cause:** Placement math doesn't match the plan.

**Files to modify:**
- `packages/db/src/seeders/natar-villages-seeder.ts`

**Implementation:**

In the placement filter (around line 69-71), replace:

```ts
const outerRingThreshold = Math.max(4, server.configuration.mapSize * 0.3);
// ... filter: Math.hypot(x, y) >= outerRingThreshold
```

with:

```ts
const mapSize = server.configuration.mapSize;
const minRadius = mapSize * 0.35;
const maxRadius = mapSize * 0.5;
const distance = Math.hypot(x, y);
// ... filter: distance >= minRadius && distance <= maxRadius
```

Note: for `mapSize = 25`, `minRadius = 8.75`, `maxRadius = 12.5`. If no tiles satisfy this (small map), fall back to a wider range (e.g. `0.2` to `0.6`) — add a fallback with a comment.

**Test:** Update the existing Natar village count test to also assert all Natar villages fall within the 35%-50% radius band.

---

### 1.14 MEDIUM — Missing `consumable`/`stackable` fields on Construction Plan

**Bug:** The `HeroItem` type has no `consumable`/`stackable` fields. The plan's `consumable: true, stackable: false` is not representable. Non-stackability is enforced only procedurally in `grantConstructionPlan`.

**Root cause:** The type system doesn't have these fields.

**Decision:** Add the fields to the `HeroItem` type and set them on the Construction Plan item. This makes the non-stackable rule explicit and enforceable at the type level.

**Files to modify:**
- `packages/types/src/models/hero-item.ts` — add `consumable?: boolean` and `stackable?: boolean` to the `HeroItem` type.
- `packages/game-assets/src/items.ts` — set `consumable: true, stackable: false` on the `constructionPlan` item.

**Test:**
- Add test: assert `constructionPlan.consumable === true` and `constructionPlan.stackable === false`.

---

### 1.15 LOW — WW controllers use `as any` bypasses

**Bug:** All four WW routes use `as any` casts, bypassing OpenAPI type safety. The file's own header comment acknowledges this.

**Root cause:** The WW paths were not added to `open-api.ts`, so `createController` can't infer types.

**Decision:** This is a type-safety debt issue, not a functional bug. It doesn't break gameplay. **Defer to a separate cleanup pass** — fixing it requires adding all four WW paths to `open-api.ts` with full request/response schemas, which is a significant schema-design task. Mark as technical debt.

**No code change required now.**

---

### 1.16 Verification & Commit Strategy

After all fixes, run:

1. **Type-check:** `npm run type-check` in `packages/api` — must pass clean.
2. **Lint:** `npm run lint` in `packages/api` — 0 errors (warnings OK for intentional `any`).
3. **API tests:** `npx vitest run` in `packages/api` — all tests must pass.
4. **DB tests:** `npx vitest run` in `packages/db` — all 64 tests must pass.

**Commit sequence** (each fix is a separate commit for reviewability):

| Commit # | Content | Files |
|----------|---------|-------|
| 1 | Fix `garrison_power` seeding | `troop-seeder.ts`, `migrate.ts` |
| 2 | Fix `construction_plan_held` precondition | `world-wonder-controllers.ts` |
| 3 | Fix milestone report broadcast | `reports.ts` |
| 4 | Fix NPC WW L20 endgame trigger | `world-wonder-resolvers.ts` |
| 5 | Fix scheduler short-circuit on server end | `scheduler-data-source.ts` |
| 6 | Fix enemy aggression WW level ≥ 5 gate | `proactive-attack.ts` |
| 7 | Fix 2-level WW queue (creation-time bump) | `world-wonder-controllers.ts`, `world-wonder-resolvers.ts`, `events.ts` |
| 8 | Fix WW village unconquerable after L1 | `combat-resolver.ts` |
| 9 | Fix retaliation Natars skip | `retaliation-execution.ts` |
| 10 | Fix WW village building restrictions | `events.ts` |
| 11 | Fix `holds_plan` scoping | `npc-wonder-competition.ts` |
| 12 | Fix Natar village placement range | `natar-villages-seeder.ts` |
| 13 | Add `consumable`/`stackable` fields | `hero-item.ts`, `items.ts` |
| 14 | Add all new tests | test files |

After all 14 commits, run the full test suite and push.

---

## Part 2 — Full Admin Dashboard

The existing NPC dashboard (`/npc-dashboard`) is a read-only inspection tool. This plan replaces it with a full **Admin Dashboard** that gives control of the entire server: spawn troops, give resources, upgrade buildings, troubleshoot problems, test the World Wonder endgame, test retaliation, trigger NPC brain ticks, inspect events, and more — with a smart log panel that flags issues.

**Key principle:** The dashboard must be usable on **both desktop and mobile** (the app is a Capacitor PWA locked to portrait on mobile). Every data-heavy view uses the dual-render pattern from `village-table.tsx` (desktop `<table>` + mobile card list).

---

### 2.1 Architecture Overview

**Backend:**
- New file: `packages/api/src/controllers/admin-action-controllers.ts` — write-capable controllers (spawn, upgrade, edit, trigger, cancel).
- Existing file: `packages/api/src/controllers/admin-dashboard-controller.ts` — extend with new read endpoints for the dashboard tabs.
- All new endpoints follow the existing `createController` pattern and are registered in `open-api.ts` → `api-routes.ts`.
- Every write endpoint is wrapped in `database.transaction()` to guarantee atomicity.
- Every endpoint returns a `{ success: boolean, message?: string, data?: T }` shape for the frontend to display toast notifications.

**Frontend:**
- New route group: `apps/web/app/(game)/(village-slug)/(admin)/` — replaces the existing `(npc-dashboard)` group.
- The dashboard page uses a **tabbed layout** (shadcn `Tabs`) with 8 tabs.
- New hook: `apps/web/app/(game)/(village-slug)/hooks/use-admin-dashboard.ts` — React Query mutations for all write actions.
- The smart log panel is a shared component rendered in the dashboard header.

**Auth/gating:**
- All `/admin/*` and `/developer-settings/*` endpoints check a `developer_settings.is_admin_mode_enabled` flag (new column — add via migration). If not enabled, endpoints return `{ success: false, message: 'Admin mode is not enabled' }`. The frontend hides the dashboard link when the flag is off.

---

### 2.2 Backend: New Admin Action Controllers

**File:** `packages/api/src/controllers/admin-action-controllers.ts`

Each controller follows the existing `createController(path, method)` pattern. All write controllers use `method: 'post'` or `'patch'` and return `{ success: boolean, message: string, data?: any }`.

| Controller | Route | Method | Description |
|---|---|---|---|
| `adminSpawnTroops` | `/admin/spawn-troops` | POST | Add troops to any village. Body: `{ villageId, troops: [{ unitId, amount }] }`. Inserts into `troops` table with `source_tile_id = tile_id` (home troops). |
| `adminRemoveTroops` | `/admin/remove-troops` | POST | Remove troops from any village. Body: `{ villageId, troops: [{ unitId, amount }] }`. Decrements `troops.amount` (flooored at 0). |
| `adminSetResources` | `/admin/set-resources` | POST | Set exact resource amounts. Body: `{ villageId, lumber, clay, iron, crop }`. Updates `resource_fields` directly. |
| `adminAddResources` | `/admin/add-resources` | POST | Add to current resources. Body: `{ villageId, lumber, clay, iron, crop }`. Adds to `resource_fields.amount`. |
| `adminUpgradeBuilding` | `/admin/upgrade-building` | POST | Instantly upgrade a building to a target level. Body: `{ villageId, fieldId, targetLevel }`. Updates `building_fields.level` directly (no event). |
| `adminDowngradeBuilding` | `/admin/downgrade-building` | POST | Instantly downgrade. Body: `{ villageId, fieldId, targetLevel }`. |
| `adminSpawnHeroItem` | `/admin/spawn-hero-item` | POST | Give hero any item. Body: `{ heroId, itemId, amount }`. Reuses existing `spawnHeroItem` logic. |
| `adminSetHeroHealth` | `/admin/set-hero-health` | POST | Set hero HP. Body: `{ heroId, health }`. |
| `adminLevelUpHero` | `/admin/level-up-hero` | POST | Level up hero by N levels. Body: `{ heroId, levels }`. |
| `adminCreateNatarVillage` | `/admin/create-natar-village` | POST | Spawn a new Natar village at a given tile. Body: `{ x, y, garrisonStrength }`. Creates player + village + npc_village_state + natar_villages row + seeds garrison. |
| `adminGrantConstructionPlan` | `/admin/grant-construction-plan` | POST | Give the player a Construction Plan directly. Body: `{ heroId }`. Calls `grantConstructionPlan`. |
| `adminStartWorldWonder` | `/admin/start-world-wonder` | POST | Start a WW for the player in a given village (bypasses preconditions). Body: `{ villageId }`. |
| `adminSetWorldWonderLevel` | `/admin/set-world-wonder-level` | POST | Set a WW to a specific level instantly. Body: `{ villageId, level }`. Updates `world_wonders.current_level` and `villages.world_wonder_level`. |
| `adminEndServer` | `/admin/end-server` | POST | Force-end the server. Body: `{ winnerType: 'player' \| 'natars' }`. Calls `endServer`. |
| `adminResetServerEnd` | `/admin/reset-server-end` | POST | Un-end the server (clears `ended_at`, `winner_*`). For testing endgame repeatedly. |
| `adminTriggerNpcBrainTick` | `/admin/trigger-npc-brain-tick` | POST | Force-run a single NPC brain reconciliation. Calls `reconcileNpcBrain`. Returns the `ReconciliationResult`. |
| `adminSetGameSpeed` | `/admin/set-game-speed` | POST | Change server speed. Body: `{ speed }`. Updates `servers.speed`. |
| `adminSetNpcAggression` | `/admin/set-npc-aggression` | POST | Set aggression level for an NPC village. Body: `{ villageId, aggressionLevel }`. Updates `npc_village_state.aggression_level`. |
| `adminCancelRetaliation` | `/admin/cancel-retaliation` | POST | Clear a queued retaliation. Body: `{ retaliationId }`. Deletes from `npc_retaliation_queue`. |
| `adminCancelEvent` | `/admin/cancel-event` | POST | Cancel a pending event. Body: `{ eventId }`. Sets `resolved_at = now` (marks as resolved without running the resolver). |
| `adminTeleportVillage` | `/admin/teleport-village` | POST | Move a village to a new tile. Body: `{ villageId, x, y }`. Swaps `tile_id` to a new tile. |
| `adminRenameVillage` | `/admin/rename-village` | POST | Rename any village. Body: `{ villageId, name }`. |
| `adminDeleteVillage` | `/admin/delete-village` | POST | Delete a village (and its cascade). Body: `{ villageId }`. |
| `adminGetIntegrityReport` | `/admin/integrity-report` | GET | Runs integrity checks across all tables and returns a structured report (see §2.6). |

---

### 2.3 Backend: OpenAPI Registry Updates

**File:** `packages/api/src/open-api.ts`

Add every new path from §2.2 to the `paths` object. Each path needs:
- `requestBody` schema (for POST) with `content: { 'application/json': { schema: ... } }`
- `responses: { 200: { description, content: { 'application/json': { schema: ... } } } }`

Use inline `z.object` schemas or define them in a new `packages/api/src/controllers/schemas/admin-action-schemas.ts` file (preferred for consistency).

---

### 2.4 Backend: Route Registration

**File:** `packages/api/src/routes/api-routes.ts`

Add all new admin controllers to the `apiRoutes` array under a new `// Admin Actions` comment block. Follow the existing pattern:

```ts
// Admin Actions
createRoute(adminSpawnTroops),
createRoute(adminRemoveTroops),
// ... all 23+ controllers
```

---

### 2.5 Frontend: Admin Dashboard Layout & Routing

**Files:**
- `apps/web/app/routes.ts` — add the new route.
- `apps/web/app/(game)/(village-slug)/(admin)/page.tsx` — main dashboard page.
- `apps/web/app/(game)/(village-slug)/(admin)/layout.tsx` — tab navigation (replaces the old `(npc-dashboard)` route).

**Routing:**

Replace the existing `npc-dashboard` route with `admin`:

```ts
// In routes.ts:
route('admin', '(game)/(village-slug)/(admin)/page.tsx'),
```

Update the preferences link from `../npc-dashboard` to `../admin`.

**Page structure:**

```tsx
// page.tsx
export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-[1600px] p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <DashboardHeader />         {/* Server status + smart log toggle */}
      <Tabs defaultValue="server">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="server">Server</TabsTrigger>
          <TabsTrigger value="player">Player & Villages</TabsTrigger>
          <TabsTrigger value="troops">Troops</TabsTrigger>
          <TabsTrigger value="wonder">World Wonder</TabsTrigger>
          <TabsTrigger value="npc">NPC Brain</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="economy">Economy</TabsTrigger>
          <TabsTrigger value="logs">Logs & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="server"><ServerControlTab /></TabsContent>
        <TabsContent value="player"><PlayerVillageTab /></TabsContent>
        <TabsContent value="troops"><TroopManagementTab /></TabsContent>
        <TabsContent value="wonder"><WorldWonderTab /></TabsContent>
        <TabsContent value="npc"><NpcBrainTab /></TabsContent>
        <TabsContent value="events"><EventInspectorTab /></TabsContent>
        <TabsContent value="economy"><EconomyTab /></TabsContent>
        <TabsContent value="logs"><LogsReportsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
```

**Mobile adaptation:** `TabsList` uses `flex-wrap h-auto` so tabs wrap on narrow screens. Each tab content uses responsive grids (see §2.15).

---

### 2.6 Frontend: Smart Log Panel

**File:** `apps/web/app/(game)/(village-slug)/(admin)/components/smart-log-panel.tsx`

A collapsible panel rendered in the dashboard header that runs integrity checks and displays issues in real-time. It fetches `/admin/integrity-report` on mount and on a 10s interval.

**Integrity checks (backend `adminGetIntegrityReport`):**

| Check | Query | Severity |
|---|---|---|
| Orphaned npc_village_state | `SELECT COUNT(*) FROM npc_village_state WHERE village_id NOT IN (SELECT id FROM villages)` | ERROR |
| Natar villages with `garrison_power = 0` | `SELECT COUNT(*) FROM npc_village_state WHERE faction_key = 'natars' AND garrison_power = 0` | ERROR |
| World wonders with `current_level > 20` | `SELECT COUNT(*) FROM world_wonders WHERE current_level > 20` | ERROR |
| Events resolving after server end | `SELECT COUNT(*) FROM events WHERE resolved_at IS NULL AND (SELECT ended_at FROM servers LIMIT 1) IS NOT NULL` | WARNING |
| Natar villages with `has_plan = 1` but `construction_plan_available = 0` | `SELECT COUNT(*) FROM npc_village_state nvs JOIN natar_villages nv ON nv.village_id = nvs.village_id WHERE nvs.has_plan = 1 AND nv.construction_plan_available = 0` | WARNING |
| NPC factions with `holds_plan = 1` but no WW | `SELECT COUNT(DISTINCT nvs.faction_key) FROM npc_village_state nvs WHERE nvs.holds_plan = 1 AND nvs.faction_key NOT IN (SELECT owner_faction_id FROM world_wonders)` | INFO |
| Player with `construction_plan_held = 1` but no plan in inventory | `SELECT COUNT(*) FROM villages v WHERE v.construction_plan_held = 1 AND v.player_id = 1 AND NOT EXISTS (SELECT 1 FROM hero_inventory hi JOIN heroes h ON h.id = hi.hero_id WHERE h.player_id = 1 AND hi.item_id = 200 AND hi.amount > 0)` | WARNING |
| Retaliation queue entries for Natars | `SELECT COUNT(*) FROM npc_retaliation_queue WHERE faction_key = 'natars'` | ERROR |
| Duplicate WW per player | `SELECT player_id, COUNT(*) FROM world_wonders WHERE owner_player_id IS NOT NULL GROUP BY owner_player_id HAVING COUNT(*) > 1` | ERROR |
| Villages with negative resource amounts | `SELECT COUNT(*) FROM resource_fields WHERE amount < 0` | ERROR |
| Troops with negative amounts | `SELECT COUNT(*) FROM troops WHERE amount < 0` | ERROR |

**UI:** Each issue shows a colored badge (ERROR=red, WARNING=yellow, INFO=blue), the check name, the count, and a "Fix" button (if a fix action exists, e.g. "Recompute garrison_power"). The panel auto-collapses when no issues are found, showing "✅ All checks passed".

**Mobile:** The panel is a collapsible `Card` with `overflow-x-auto` for the issue list. Issues are shown as a vertical list of cards (not a table) on mobile.

---

### 2.7 Frontend: Server Control Tab

**File:** `apps/web/app/(game)/(village-slug)/(admin)/components/server-control-tab.tsx`

Provides high-level server management:

- **Server status card:** speed, map size, created_at, ended_at, winner_type, winner_player_id. Read existing `getServer`.
- **Game speed control:** Input + "Set" button. Calls `adminSetGameSpeed`.
- **Force-end server:** Dropdown to select winner (`player` / `natars`) + "End Server" button. Calls `adminEndServer`.
- **Reset server end:** "Reset End" button. Calls `adminResetServerEnd`. (For testing endgame repeatedly.)
- **Developer settings:** All 12 existing toggles (instant building, free training, etc.). Reuses existing `useDeveloperSettings` hook.
- **Trigger NPC Brain Tick:** "Run Tick" button. Calls `adminTriggerNpcBrainTick`. Shows the result inline (villagesGrown, troopsRegenerated, retaliationsResolved, aggressionChanges).
- **Live simulation status:** Shows `isSimulating`, `lastLiveTickTimestamp` from `use-npc-brain.ts` hook.

**Mobile:** Cards stack vertically (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).

---

### 2.8 Frontend: Player & Village Management Tab

**File:** `apps/web/app/(game)/(village-slug)/(admin)/components/player-village-tab.tsx`

Provides full player and village management:

- **Player overview:** Hero health, level, adventure points, items, faction. Buttons: "Level Up +1", "Full Health", "Kill Hero", "Grant Adventure Point".
- **Village list:** Table (desktop) / cards (mobile) of all player villages. Columns: name, coords, population, loyalty, is_world_wonder_village, world_wonder_level, construction_plan_held. Actions per village: "Teleport", "Rename", "Delete", "View Details".
- **Village detail modal:** Shows all buildings + levels, all resources, all troops. Inline-editable: click a building level to set it, click a resource to set it. Calls `adminUpgradeBuilding` / `adminSetResources`.
- **Create Natar Village:** Form with x, y, garrisonStrength. Calls `adminCreateNatarVillage`.

**Mobile:** Village list uses the dual-render pattern (desktop table `hidden md:block`, mobile card list `md:hidden`). The detail modal is full-screen on mobile.

---

### 2.9 Frontend: Troop Management Tab

**File:** `apps/web/app/(game)/(village-slug)/(admin)/components/troop-management-tab.tsx`

Provides full troop control for any village:

- **Village selector:** Dropdown of all villages.
- **Troop table:** Shows all unit types and amounts for the selected village.
- **Spawn form:** `unitId` dropdown (all units), `amount` input, "Add Troops" button. Calls `adminSpawnTroops`.
- **Remove form:** Same dropdown + input, "Remove Troops" button. Calls `adminRemoveTroops`.
- **Bulk spawn:** "Spawn 1000 of all infantry units" preset buttons.

**Mobile:** The troop table is a card list. The spawn form uses a `Select` + `Input` + `Button` stacked vertically.

---

### 2.10 Frontend: World Wonder Endgame Tab

**File:** `apps/web/app/(game)/(village-slug)/(admin)/components/world-wonder-tab.tsx`

Provides full WW endgame testing:

- **WW overview:** List of all World Wonders on the server (player + NPC). Shows village, owner faction, current level, started_at, name. Read from `world_wonders` table.
- **Start WW:** Form with villageId selector. Calls `adminStartWorldWonder` (bypasses preconditions).
- **Grant Construction Plan:** "Give Plan" button. Calls `adminGrantConstructionPlan`.
- **Set WW Level:** Input level (1-20) + "Set Level" button. Calls `adminSetWorldWonderLevel`. For testing the endgame at any point.
- **End server controls:** Same as Server Control tab (duplicated for convenience).
- **NPC wonder competition status:** Shows which NPC factions hold plans (`holds_plan`), which have WWs (`world_wonders`), and the current garrison_power of each Natar village. Read from `npc_village_state`.

**Mobile:** WW list is a card list. Forms stack vertically.

---

### 2.11 Frontend: NPC Brain Inspector Tab

**File:** `apps/web/app/(game)/(village-slug)/(admin)/components/npc-brain-tab.tsx`

Extends the existing NPC dashboard with write controls:

- **Overview cards:** Reuses existing `OverviewCards` component (7 KPIs).
- **Faction breakdown:** Reuses existing `FactionBreakdown` component.
- **Village table:** Reuses existing `VillageTable` with added action buttons: "Set Aggression", "Force Tick", "View Debug".
- **Village debug modal:** Shows `getNpcVillageDebugInfo` output — faction profile, coordinates, village size, troop count, defence floor, storage levels, revenge intent, last build decisions, raw state.
- **Aggression control:** Input (0-5) + "Set" button per village. Calls `adminSetNpcAggression`.
- **Cancel retaliation:** Shows queued retaliations with "Cancel" buttons. Calls `adminCancelRetaliation`.
- **Force NPC tick:** "Run NPC Brain Tick" button (also in Server tab). Shows last tick result.
- **Growth chart:** Reuses existing `GrowthChart` component.

**Mobile:** Overview cards use responsive grid. Village table uses dual-render. Debug modal is full-screen.

---

### 2.12 Frontend: Event Inspector Tab

**File:** `apps/web/app/(game)/(village-slug)/(admin)/components/event-inspector-tab.tsx`

Provides full event visibility and control:

- **Event list:** Table (desktop) / cards (mobile) of all events. Columns: id, type, village_id, starts_at, resolves_at, resolved_at, duration. Filters: by type (dropdown), by resolved/unresolved (toggle), by village (search). Pagination (50 per page).
- **Event detail:** Click a row to show the full event args (JSON pretty-printed).
- **Cancel event:** "Cancel" button per pending event. Calls `adminCancelEvent`.
- **Create event:** Form with type (dropdown of all event types), villageId, and a JSON args textarea. Calls the appropriate `createEvents` via a generic `adminCreateEvent` endpoint (new — add to §2.2 if needed).
- **Force-resolve event:** "Resolve Now" button per pending event. Sets `resolves_at = now` and triggers the scheduler.

**Mobile:** Event list is a card list with collapsible details. Filters are in a collapsible panel.

---

### 2.13 Frontend: Economy & Resources Tab

**File:** `apps/web/app/(game)/(village-slug)/(admin)/components/economy-tab.tsx`

Provides full resource and economy control:

- **Resource overview:** Player's current resources across all villages. Bar chart (recharts) per resource type.
- **Set resources:** Per village, set exact amounts for lumber/clay/iron/crop. Calls `adminSetResources`.
- **Add resources:** Per village, add amounts. Calls `adminAddResources`.
- **World threat level:** Shows current world threat level + multiplier. (Read from `calculateWorldThreatLevel`.)
- **NPC loot recovery:** Shows loot recovery status per NPC village. (Read from `npc_village_state.loot_at_last_raid`, `max_loot_capacity`, `loot_recovery_rate`.)
- **Bulk operations:** "Give 100k of all resources to all villages" preset button.

**Mobile:** Bar chart uses `ResponsiveContainer`. Resource forms stack vertically.

---

### 2.14 Frontend: Reports & Logs Tab

**File:** `apps/web/app/(game)/(village-slug)/(admin)/components/logs-reports-tab.tsx`

Provides report visibility:

- **Report list:** Table (desktop) / cards (mobile) of recent reports. Columns: id, type, village_id, timestamp, is_read. Filters: by type (including `npc_wonder_milestone`, `server_end`, `construction_plan_obtained`), by read/unread.
- **Report detail:** Click a row to show the full report JSON data.
- **Smart log panel:** Reuses the `SmartLogPanel` component (§2.6) inline.

**Mobile:** Report list is a card list with collapsible details.

---

### 2.15 Mobile Responsiveness Requirements

Every component in the admin dashboard must follow these rules:

1. **Dual-render for tables:** Any data table must have a desktop variant (`hidden md:block`) using `<table>` and a mobile variant (`md:hidden`) using card list. Pattern from `village-table.tsx`.
2. **Responsive grids:** Use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` for card grids. Overview KPIs: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7`.
3. **Form inputs:** Stack vertically on mobile (`flex-col`), inline on desktop (`sm:flex-row sm:items-end`). Labels above inputs on mobile.
4. **Buttons:** Full-width on mobile (`w-full sm:w-auto`), auto-width on desktop.
5. **Tabs:** `TabsList` uses `flex-wrap h-auto` to wrap on narrow screens. On very small screens (`<640px`), consider a dropdown selector instead of tabs.
6. **Modals:** Full-screen on mobile (`sm:max-w-lg sm:rounded-lg`), dialog on desktop.
7. **Padding:** `p-3 sm:p-4 md:p-6` — tighter on mobile, roomier on desktop.
8. **Text size:** `text-xs sm:text-sm` for table cells. `text-sm sm:text-base` for headers.
9. **Safe area:** Use `pb-safe-or-8` (from `tailwindcss-safe-area`) for bottom padding to avoid notches.
10. **Touch targets:** Minimum 44px height for all buttons and tappable rows.

---

### 2.16 Tests

**Backend tests** (`packages/api/src/controllers/__tests__/`):

- `admin-action-controllers.test.ts` — test every write controller:
  - `adminSpawnTroops` — assert troops appear in DB.
  - `adminRemoveTroops` — assert troops decremented, floored at 0.
  - `adminSetResources` / `adminAddResources` — assert resource amounts.
  - `adminUpgradeBuilding` — assert `building_fields.level` updated.
  - `adminStartWorldWonder` — assert `world_wonders` row created.
  - `adminSetWorldWonderLevel` — assert level updated.
  - `adminEndServer` — assert `servers.ended_at` set.
  - `adminResetServerEnd` — assert `ended_at` cleared.
  - `adminTriggerNpcBrainTick` — assert returns a `ReconciliationResult`.
  - `adminCancelEvent` — assert event marked as resolved.
  - `adminGetIntegrityReport` — assert it returns the check results.
  - Every test must verify the `{ success: true }` response shape.

**Frontend tests:**
- Component tests for each tab (using `@testing-library/react` if configured — check existing test setup).
- Smart log panel test: mock the `/admin/integrity-report` response and assert issues render with correct severity.

---

### 2.17 Verification & Commit Strategy

After all dashboard work, run:

1. **Type-check:** `npm run type-check` in `packages/api` and `packages/web` — must pass.
2. **Lint:** `npm run lint` in `packages/api` and `packages/web` — 0 errors.
3. **API tests:** `npx vitest run` in `packages/api` — all tests pass.
4. **DB tests:** `npx vitest run` in `packages/db` — all tests pass.
5. **Manual mobile test:** Open the dashboard on a 375px-wide viewport (iPhone SE) and verify all tabs are usable without horizontal scroll.

**Commit sequence:**

| Commit # | Content |
|----------|---------|
| 1 | Add `is_admin_mode_enabled` developer setting column + migration |
| 2 | Create `admin-action-controllers.ts` with all write endpoints (no OpenAPI yet) |
| 3 | Add all admin action paths to `open-api.ts` + `api-routes.ts` |
| 4 | Create `admin-action-schemas.ts` with all request/response schemas |
| 5 | Create `use-admin-dashboard.ts` hook with all mutations |
| 6 | Create admin dashboard page + layout + tab structure |
| 7 | Create `SmartLogPanel` component + `adminGetIntegrityReport` endpoint |
| 8 | Create `ServerControlTab` component |
| 9 | Create `PlayerVillageTab` component |
| 10 | Create `TroopManagementTab` component |
| 11 | Create `WorldWonderTab` component |
| 12 | Create `NpcBrainTab` component (migrating existing NPC dashboard) |
| 13 | Create `EventInspectorTab` component |
| 14 | Create `EconomyTab` component |
| 15 | Create `LogsReportsTab` component |
| 16 | Update `routes.ts` + preferences link + remove old `npc-dashboard` route |
| 17 | Add all backend tests |
| 18 | Add all frontend tests |
| 19 | Manual mobile responsiveness pass (fix any overflow/touch issues) |

After all 19 commits, run the full test suite and push.

---

## Appendix: Full File-Change Checklist

### Part 1 (Bug Fixes)

| File | Changes |
|---|---|
| `packages/db/src/seeders/troop-seeder.ts` | Add `garrison_power` recompute UPDATE at end |
| `packages/db/src/migrations/migrate.ts` | Add `garrison_power` recompute after troop seeder call |
| `packages/api/src/controllers/world-wonder-controllers.ts` | Remove `construction_plan_held` precondition; add creation-time level bump |
| `packages/api/src/controllers/resolvers/utils/reports.ts` | Rewrite `saveNpcWonderMilestoneReport` to broadcast to all player villages |
| `packages/api/src/controllers/resolvers/world-wonder-resolvers.ts` | Add NPC L20 endgame trigger; remove level bump from resolver; fix docstring |
| `packages/api/src/scheduler/scheduler-data-source.ts` | Add `ended_at IS NULL` guard to queries |
| `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/proactive-attack.ts` | Add `wwLevel >= 5` gate to aggression boost |
| `packages/api/src/controllers/utils/events.ts` | Add WW village building restriction check; add creation-time WW level bump in `createEvents` |
| `packages/api/src/controllers/resolvers/utils/combat-resolver.ts` | Add WW village unconquerable check |
| `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/retaliation-execution.ts` | Add `isPassiveFaction` skip |
| `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/npc-wonder-competition.ts` | Fix `holds_plan` scoping to single village |
| `packages/db/src/seeders/natar-villages-seeder.ts` | Fix placement range to 35%-50% of map radius |
| `packages/types/src/models/hero-item.ts` | Add `consumable?` and `stackable?` fields |
| `packages/game-assets/src/items.ts` | Set `consumable: true, stackable: false` on constructionPlan |
| `packages/db/src/migrations/upgrade-db.ts` | Add `is_admin_mode_enabled` column to developer_settings |
| Test files | Add tests for each fix |

### Part 2 (Admin Dashboard)

| File | Changes |
|---|---|
| `packages/api/src/controllers/admin-action-controllers.ts` | NEW — all 23+ write controllers |
| `packages/api/src/controllers/admin-dashboard-controller.ts` | Extend with any new read endpoints needed |
| `packages/api/src/controllers/schemas/admin-action-schemas.ts` | NEW — all request/response schemas |
| `packages/api/src/open-api.ts` | Add all admin action paths |
| `packages/api/src/routes/api-routes.ts` | Register all admin action routes |
| `apps/web/app/routes.ts` | Replace `npc-dashboard` route with `admin` |
| `apps/web/app/(game)/(village-slug)/(admin)/page.tsx` | NEW — main dashboard page |
| `apps/web/app/(game)/(village-slug)/(admin)/layout.tsx` | NEW — tab navigation |
| `apps/web/app/(game)/(village-slug)/(admin)/components/smart-log-panel.tsx` | NEW — integrity check panel |
| `apps/web/app/(game)/(village-slug)/(admin)/components/server-control-tab.tsx` | NEW |
| `apps/web/app/(game)/(village-slug)/(admin)/components/player-village-tab.tsx` | NEW |
| `apps/web/app/(game)/(village-slug)/(admin)/components/troop-management-tab.tsx` | NEW |
| `apps/web/app/(game)/(village-slug)/(admin)/components/world-wonder-tab.tsx` | NEW |
| `apps/web/app/(game)/(village-slug)/(admin)/components/npc-brain-tab.tsx` | NEW (migrates existing NPC dashboard components) |
| `apps/web/app/(game)/(village-slug)/(admin)/components/event-inspector-tab.tsx` | NEW |
| `apps/web/app/(game)/(village-slug)/(admin)/components/economy-tab.tsx` | NEW |
| `apps/web/app/(game)/(village-slug)/(admin)/components/logs-reports-tab.tsx` | NEW |
| `apps/web/app/(game)/(village-slug)/hooks/use-admin-dashboard.ts` | NEW — React Query mutations |
| `apps/web/app/(game)/(village-slug)/(preferences)/components/general-preferences.tsx` | Update link from `npc-dashboard` to `admin` |
| Test files | NEW — `admin-action-controllers.test.ts`, frontend component tests |