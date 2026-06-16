# NPC Brain Performance Audit

## Methodology

Traced every SQL query path through `packages/api/src/controllers/resolvers/utils/npc-brain/`. Counted per-village, per-tick, and shared queries. Estimated timing using SQLite WASM on OPFS (mid-range mobile).

**Timing estimates per operation:**
- Prepared SELECT (cached): ~0.03ms
- Prepared INSERT/UPDATE: ~0.07ms
- DELETE: ~0.05ms

---

## Per-Village Query Count

Each subsystem fires the following queries **per village per tick**:

| Subsystem | SELECTs | Writes | Notes |
|-----------|---------|--------|-------|
| getVillageTribe | 1 | 0 | Always fires |
| memoryDecay | 1 | 0–1 | PERMANENT factions: 0 writes |
| growthSimulation | 6 | 2 | +1S/+1W per field level-up (rare) |
| lootRecovery | 1–2 | 0–2 | Depends on loot state |
| troopRegeneration | 0–7 | 0–5 | 0/0 if tiny village early return |
| aggressionDecay | 0–1 | 0–3 | PERMANENT factions: 0/0 |
| **Typical total** | **18** | **9** | Non-PERMANENT, mid-size, recovering |

Permanent factions (npc1, npc4, npc6, npc9): **~16 SELECTs, ~3–4 writes**.

### Shared Overhead (once per tick, not per village)

| Source | SELECTs | Writes |
|--------|---------|--------|
| getAllNPCVillages | 1 | 0 |
| calculateWorldThreatLevel | 4 | 0 |
| processRetaliations (query) | 1 | 0 |
| **Subtotal** | **6** | **0** |

### Per Due Retaliation

Each due retaliation event fires: **~19 SELECTs, ~10 writes** (includes createEvents validation, troop removal, event insertion).

### Formula

```
Total per tick = 6 + 18N + 19R  SELECTs  +  9N + 10R  writes
```

Where N = village count, R = due retaliation count.

---

## Village Count by Map Size

From `player-factory.ts` (density = 0.046):

| Map Size | Total Tiles | NPC Villages |
|----------|-------------|--------------|
| 50×50    | ~3,025      | ~120         |
| 100×100  | ~11,025     | ~499         |
| 200×200  | ~42,025     | ~1,899       |
| 300×300  | ~93,025     | ~4,299       |

---

## Chunk Count Formula

```
chunks = floor(elapsedMs / (3,600,000 / speed)) + (1 if remainder > 0)
```

| Offline Duration | x1 speed | x10 speed | x20 speed |
|-----------------|----------|-----------|-----------|
| 1 hour          | 1        | 10        | 20        |
| 2 hours         | 2        | 20        | 40        |
| 8 hours         | 8        | 80        | 160       |
| 24 hours        | 24       | 240       | 480       |
| 30 days         | 720      | 7,200     | 14,400    |

---

## Scenario Results

### Scenario 1: x1 speed, 100×100, 499 villages, 8h offline

| Metric | Value |
|--------|-------|
| Chunks | 8 |
| Queries per tick | 13,479 (9,006 SELECT + 4,473 write) |
| Tick duration | **~585ms** |
| Total queries (catch-up) | 107,832 |
| Total writes (catch-up) | 35,784 |
| Catch-up duration | **~4.7s** |
| Tick < 200ms? | **FAIL** |
| Catch-up < 3s? | **FAIL** |

### Scenario 2: x10 speed, 100×100, 499 villages, 8h offline

| Metric | Value |
|--------|-------|
| Chunks | 80 |
| Queries per tick | 13,479 |
| Tick duration | **~585ms** |
| Total queries (catch-up) | 1,078,320 |
| Total writes (catch-up) | 357,840 |
| Catch-up duration | **~47s** |
| Tick < 200ms? | **FAIL** |
| Catch-up < 3s? | **FAIL (15×)** |

### Scenario 3: x20 speed, 100×100, 499 villages, 8h offline

| Metric | Value |
|--------|-------|
| Chunks | 160 |
| Queries per tick | 13,479 |
| Tick duration | **~585ms** |
| Total queries (catch-up) | 2,156,640 |
| Total writes (catch-up) | 715,680 |
| Catch-up duration | **~94s** |
| Tick < 200ms? | **FAIL** |
| Catch-up < 3s? | **FAIL (31×)** |

### Scenario 4: x10 speed, 50×50, ~120 villages, 8h offline

| Metric | Value |
|--------|-------|
| Chunks | 80 |
| Queries per tick | 3,246 (2,166 SELECT + 1,080 write) |
| Tick duration | **~141ms** |
| Total queries (catch-up) | 259,680 |
| Total writes (catch-up) | 86,400 |
| Catch-up duration | **~11.3s** |
| Tick < 200ms? | **PASS** |
| Catch-up < 3s? | **FAIL (3.8×)** |

### Scenario 5: x20 speed, 50×50, ~120 villages, 2h offline

| Metric | Value |
|--------|-------|
| Chunks | 40 |
| Queries per tick | 3,246 |
| Tick duration | **~141ms** |
| Total queries (catch-up) | 129,840 |
| Total writes (catch-up) | 43,200 |
| Catch-up duration | **~5.6s** |
| Tick < 200ms? | **PASS** |
| Catch-up < 3s? | **FAIL (1.9×)** |

### Scenario 6: x1 speed, 499 villages, 30 days offline (worst case)

| Metric | Value |
|--------|-------|
| Chunks | 720 |
| Queries per tick | 13,479 |
| Tick duration | **~585ms** |
| Total queries (catch-up) | 9,704,880 |
| Total writes (catch-up) | 3,220,080 |
| Catch-up duration | **~422s (7 min)** |
| Tick < 200ms? | **FAIL** |
| Catch-up < 3s? | **FAIL (140×)** |

---

## Higher-Frequency Tick Overhead

| Interval | Ticks/hour | Tick duration | CPU overhead vs 60s | Writes/hour |
|----------|-----------|---------------|---------------------|-------------|
| 60s (current) | 60 | ~585ms | baseline | 270,000 |
| 30s | 120 | ~585ms | +100% | 540,000 |
| 10s (x20 mode) | 360 | ~585ms | +500% | 1,620,000 |

At 10s intervals with 499 villages, each tick takes ~585ms — it **never finishes within the interval**. The tick would overlap itself, causing compounding lag.

---

## Summary Scorecard

| Scenario | Tick | Catch-up | Overall |
|----------|------|----------|---------|
| x1, 499v, 8h | FAIL (585ms) | FAIL (4.7s) | FAIL |
| x10, 499v, 8h | FAIL (585ms) | FAIL (47s) | FAIL |
| x20, 499v, 8h | FAIL (585ms) | FAIL (94s) | FAIL |
| x10, 120v, 8h | PASS (141ms) | FAIL (11.3s) | FAIL |
| x20, 120v, 2h | PASS (141ms) | FAIL (5.6s) | FAIL |
| x1, 499v, 30d | FAIL (585ms) | FAIL (7 min) | FAIL |

**6 of 6 scenarios fail overall. Only the 120-village tick passes the 200ms target.**

---

## Top 3 Architectural Changes Required

### 1. Batch all per-village queries into a single multi-statement transaction per subsystem

Currently each village fires 18 individual SELECTs and 9 writes. With 500 villages that is 9,000 round-trips to SQLite. Instead:

- **growthSimulation**: One query that fetches ALL village states + field levels in a single JOIN, compute growth in JS, then one batch UPDATE.
- **troopRegeneration**: One query fetching all village troop states, compute regen in JS, one batch INSERT/UPDATE.
- **lootRecovery**: One query for all loot states, compute in JS, one batch UPDATE.
- **memoryDecay**: One DELETE with a subquery joining on faction memory thresholds.
- **aggressionDecay**: One UPDATE with a CASE expression.

This reduces per-village queries from ~18 SELECTs to ~1 SELECT (with a JOIN), and from ~9 writes to ~1 batched write. **Target: 6 + N + 1 queries per tick instead of 6 + 18N.**

### 2. Process catch-up at a coarser granularity for long offline periods

Currently chunks are 1 simulated hour. For 30 days offline at x1 speed that is 720 chunks. Instead:

- **For offline > 24h**: Use 24-hour chunks. Apply growth/regen/recovery multiplied by 24.
- **For offline > 7 days**: Use 7-day chunks.
- **Skip intermediate states**: Only compute the final state, not every intermediate hour.

This reduces 30-day catch-up from 720 ticks to 30 ticks (daily) or 5 ticks (weekly).

### 3. Cache `getMapSize` and `getGameSpeed` once per tick, not per village

`getMapSize(db)` fires `SELECT map_size FROM servers LIMIT 1` twice per village — once in growth, once in troop regen. With 500 villages that is 1,000 redundant queries. Pass these as parameters to subsystem functions instead of querying each time.

This alone saves ~2N SELECTs per tick (1,000 queries for 500 villages).

---

## Additional Optimizations

- **Skip villages at steady state**: If a village has full loot, full troops, no aggression, and is at max field level, skip it entirely. Add a `needsTick` flag.
- **Use WAL mode aggressively**: The existing PRAGMA settings already use `journal_mode = OFF` which is fastest but risky. Consider `WAL` for better concurrency.
- **Defer retaliation execution**: Don't process retaliations inside the tick. Queue them and let the existing scheduler handle them.
- **Progressive catch-up**: Show a progress bar and process chunks in batches of 10, yielding to the event loop between batches (already partially implemented with `YIELD_EVERY_N_CHUNKS`).
