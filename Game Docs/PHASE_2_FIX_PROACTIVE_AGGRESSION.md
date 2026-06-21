# Phase 2 Fix — Proactive NPC Aggression (Reputation-Gated Escalating Wave System)

> **This document fully replaces the Phase 2 section in `AGENT_IMPLEMENTATION_ROADMAP.md`.**
> The original Phase 2 implementation (`proactive-attack.ts`) has a critical design flaw: all NPC villages attack simultaneously on the first tick after the grace period ends, because every village starts with `last_proactive_attack_ms = 0`. Additionally, factions that are allies of the player still attack — making the reputation system meaningless. This document describes the complete replacement.

---

## Pre-Implementation Reading (Mandatory — Do Not Skip)

Before writing a single line of code, read every one of these files in full:

1. `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/proactive-attack.ts` — the current broken implementation you are replacing
2. `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/reputation-impact.ts` — understand how `faction_reputation` is structured and how `applyRaidReputationConsequences` writes to it
3. `packages/api/src/controllers/resolvers/utils/npc-brain/faction-profiles.ts` — every faction's `retaliationThreshold`, `repLossPerRaid`, and `aggressionDecayDays` values drive this system
4. `packages/api/src/controllers/resolvers/utils/npc-brain/npc-brain-types.ts` — the `FactionProfile` interface you will extend, and `NPC_BRAIN_CONSTANTS`
5. `packages/api/src/controllers/resolvers/utils/npc-brain/simulate-elapsed-time.ts` — where `processProactiveAttacks` is called; you will keep this call but replace what it does
6. `packages/api/src/controllers/resolvers/utils/npc-brain/helpers.ts` — `adjustForSpeed`, `getMapSize`, `getPlayerVillageCoords`, `mapDistance`, `scaleTroops` — use all of these, do not re-implement them
7. `packages/db/src/migrations/upgrade-db.ts` — the migration pattern you must follow for every new column
8. `packages/db/src/seeders/world-items-seeder.ts` — understand where NPC villages are created; you will add staggered offset seeding here
9. `packages/db/src/schemas/servers-schema.sql` — understand the `servers` table structure already in place

After reading, write a short internal summary (in a comment at the top of your working notes, not in the source) of:
- What `last_proactive_attack_ms` currently does and why it causes the thundering herd
- How the `faction_reputation` table is keyed (source_faction_id → target_faction_id)
- Which factions exist on a 3-faction map vs a 9-faction map and what their starting reputations are

---

## Root Cause of the Bug (Understand This First)

The current `processProactiveAttacks` in `proactive-attack.ts` loops over **every NPC village** and checks:

```ts
if (currentTimeMs - lastAttack < intervalMs) continue;
```

Because every village is seeded with `last_proactive_attack_ms = 0`, on the very first tick after the grace period ends, `currentTimeMs - 0` is always greater than `intervalMs` for every single village. Every village passes the check. Every village fires. This is the thundering herd.

There are two additional problems the replacement must also solve:
1. **No reputation gate** — ally factions (those with high reputation) attack just as aggressively as enemies, making the reputation system pointless.
2. **No per-faction coordination** — each village acts independently; there is no concept of a faction deciding to attack as a unit.

---

## What You Are Building

A **Reputation-Gated, Faction-Turn, Escalating Wave** system. The logic has four layers, applied in order on each tick:

```
Layer 1 — Reputation Gate:   Is this faction an ally? If yes → skip entirely.
Layer 2 — Faction Cooldown:  Has enough time passed since this faction last sent a wave? If no → skip.
Layer 3 — Wave Stage:        How many villages from this faction attack this wave? Starts at 1, grows over time.
Layer 4 — Global Budget:     Is there room in the server-wide attack budget? If no → defer.
```

---

## Step 1 — Extend `FactionProfile` Type

**File:** `packages/api/src/controllers/resolvers/utils/npc-brain/npc-brain-types.ts`

Add one field to the `FactionProfile` interface:

```ts
/**
 * Multiplier applied to the base difficulty cooldown for this faction's proactive attacks.
 * < 1.0 = more aggressive (attacks more often)
 * > 1.0 = more passive (attacks less often)
 */
readonly proactiveCooldownMultiplier: number;
```

---

## Step 2 — Add `proactiveCooldownMultiplier` to All Faction Profiles

**File:** `packages/api/src/controllers/resolvers/utils/npc-brain/faction-profiles.ts`

Add the new field to every faction in `FACTION_PROFILES`. Use the following values, derived from each faction's existing `retaliationThreshold` personality:

| Faction key | Name | Existing personality | `proactiveCooldownMultiplier` |
|---|---|---|---|
| `npc1` | Iron Brotherhood | Aggressive raiders (`retaliationThreshold: 1`) | `0.6` |
| `npc2` | Merchant Guilds | Peaceful traders (`retaliationThreshold: 5`) | `2.5` |
| `npc3` | Shadow Nomads | Mysterious scouts (`retaliationThreshold: 3`) | `1.0` |
| `npc4` | Stone Wardens | Defensive fortress (`retaliationThreshold: 2`) | `0.8` |
| `npc5` | River Clans | Fast cavalry nomads (`retaliationThreshold: 2`) | `0.9` |
| `npc6` | Ember Cult | Fanatical siege (`retaliationThreshold: 1`) | `0.65` |
| `npc7` | Verdant Order | Nature pacifists (`retaliationThreshold: 7`) | `3.0` |
| `npc8` | Iron Scholars | Tech researchers (`retaliationThreshold: 4`) | `1.8` |
| `npc9` | Bone Reavers | Death cult (`retaliationThreshold: 1`) | `0.55` |

---

## Step 3 — Add `npc_faction_state` Table via Migration

**File:** `packages/db/src/migrations/upgrade-db.ts`

Add the following migration block at the end of `upgradeDb`, following the exact same try/catch pattern already used in the file:

```ts
// ─── Phase 2 Fix: npc_faction_state table ───
try {
  database.exec({
    sql: `
      CREATE TABLE IF NOT EXISTS npc_faction_state (
        faction_key TEXT PRIMARY KEY NOT NULL,
        last_faction_attack_ms INTEGER NOT NULL DEFAULT 0,
        current_wave_stage INTEGER NOT NULL DEFAULT 0,
        wave_locked_until_ms INTEGER NOT NULL DEFAULT 0
      ) STRICT;
    `,
  });
} catch (_e) {}
```

**Important:** This table has one row per faction key (e.g. `'npc1'`, `'npc2'`, etc.). It is NOT per-village. It tracks the faction as a whole.

Also add the following column to `npc_village_state` for the staggered cold-start offset:

```ts
// ─── Phase 2 Fix: staggered cold-start offset on npc_village_state ───
try {
  database.exec({
    sql: 'ALTER TABLE npc_village_state ADD COLUMN proactive_attack_offset_ms INTEGER NOT NULL DEFAULT 0;',
  });
} catch (_e) {}
```

---

## Step 4 — Seed Staggered Offsets and Faction State at World Creation

**File:** `packages/db/src/seeders/world-items-seeder.ts` (or wherever NPC villages are inserted — read the file to confirm)

**After** all NPC villages have been inserted, seed two things:

### 4a. Staggered `proactive_attack_offset_ms` per village

The goal is that no two villages ever fire at the same time. Use the base Siege interval (20 in-game minutes) as the spread window, even on easier difficulties, so the staggering is always meaningful.

The formula for village `i` out of `totalVillages` across `totalFactions` factions:

```
factionSlot   = factionIndex / totalFactions
villageSlot   = villageIndexWithinFaction / totalVillagesInFaction
spreadWindowMs = 20 * 60 * 1000  (20 minutes in real ms — do NOT divide by speed here; speed is applied at runtime)

offset = (factionSlot + villageSlot / totalFactions) * spreadWindowMs
```

Store this as `proactive_attack_offset_ms` on `npc_village_state`. When checking if a village is ready to attack (see Step 5), the effective `last_proactive_attack_ms` for a cold village is `serverCreatedAt + offset`, not `0`.

### 4b. Insert one row per faction into `npc_faction_state`

After seeding village offsets, for every distinct `faction_key` that exists in `npc_village_state`, insert a row into `npc_faction_state` with all defaults (`last_faction_attack_ms = 0`, `current_wave_stage = 0`, `wave_locked_until_ms = 0`).

Use `INSERT OR IGNORE` to be safe against re-runs.

---

## Step 5 — Rewrite `processProactiveAttacks`

**File:** `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/proactive-attack.ts`

Replace the entire contents of this file. The function signature stays the same — `processProactiveAttacks(db, currentTimeMs, speed, worldThreatLevel): number` — so `simulate-elapsed-time.ts` does not need to change.

Below is the complete logic the new implementation must follow. Write clean TypeScript that matches the existing code style in the subsystems folder. Use `z.any()` with type assertion only where absolutely necessary, following the pattern already used in `reputation-impact.ts`.

### 5.1 — Layer 0: Grace Period Check (unchanged)

Keep the existing `isInGracePeriod` and `isBlitzProtectionActive` helpers. Check them first. If still in grace period, return `0` immediately.

### 5.2 — Layer 1: Reputation Gate

Fetch the reputation of every NPC faction against the player in a **single batch query**:

```sql
SELECT
  fi.faction AS factionKey,
  fr.reputation AS reputationScore
FROM faction_ids fi
JOIN faction_reputation fr ON fr.target_faction_id = fi.id
JOIN players p ON p.faction_id = fr.source_faction_id
WHERE p.id = 1
  AND fi.faction != 'player';
```

Build a `Map<factionKey, reputationScore>` from this result.

**Reputation thresholds** — a faction is an ally (skip entirely) if its reputation score is at or above the threshold for `'friendly'`. You must look up what numeric value the existing `reputationLevels` map uses for `'friendly'` in `packages/game-assets/src/reputation.ts` (read that file). Do NOT hardcode a magic number. Call `reputationLevels.get('friendly')` and store it as `const ALLY_THRESHOLD`.

When iterating over factions in Step 5.4, skip any faction whose reputation score ≥ `ALLY_THRESHOLD`.

### 5.3 — Load Faction State

Fetch all rows from `npc_faction_state` in one query. Store as `Map<factionKey, { lastFactionAttackMs, currentWaveStage, waveLocketUntilMs }>`.

### 5.4 — Load All NPC Villages Grouped by Faction

One batch query (extend the existing query in the old `processProactiveAttacks`):

```sql
SELECT
  nvs.village_id AS villageId,
  nvs.faction_key AS factionKey,
  nvs.last_proactive_attack_ms AS lastProactiveAttackMs,
  nvs.proactive_attack_offset_ms AS offsetMs,
  v.tile_id AS tileId,
  t.x,
  t.y,
  COALESCE(vt.tribe, pt.tribe) AS tribe
FROM npc_village_state nvs
JOIN villages v ON v.id = nvs.village_id
JOIN tiles t ON t.id = v.tile_id
LEFT JOIN tribe_ids vt ON vt.id = v.tribe_id
LEFT JOIN players p ON p.id = v.player_id
LEFT JOIN tribe_ids pt ON pt.id = p.tribe_id;
```

Group the results into `Map<factionKey, village[]>` in TypeScript (not in SQL).

### 5.5 — Layer 2: Faction Cooldown Check

Get the server's difficulty and map size:

```ts
const difficulty = getDifficulty(db);           // existing helper
const mapSize = getMapSize(db);                  // existing helper
const serverCreatedAt = getServerCreatedAt(db);  // add this small helper: SELECT created_at FROM servers LIMIT 1
```

Base interval from difficulty (in real ms, **not** divided by speed yet):

```ts
const BASE_INTERVAL_MS = {
  skirmish: 60 * 60 * 1000,   // 60 in-game minutes
  assault:  45 * 60 * 1000,   // 45 in-game minutes
  siege:    20 * 60 * 1000,   // 20 in-game minutes
};
```

For each faction (after the reputation gate in 5.2):

1. Get the faction's `proactiveCooldownMultiplier` from `FACTION_PROFILES`
2. Compute: `factionIntervalMs = adjustForSpeed(BASE_INTERVAL_MS[difficulty] * profile.proactiveCooldownMultiplier, speed)`
3. The faction's **effective last attack time** for the cold-start case is: `Math.max(factionState.lastFactionAttackMs, serverCreatedAt)` — this prevents the thundering herd even if `npc_faction_state` was not seeded (defensive fallback)
4. If `currentTimeMs - effectiveLastAttackMs < factionIntervalMs` → **skip this faction entirely** (continue to next faction)

### 5.6 — Layer 3: Wave Stage — How Many Villages Attack

The wave stage determines how many villages from this faction participate in this attack wave. Use the faction's `currentWaveStage` from `npc_faction_state`.

**Max wave stage cap by map size:**

| Map size | Max wave cap (max villages per wave) |
|---|---|
| 25 | 2 |
| 50 | 3 |
| 75 | 4 |
| 100 | 5 |

```ts
const MAX_WAVE_CAP: Record<number, number> = { 25: 2, 50: 3, 75: 4, 100: 5 };
const waveCap = MAX_WAVE_CAP[mapSize] ?? 5;
const villagesThisWave = Math.min(factionState.currentWaveStage + 1, waveCap);
```

From the faction's village list, select the **closest `villagesThisWave` villages to the player** (sort by `mapDistance` ascending, take first `villagesThisWave`).

**Wave stage advancement:**

- Wave stage advances by 1 after each wave **only if** the `wave_locked_until_ms` has passed.
- Set `wave_locked_until_ms` to `currentTimeMs + factionIntervalMs * 2` after each wave. This means the faction must complete two full cooldown cycles before the next wave stage unlocks. The player's skill (defeating the wave quickly) does not accelerate this — the timer is fixed. This makes escalation predictable.
- Never advance beyond `waveCap - 1` (so wave stage 0 = 1 village, wave stage `waveCap - 1` = `waveCap` villages).

**Blitz mode exception:** On Blitz, wave stage advances every `3 real-time minutes` regardless of cooldown. Use `adjustForSpeed(3 * 60 * 1000, speed)` — wait, on Blitz speed is 200x, so `3 * 60 * 1000 / 200 = 900ms` real time. Use wall-clock time for this check, not game time: store `wave_locked_until_ms` as `currentTimeMs + 3 * 60 * 1000` (3 real minutes, not divided by speed) for Blitz only.

### 5.7 — Layer 4: Global Attack Budget Check

Before creating any attack event, check how many NPC attacks are currently in-flight:

```sql
SELECT COUNT(*) AS inFlight
FROM troop_movements tm
JOIN npc_village_state nvs ON nvs.village_id = tm.source_village_id
WHERE tm.movement_type = 'attack'
  AND tm.status = 'in_transit';
```

> **Important:** Read `troop_movements` table schema first to confirm the exact column names (`movement_type`, `status`, `source_village_id`). Adjust the query to match what actually exists.

**Budget limits by difficulty, scaled by map size:**

```ts
const BASE_BUDGET: Record<Difficulty, number> = {
  skirmish: 3,
  assault:  6,
  siege:    12,
};

// Scale down for small maps
const mapScaleFactor = mapSize <= 50 ? 0.5 : 1.0;
const budget = Math.max(1, Math.floor(BASE_BUDGET[difficulty] * mapScaleFactor));
```

If `inFlight >= budget` → **do not launch any attack this tick**. Return `0` immediately (skip all factions). The faction cooldown timers are NOT updated in this case — they will retry next tick.

### 5.8 — Build and Send the Attack

For each village selected in Step 5.6:

1. Call `materializeNpcTroops(...)` — existing helper, keep as-is
2. Fetch home troops for that village's `tileId` (same query as current implementation)
3. Check `totalUnits >= NPC_BRAIN_CONSTANTS.MIN_TROOPS_FOR_RETALIATION` — if not, skip this specific village (do not skip the whole faction)
4. Cap at **70% of available troops**: `scaleTroops(troopMap, 0.7)`
5. Apply `npcTroopMultiplier` from `worldThreatLevel` — keep existing logic
6. Get player village ID and coords — use existing helpers. **Important:** the player may have multiple villages by mid-game. Select the **nearest** player village to the attacking NPC village, not just the first by `ORDER BY id`. Sort all player villages by `mapDistance` and pick the closest one.
7. Calculate `travelTimeMs` using the **slowest unit's actual speed** from the troop composition, not a hardcoded `3`. Look up unit speeds from `TRIBE_TROOP_TIERS` and the unit definitions. If you cannot determine the exact speed, fall back to `3` with a comment explaining why.
8. Call `createEvents<'troopMovementAttack'>` — same as current implementation

### 5.9 — Batch Write Faction State Updates

After processing all factions, collect all updates to `npc_faction_state` and write them in a single batch `UPDATE` (follow the batch pattern already in the current `proactive-attack.ts`):

For each faction that passed the cooldown check and fired:
- `last_faction_attack_ms = currentTimeMs`
- `current_wave_stage = newWaveStage` (incremented if `waveLocketUntilMs` passed, otherwise unchanged)
- `wave_locked_until_ms = newWaveLockedUntilMs`

For factions that were skipped due to reputation gate or budget: do NOT update their state.

---

## Step 6 — Blitz Mode Special Rules

These rules apply **only** when `game_mode = 'blitz'` (use existing `getGameMode(db)` helper):

1. **No grace period after protection ends.** The existing `isBlitzProtectionActive` check already handles this. No change needed.
2. **Wave stage timer:** As described in Step 5.6 — use wall-clock 3-minute intervals, not game-speed intervals.
3. **Reputation gate still applies.** On Siege difficulty, `npc1` and `npc2` start at `hostile` reputation (already set by the `faction-reputation-seeder.ts` for those faction keys), so they are enemies from second 1. `npc3` starts friendly and never attacks unless the player raids them.
4. **Attack budget for Blitz:** Override the budget to `{ skirmish: 2, assault: 4, siege: 8 }` when `game_mode = 'blitz'`.

---

## Step 7 — Verify

Write or update tests in `packages/api/src/controllers/resolvers/utils/npc-brain/__tests__/` covering:

- [ ] **Reputation gate:** A faction with reputation ≥ `ALLY_THRESHOLD` never appears in the attack loop, even when its cooldown has expired
- [ ] **Cold start stagger:** On a freshly seeded server with all `last_proactive_attack_ms = 0`, no more than 1 faction fires per tick in the first game-hour
- [ ] **Faction cooldown:** A faction that just fired does not fire again until `factionIntervalMs` has passed
- [ ] **Wave stage 0:** On the first wave, exactly 1 village (the nearest) sends troops
- [ ] **Wave stage cap:** On a 25×25 map, wave stage never exceeds 1 (max 2 villages), regardless of how many waves have fired
- [ ] **Global budget:** When `inFlight >= budget`, `processProactiveAttacks` returns `0` and does NOT update any faction state
- [ ] **Blitz wave timer:** On Blitz mode, wave stage advances after 3 real minutes, not after the game-speed-scaled cooldown

Run the full test suite. Fix any test failures before considering this done.

---

## Files Changed Summary

| File | Action |
|---|---|
| `npc-brain-types.ts` | Add `proactiveCooldownMultiplier` to `FactionProfile` interface |
| `faction-profiles.ts` | Add `proactiveCooldownMultiplier` value to all 9 faction entries |
| `upgrade-db.ts` | Add `npc_faction_state` table creation + `proactive_attack_offset_ms` column migration |
| `world-items-seeder.ts` | Seed staggered offsets + insert faction state rows after NPC village creation |
| `proactive-attack.ts` | Full rewrite — reputation gate, faction cooldown, wave stage, global budget |
| `__tests__/reconciliation.test.ts` (or new file) | Add 7 test cases listed in Step 7 |

**Do NOT touch:**
- `simulate-elapsed-time.ts` — the call site is correct, only the implementation changes
- `reputation-impact.ts` — the reputation write logic is correct and untouched
- `faction-profiles.ts` faction names, keys, or any existing field — only add the new field
- Any retaliation logic — proactive attacks and retaliations are separate systems

---

## Commit Message

```
fix(phase-2): replace thundering-herd proactive attack with reputation-gated faction wave system
```
