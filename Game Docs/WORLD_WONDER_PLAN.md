# World Wonder System - Comprehensive Implementation Plan

> **Status:** Design document - not yet implemented
> **Date:** 2026-06-27
> **Source:** Travian Legends Mobile Unity codebase analysis + Phase 4 plan audit

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [How Travian Actually Works](#2-how-travian-actually-works)
3. [Current Implementation Audit](#3-current-implementation-audit)
4. [What Needs to Change](#4-what-needs-to-change)
5. [Database Schema Changes](#5-database-schema-changes)
6. [API Changes](#6-api-changes)
7. [Frontend Changes](#7-frontend-changes)
8. [Natar Village Seeding](#8-natar-village-seeding)
9. [Conquest Mechanic](#9-conquest-mechanic)
10. [Construction Plan Flow](#10-construction-plan-flow)
11. [WW Upgrade Mechanics](#11-ww-upgrade-mechanics)
12. [Natar AI WW Race](#12-natar-ai-ww-race)
13. [Time-Gated Attacks](#13-time-gated-attacks)
14. [WW Village Restrictions](#14-ww-village-restrictions)
15. [Global WW Tracking](#15-global-ww-tracking)
16. [File Reference Index](#16-file-reference-index)
17. [Migration Strategy](#17-migration-strategy)
18. [Open Questions](#18-open-questions)

---

## 1. Executive Summary

The current World Wonder implementation has a fundamental design error: **players build the WW in their own village** (with Treasury level 10 + Construction Plan). In actual Travian, the WW is built in **Natar-owned WW villages** that players must **conquer** using the loyalty mechanic (Chiefs/Senators). The Construction Plan is a separate artefact needed for upgrades, not for starting.

### Key Design Differences

| Aspect | Current (Wrong) | Correct (Travian) |
|--------|-----------------|-------------------|
| WW location | Player's own village | Natar WW village (conquered) |
| How WW starts | Player clicks Start WW | WW already exists at level 0 |
| Construction Plan | Consumed to start WW | Consumed at L0->L1 upgrade |
| Treasury role | Required level 10 | No special role for WW |
| Conquest | Not implemented | Loyalty-based (Chiefs/Senators) |
| Natar AI | Builds in NPC villages | Builds in WW villages, races players |
| Village count | 1 WW per player | ~14 Natar WW villages per map |
| Attack gates | None | Time-gated until specific datetime |
| Field | Replaced from wall (40) | WW on slot 35; wall stays |

---

## 2. How Travian Actually Works

### 2.1 WW Villages

- **Natars own ~14 WW villages** on the map
- Each WW village has `isWW = true` flag
- The **WW building (gid40) already exists** at level 0 (Natar AI builds it up)
- WW villages have **14 building fields** (not standard 40)
- WW villages are identified by the `isWW` boolean, NOT a special VillageType

### 2.2 Village Conquest

- Players conquer Natar WW villages using **Chiefs/Senators** (tribe-specific)
- Conquest works by **lowering loyalty** through attacks with conquest unit
- When loyalty reaches 0, village joins attacker's empire
- WW building **retains its current level** after conquest
- After conquest, village becomes `OwnVillage` with `isWW = true` and `wow` object

### 2.3 Construction Plans

- Plans are **artefacts** (`PlaceBonusInterface.Type.WonderWorldConstructionPlan = 1`)
- Plans spawn at server-configured time (`constructionPlansDate`)
- Plans found by **attacking Natar villages** (not from conquering WW villages)
- **One plan** for WW levels 1-49
- **Two plans** (yours + alliance member's) for levels 50+
- Plan is **consumed when WW reaches level 1** (L0->L1 upgrade)

### 2.4 WW Upgrade

- After conquering a Natar WW village, player can upgrade the WW
- Requires: active construction plan + sufficient resources
- Formula: `ceil((50000 * level^2.5) / 5) * 5` per resource
- WW can be **renamed** (max 25 chars) until level 11
- `cannotBeUpgradedReason` string explains blocking

### 2.5 Natar AI Race

- Natars also build their own WW
- Natars attack OTHER WW villages (until their own WW reaches L75)
- Natar WW at level 100 = server ends (Natars win)
- Player WW at level 100 = server ends (Player wins)

### 2.6 Time-Gated Attacks

- Players **cannot attack WW villages** until specific datetime
- Server sends `BlockWWAttacksBeforeInfoboxMessage` with blocking timestamp
- After gate opens: `BlockWWAttacksAfterInfoboxMessage`

### 2.7 WW Village Restrictions

- Cannot be made **capital**
- Cannot be **upgraded to city**
- Cannot be **destroyed**
- Cannot use **gold features**
- Cannot **exchange resources**
- Cannot be added to **farmlists**
- Trade routes CAN be sent (alliance only)

### 2.8 Global Tracking

- `wwLevel` - highest WW level on server (global)
- `wwTribeId` - which tribe has highest WW
- Available in lobby info, bootstrap data, REST API

---

## 3. Current Implementation Audit

### 3.1 What Works Correctly

- `world_wonders` table schema (village_id, owner, level, etc.)
- `natar_villages` table schema (village_id, plan_available, etc.)
- WW cost formula: `calculateWorldWonderCostForLevel(level)`
- WW duration formula: `calculateWorldWonderDurationForLevel(level, speed)`
- `worldWonderUpgradeResolver` (L1 consume plan, L10/L15 milestones, L20 end)
- `endServer` function
- WW leaderboard API + frontend
- Victory/Defeat screen
- WW progress indicator in header
- Per-tribe WW illustrations on village canvas
- Report types: `construction_plan_obtained`, `npc_wonder_milestone`
- NPC wonder competition subsystem
- Combat unconquerability after L1
- Event system integration

### 3.2 What Is Wrong

- WW is started in player's own village (should be Natar WW village)
- Treasury level 10 required (not a Travian mechanic)
- "Start World Wonder" button (should not exist)
- Construction Plan consumed at start (should be at L0->L1)
- Field 40 replacement (WW should be on slot 35)
- No conquest mechanic (should be loyalty-based)
- No loyalty system
- No time-gated attacks
- No WW village restrictions
- Natar AI builds WW in wrong location
- Natar villages seeded with standard buildings (WW villages need 14 fields)
- No global wwLevel tracking
- Construction Plan as hero inventory item (should be Treasury artefact)

---

## 4. What Needs to Change

### Phase A: Database Schema (HIGH)

1. Add `is_ww_village` to `natar_villages`
2. Add `ww_level` to `natar_villages`
3. Add `loyalty` to `villages`
4. Add `attack_block_until` to `natar_villages`
5. Add `last_attacked_at` to `natar_villages`
6. Add `ww_level` and `ww_tribe_id` to `servers`

### Phase B: Natar Village Seeding (HIGH)

1. Create ~14 WW villages per map
2. WW villages get 14 building fields
3. WW villages start with WW building (gid40) at level 0
4. WW villages get `attack_block_until` timestamp
5. Place at specific locations (8 outside grey, 6 inside, capital at 0|0)

### Phase C: Conquest Mechanic (HIGH)

1. Implement loyalty system
2. Chiefs/Senators lower loyalty
3. Loyalty 0 = village transfers
4. WW village retains level after conquest

### Phase D: Construction Plan Redesign (HIGH)

1. Change from hero inventory to Treasury artefact
2. Plans spawn at server time
3. Plans found by attacking Natar villages
4. Consumed at L0->L1 upgrade
5. One plan for L1-49, two for L50+

### Phase E: WW Building Slot (MEDIUM)

1. Change from slot 40 to slot 35
2. Update canvas rendering
3. Update building field validation

### Phase F: Time-Gated Attacks (MEDIUM)

1. Block attacks until specific datetime
2. Send infobox messages
3. Integrate with game calendar

### Phase G: WW Village Restrictions (MEDIUM)

1. Prevent capital designation
2. Prevent city upgrade
3. Prevent village destruction
4. Prevent resource exchange
5. Prevent farmlist addition

### Phase H: Natar AI WW Race (MEDIUM)

1. Natar AI builds in WW villages
2. Natars attack other WW villages (until L75)
3. Global tracking

### Phase I: Global WW Tracking (LOW)

1. Add to servers table
2. Update on level change
3. Expose in API

---

## 5. Database Schema Changes

### 5.1 natar_villages Table

```sql
ALTER TABLE natar_villages ADD COLUMN is_ww_village INTEGER NOT NULL DEFAULT 0;
ALTER TABLE natar_villages ADD COLUMN ww_level INTEGER NOT NULL DEFAULT 0;
ALTER TABLE natar_villages ADD COLUMN attack_block_until INTEGER DEFAULT NULL;
ALTER TABLE natar_villages ADD COLUMN last_attacked_at INTEGER DEFAULT NULL;
```

### 5.2 villages Table

```sql
ALTER TABLE villages ADD COLUMN loyalty INTEGER NOT NULL DEFAULT 100;
```

### 5.3 servers Table

```sql
ALTER TABLE servers ADD COLUMN ww_level INTEGER NOT NULL DEFAULT 0;
ALTER TABLE servers ADD COLUMN ww_tribe_id INTEGER DEFAULT NULL;
```

---

## 6. API Changes

### 6.1 REMOVE: startWorldWonder

**File:** `packages/api/src/controllers/world-wonder-controllers.ts` (L20-133)

Delete entirely. Players do not start WWs.

### 6.2 MODIFY: upgradeWorldWonder

**File:** `packages/api/src/controllers/world-wonder-controllers.ts` (L136-184)

- Remove Treasury level 10 check
- Remove "player must own WW" check
- Add: must own conquered Natar WW village
- Add: must have active construction plan
- Add: for L50+, must have alliance member's plan

### 6.3 MODIFY: getWorldWonder

**File:** `packages/api/src/controllers/world-wonder-controllers.ts` (L211-266)

- Return WW data for Natar-owned WWs
- Include `isNatarOwned` flag
- Include `attackBlockUntil` timestamp

### 6.4 ADD: conquerVillage Endpoint

```
POST /villages/:villageId/conquer
Body: { unitId: string }
```

### 6.5 ADD: getVillageLoyalty Endpoint

```
GET /villages/:villageId/loyalty
```

### 6.6 MODIFY: getWorldWonderLeaderboard

- Include Natar-owned WWs
- Show owner type (Player vs Natar)

### 6.7 ADD: Global WW Level Endpoint

```
GET /server/ww-status
Response: { wwLevel, wwTribeId, attackBlockUntil }
```

---

## 7. Frontend Changes

### 7.1 REMOVE: Construction Plan Panel in Treasury

**File:** `apps/web/app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/treasury/treasury-artifacts.tsx`

Remove lines 109-224 (entire Construction Plan section including Start WW button).

### 7.2 REMOVE: WW Tab from Treasury Building

**File:** `apps/web/app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-details.tsx`

Remove `['world-wonder', WorldWonderTab]` from `buildingDetailsTabMap` under `TREASURY`.

### 7.3 REWRITE: World Wonder Tab

**File:** `apps/web/app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/world-wonder/world-wonder-tab.tsx`

- Show WW status for conquered Natar WW village
- Show Natar ownership status (if not yet conquered)
- Show upgrade path with construction plan requirement
- Show rename (max 25 chars, only before L11)
- Show `cannotBeUpgradedReason`
- Remove "Start World Wonder" UI
- Remove Treasury level prerequisite

### 7.4 ADD: Conquest UI Component

New component for conquering villages:
- Loyalty bar
- Conquest unit requirement
- Conquest progress
- Special WW village conquest UI

### 7.5 ADD: WW Village Map Indicator

- Special icon/marker for WW villages
- Show WW level
- Show attack block status

### 7.6 MODIFY: Village Canvas Rendering

**File:** `apps/web/app/(game)/(village-slug)/(village)/components/occupied-building-field.tsx`

- Change WW from slot 40 to slot 35
- Update GID_MAP
- Update CSS for slot 35

### 7.7 MODIFY: Building Details Tab Map

**File:** `apps/web/app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-details.tsx`

Add WW tab for slot 35 (not slot 40).

### 7.8 MODIFY: WW Leaderboard

**File:** `apps/web/app/(game)/(village-slug)/(statistics)/components/world-wonder-leaderboard.tsx`

- Include Natar-owned WWs
- Show owner type
- Show attack status

### 7.9 ADD: WW Attack Timer

- Header countdown
- Map view indicator
- Infobox notification

---

## 8. Natar Village Seeding

### 8.1 WW Village Count

**File:** `packages/api/src/utils/faction-scaling.ts`

Current: 1-4 villages. New: ~14 WW villages:
- 8 outside grey zone
- 6 inside grey zone
- Capital at 0|0 (unattackable)

### 8.2 WW Village Building Fields (14 total)

**File:** `packages/db/src/seeders/natar-villages-seeder.ts`

```
Fields 1-6:   Resource fields (wood, clay, iron, crop)
Fields 7-13:  Buildings (warehouse, granary, rally point, etc.)
Field 35:     WonderOfTheWorld (gid40) at level 0
NO wall (field 40)
```

### 8.3 WW Village Placement

- 8 outside grey zone (~60-80% map radius)
- 6 inside grey zone (~30-50% map radius)
- Capital at 0|0 (cannot be attacked)

---

## 9. Conquest Mechanic

### 9.1 Loyalty System

- Each village has `loyalty` (0-100, default 100)
- Decreases when attacked with conquest unit
- Reaches 0 = village transfers
- Optional: slow regeneration over time

### 9.2 Conquest Units by Tribe

| Tribe | Unit |
|-------|------|
| Romans | Senator |
| Teutons | Chief |
| Gauls | Chieftain |
| Egyptians | Nomarch |
| Huns | Logades |
| Spartans | Ephor |
| Vikings | Jarl |

### 9.3 Loyalty Reduction

```
loyalty_damage = conquest_unit_power * (1 - current_loyalty / 100)
```

### 9.4 Conquest Flow

1. Player sends army with conquest unit
2. Combat resolves
3. If conquest unit survives: loyalty decreases
4. If loyalty = 0: village transfers
5. WW villages: WW ownership transfers too

### 9.5 WW Village Conquest Rules

- Higher base loyalty (e.g., 200)
- Stronger garrison
- WW retains level after conquest
- Becomes player's `is_world_wonder_village`

---

## 10. Construction Plan Flow

### 10.1 Plan Spawning

- Spawn at `constructionPlansDate`
- Placed in regular Natar villages (not WW villages)
- 1 plan per Natar village
- Type: `WonderWorldConstructionPlan = 1`

### 10.2 Plan Acquisition

- Attack Natar village with Hero
- Hero survives and wins = plan granted
- Stored in Treasury as artefact
- One plan per player limit

### 10.3 Plan Usage

- Required for ALL WW upgrades
- **Consumed at L0->L1 upgrade**
- For L50+: need yours + alliance member's plan
- Plans can become inactive

---

## 11. WW Upgrade Mechanics

### 11.1 Upgrade Requirements

- Must own conquered Natar WW village
- Must have active construction plan
- Must have sufficient resources
- For L50+: alliance member's plan too

### 11.2 Cost Formula

```typescript
function calculateWorldWonderCostForLevel(level: number): Resources {
  const f = Math.pow(level, 2.5);
  return {
    lumber: Math.ceil((50000 * f) / 5) * 5,
    clay:   Math.ceil((50000 * f) / 5) * 5,
    iron:   Math.ceil((50000 * f) / 5) * 5,
    crop:   Math.ceil((50000 * f) / 5) * 5,
  };
}
```

### 11.3 Duration Formula

```typescript
function calculateWorldWonderDurationForLevel(level: number, speed: number): number {
  return Math.floor((3600 * level) / speed) * 1000; // ms
}
```

### 11.4 Max Level

- Vanilla Travian: level 100
- Our project: level 20 (per Phase 4 plan)

---

## 12. Natar AI WW Race

### 12.1 Natar WW Building

- Natars build WW in their own WW villages
- Start after warmup period (24h standard, 10min Blitz)
- Queue upgrades continuously

### 12.2 Natar Attacks on Other WWs

- Natars attack other WW villages (until own WW reaches L75)
- Prefer WW villages at level >= 5
- Distance reduction: 0.7x for closer targets

### 12.3 End Conditions

- Natar WW at max level = Natars win (defeat for player)
- Player WW at max level = Player wins (victory)

---

## 13. Time-Gated Attacks

### 13.1 Attack Blocking

- WW villages cannot be attacked until specific datetime
- `attack_block_until` timestamp in `natar_villages`

### 13.2 Messages

- Before: `BlockWWAttacksBeforeInfoboxMessage` with countdown
- After: `BlockWWAttacksAfterInfoboxMessage`

### 13.3 Recommended Timing

- Standard server: 7-10 days after server start
- Blitz server: 1-2 days after server start

---

## 14. WW Village Restrictions

| Restriction | Implementation |
|-------------|---------------|
| Cannot be capital | Block in Residence/Palace UI |
| Cannot upgrade to city | Block in city upgrade check |
| Cannot be destroyed | Block in village destruction |
| Cannot exchange resources | Block in marketplace |
| Cannot add to farmlists | Block in farm list add |
| Trade routes allowed | Allow within alliance |

---

## 15. Global WW Tracking

### 15.1 Server-Level Fields

```sql
servers.ww_level INTEGER -- highest WW level on server
servers.ww_tribe_id INTEGER -- tribe with highest WW
```

### 15.2 Update Triggers

- On every WW level up: check if new level > current ww_level
- Update both `servers.ww_level` and `servers.ww_tribe_id`

### 15.3 API Exposure

- Lobby info: `wwLevel`, `wwTribeId`
- Bootstrap data: `wwLevel`, `wwTribeId`
- REST endpoint: `/server/ww-status`

---

## 16. File Reference Index

### API Controllers (6 files)

| File | Purpose |
|------|---------|
| `packages/api/src/controllers/world-wonder-controllers.ts` | WW start/upgrade/rename/query/leaderboard |
| `packages/api/src/controllers/resolvers/world-wonder-resolvers.ts` | WW resolver + endServer |
| `packages/api/src/controllers/admin-action-controllers.ts` | Admin WW actions |
| `packages/api/src/controllers/admin-read-controllers.ts` | Admin WW queries |
| `packages/api/src/controllers/hero-controllers.ts` | Construction Plan helpers |
| `packages/api/src/controllers/server-controllers.ts` | Server controller |

### Resolvers (4 files)

| File | Purpose |
|------|---------|
| `.../npc-brain/subsystems/npc-wonder-competition.ts` | NPC WW race |
| `.../npc-brain/subsystems/proactive-attack.ts` | NPC WW targeting |
| `.../npc-brain/subsystems/allied-defence.ts` | Allied defence WW query |
| `.../combat-resolver.ts` | WW unconquerability |

### Database (8 files)

| File | Purpose |
|------|---------|
| `packages/db/src/schemas/world-wonders-schema.sql` | WW table |
| `packages/db/src/schemas/natar-villages-schema.sql` | Natar villages table |
| `packages/db/src/schemas/villages-schema.sql` | Village WW columns |
| `packages/db/src/migrations/upgrade-db.ts` | WW migrations |
| `packages/db/src/migrations/migrate.ts` | Migration runner |
| `packages/db/src/seeders/natar-villages-seeder.ts` | Natar village seeder |
| `packages/db/src/schemas/lookup-tables/building-ids-schema.sql` | Building IDs |
| `packages/db/src/schemas/lookup-tables/unit-ids-schema.sql` | Unit IDs |

### Frontend Hooks (2 files)

| File | Purpose |
|------|---------|
| `apps/web/app/(game)/(village-slug)/hooks/use-world-wonder.ts` | WW state/hooks |
| `apps/web/app/(game)/(village-slug)/hooks/use-admin-dashboard.ts` | Admin WW mutations |

### Frontend Components (8 files)

| File | Purpose |
|------|---------|
| `.../world-wonder/world-wonder-tab.tsx` | WW building panel |
| `.../treasury/treasury-artifacts.tsx` | Construction Plan panel (REMOVE) |
| `.../building-details.tsx` | Building tab map |
| `.../statistics/world-wonder-leaderboard.tsx` | WW leaderboard |
| `.../village/components/occupied-building-field.tsx` | Canvas rendering |
| `.../reports/components/report-filters.tsx` | Report filters |
| `.../reports/components/report-list.tsx` | Report list |
| `.../reports/(...report-id)/page.tsx` | Report detail |

### Frontend Pages (3 files)

| File | Purpose |
|------|---------|
| `apps/web/app/(game)/(village-slug)/layout.tsx` | Header WW indicator |
| `apps/web/app/(game)/layout.tsx` | Victory/Defeat screen |
| `apps/web/app/(game)/(village-slug)/(statistics)/page.tsx` | Statistics tabs |

### Types (3 files)

| File | Purpose |
|------|---------|
| `packages/types/src/models/building.ts` | Building types |
| `packages/types/src/models/report.ts` | Report types |
| `packages/types/src/models/hero-item.ts` | Hero item types |

### Game Assets (9 files)

| File | Purpose |
|------|---------|
| `packages/game-assets/src/buildings.ts` | WW building definition |
| `packages/game-assets/src/utils/buildings.ts` | Cost/duration formulas |
| `packages/game-assets/src/items.ts` | Construction Plan item |
| `packages/game-assets/src/village.ts` | Natar wall mapping |
| `packages/game-assets/src/building-icons.ts` | Building icon mapping |
| `packages/game-assets/src/units.ts` | Natar unit definitions |
| `packages/game-assets/src/troop-icons.ts` | Troop icon mapping |
| `packages/game-assets/src/combat/combat-engine.ts` | Combat wall modifiers |
| `packages/api/src/utils/faction-scaling.ts` | Natar village count |

---

## 17. Migration Strategy

### Step 1: Database Migration

Add new columns to existing tables. No data loss.

### Step 2: Reseed Natar Villages

Delete existing Natar villages and reseed with WW villages (14 fields, WW at slot 35).

### Step 3: Remove startWorldWonder

Delete the endpoint and all references.

### Step 4: Rewrite upgradeWorldWonder

Update to work with conquered Natar WW villages.

### Step 5: Implement Conquest

Add loyalty system and conquest mechanic.

### Step 6: Redesign Construction Plans

Move from hero inventory to Treasury artefact.

### Step 7: Update Frontend

Remove old UI, add new UI.

### Step 8: Add Time-Gated Attacks

Implement attack blocking.

### Step 9: Add Restrictions

Implement WW village restrictions.

### Step 10: Add Natar AI Race

Implement Natar WW building and attacks.

---

## 18. Open Questions

1. **WW Max Level:** Should it be 20 (current) or 100 (vanilla)?
2. **WW Village Count:** Exactly 14 or configurable per server?
3. **Conquest Unit Power:** What values for each tribe's conquest unit?
4. **Loyalty Regeneration:** Should villages regenerate loyalty over time?
5. **Alliance Plans (L50+):** How to implement alliance member plan sharing?
6. **Plan Inactivation:** When/how do plans become inactive?
7. **WW Village Placement:** Exact coordinates or random within zones?
8. **Capital at 0|0:** Should the Natar capital WW be attackable?
9. **WW Village Garrison:** Exact Natar troop composition?
10. **Time-Gate Duration:** How many days after server start?
