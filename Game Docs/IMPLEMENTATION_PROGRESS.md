# Implementation Progress Report

> **Last Updated:** Phase 4 (Partial) — Natar Unit Data Complete
> **Branch:** master
> **Total Commits:** 6 commits

---

## Overview

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Server Configuration Defaults & Map Size System |
| Phase 2 | ✅ Complete | Proactive NPC Aggression (Reputation-Gated Faction Wave System) |
| Phase 3 | ✅ Complete | Blitz Mode Server |
| Phase 4 | 🔄 Partial | Natar Villages & World Wonder Endgame |
| Phase 5 | ⏳ Pending | Resource Convoy Raids & Village Morale |
| Phase 6 | ⏳ Pending | Daily Quests & Server Age Pressure |
| Phase 7 | ⏳ Pending | Extra Builder Hero Item & Hall of Fame |

---

## Phase 1 — Server Configuration Defaults & Map Size System ✅

### What Was Done

1. **Removed 200×200 map option** from frontend form and backend validation
2. **Added new map sizes:** 25×25, 50×50, 75×75, 100×100
3. **Set new defaults:**
   - Map size: 100×100
   - Speed: 10x
   - Tribe: Teutons
4. **Implemented faction count scaling:**
   - 25×25 and 50×50 maps → 3 factions
   - 75×75 and 100×100 maps → 9 factions

### Files Modified

| File | Change |
|------|--------|
| `packages/types/src/models/server.ts` | Updated `mapSizeSchema` to accept 25, 50, 75, 100 |
| `packages/db/src/schemas/servers-schema.sql` | Updated CHECK constraint for map_size |
| `apps/web/app/(public)/(game-worlds)/(create)/components/create-new-game-world-form.tsx` | Updated form options and defaults |
| `packages/api/src/utils/faction-scaling.ts` | New utility: `getFactionCountForMapSize()` |
| `packages/db/src/seeders/faction-ids-seeder.ts` | Updated to accept server and create appropriate faction count |
| `packages/db/src/seeders/faction-reputation-seeder.ts` | Updated to handle dynamic faction count |
| `packages/db/src/migrations/migrate.ts` | Pass server to faction seeder |

### Verification

- ✅ All DB tests pass (64 tests)
- ✅ All API tests pass (249 tests)
- ✅ Type checks pass

---

## Phase 2 — Proactive NPC Aggression ✅

### What Was Done

1. **Added difficulty system:** skirmish, assault, siege
2. **Implemented reputation-gated faction wave system:**
   - Allied factions (reputation ≥ friendly) are skipped
   - Each faction has its own cooldown, not per-village
   - Wave stage escalation: starts at 1 village, grows over time
   - Global budget limits total in-flight attacks
3. **Fixed thundering herd bug** where all villages attacked simultaneously
4. **Added `npc_faction_state` table** for faction-level cooldown tracking
5. **Added staggered cold-start offsets** to prevent simultaneous attacks

### Files Modified

| File | Change |
|------|--------|
| `packages/types/src/models/server.ts` | Added `difficultySchema` and `Difficulty` type |
| `packages/db/src/schemas/servers-schema.sql` | Added `difficulty` column |
| `packages/db/src/migrations/upgrade-db.ts` | Added migrations for difficulty and npc_faction_state |
| `packages/db/src/seeders/server-seeder.ts` | Updated to persist difficulty |
| `packages/db/src/seeders/npc-faction-state-seeder.ts` | New seeder for faction state and staggered offsets |
| `packages/api/src/controllers/resolvers/utils/npc-brain/npc-brain-types.ts` | Added `proactiveCooldownMultiplier` to FactionProfile |
| `packages/api/src/controllers/resolvers/utils/npc-brain/faction-profiles.ts` | Added cooldown multipliers to all 9 factions |
| `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/proactive-attack.ts` | Complete rewrite with reputation gate, faction cooldown, wave stage, global budget |
| `packages/api/src/controllers/resolvers/utils/npc-brain/simulate-elapsed-time.ts` | Integrated proactive attacks into NPC brain tick |
| `apps/web/app/(public)/(game-worlds)/(create)/components/create-new-game-world-form.tsx` | Added difficulty selector |

### Difficulty Settings

| Difficulty | Interval | Attack Chance | Max In-Flight (Standard) | Max In-Flight (Blitz) |
|------------|----------|---------------|--------------------------|------------------------|
| Skirmish | 60 min | 10% | 3 | 2 |
| Assault | 45 min | 25% | 6 | 4 |
| Siege | 20 min | 65% | 12 | 8 |

### Faction Cooldown Multipliers

| Faction | Name | Multiplier |
|---------|------|------------|
| npc1 | Iron Brotherhood | 0.6 (aggressive) |
| npc2 | Merchant Guilds | 2.5 (passive) |
| npc3 | Shadow Nomads | 1.0 (neutral) |
| npc4 | Stone Wardens | 0.8 |
| npc5 | River Clans | 0.9 |
| npc6 | Ember Cult | 0.65 |
| npc7 | Verdant Order | 3.0 (very passive) |
| npc8 | Iron Scholars | 1.8 |
| npc9 | Bone Reavers | 0.55 (most aggressive) |

### Verification

- ✅ All DB tests pass (64 tests)
- ✅ All API tests pass (249 tests)
- ✅ Type checks pass

---

## Phase 3 — Blitz Mode Server ✅

### What Was Done

1. **Added game mode:** `standard` | `blitz`
2. **Blitz mode forces:**
   - Map size: 25×25
   - Speed: 200x
   - 30-minute protection period
3. **Added 200x speed support** to database schema and frontend
4. **Auto-sets speed and map size** when Blitz mode is selected
5. **Disables speed/map selectors** when Blitz mode is active

### Files Modified

| File | Change |
|------|--------|
| `packages/types/src/models/server.ts` | Added `gameModeSchema` and `GameMode` type; added 200 to `speedSchema` |
| `packages/db/src/schemas/servers-schema.sql` | Added `game_mode`, `blitz_protection_ends_at` columns; updated speed CHECK to include 200 |
| `packages/db/src/migrations/upgrade-db.ts` | Added migrations for game_mode and blitz_protection_ends_at |
| `packages/db/src/seeders/server-seeder.ts` | Updated to persist game_mode and set blitz protection end time |
| `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/proactive-attack.ts` | Added `getGameMode()`, `isBlitzProtectionActive()` functions |
| `apps/web/app/(public)/(game-worlds)/(create)/components/create-new-game-world-form.tsx` | Added game mode selector, 200x speed option, auto-set logic |

### Verification

- ✅ All DB tests pass (64 tests)
- ✅ All API tests pass (249 tests)
- ✅ All web tests pass (51 tests)
- ✅ Type checks pass

---

## Phase 4 — Natar Villages & World Wonder Endgame 🔄 Partial

### What Is Done

1. **✅ Natar unit data completed** with Travian-accurate values:

| Unit | Attack | Def (inf) | Def (cav) | Speed | Cost (L/C/I/C) | Training Time |
|------|--------|-----------|-----------|-------|-----------------|---------------|
| Pikeman | 20 | 35 | 60 | 5 | 40/60/20/40 | 46:40 |
| Thorned Warrior | 65 | 30 | 10 | 6 | 70/40/60/20 | 1:00:00 |
| Guardsman | 100 | 40 | 20 | 7 | 120/100/150/60 | 1:46:40 |
| Bird of Prey (Scout) | 60 | 55 | 70 | 9 | 80/60/90/30 | 1:20:00 |
| Axerider | 155 | 80 | 50 | 10 | 170/150/20/40 | 2:20:00 |
| Natarian Knight | 250 | 140 | 200 | 10 | 350/330/250/80 | 4:00:00 |
| War Elephant | 600 | 440 | 520 | 7 | 1200/1000/800/500 | 10:00:00 |
| Ballista | 60 | 10 | 10 | 3 | 330/250/400/100 | 6:40:00 |
| Natarian Emperor | 200 | 80 | 80 | 7 | 0/0/0/0 | N/A |

2. **✅ Added new unit IDs:** WAR_ELEPHANT, BALLISTA, NATARIAN_EMPEROR
3. **✅ Added `playable: false`** flag to all Natar units
4. **✅ Updated unit-ids-schema.sql** CHECK constraint
5. **✅ Updated SpriteUnitId** type and icon localizations

### Files Modified

| File | Change |
|------|--------|
| `packages/game-assets/src/units.ts` | Updated all Natar unit stats, costs, speeds, training times |
| `packages/types/src/models/unit.ts` | Added WAR_ELEPHANT, BALLISTA, NATARIAN_EMPEROR to schema; added `playable` field; added tier-6 and siege-ballista tiers |
| `packages/db/src/schemas/lookup-tables/unit-ids-schema.sql` | Added new units to CHECK constraint |
| `packages/game-assets/src/troop-icons.ts` | Added new unit IDs to SpriteUnitId and NATAR_UNIT_MAP |
| `apps/web/app/components/icons/icons.tsx` | Added icons for new units |
| `apps/web/app/localization/locales/en-US/assets.json` | Added localizations for new unit icons |

### What Is Left

The following Phase 4 tasks are **NOT yet implemented:**

- [ ] **Natar village seeding** — Create seeder for Natar villages (1-4 per map size)
- [ ] **Construction Plan item** — Add hero item type, obtain from Natar villages
- [ ] **World Wonder building** — Add building type with 20 levels, special costs
- [ ] **NPC factions competing for Wonder** — NPC logic to attack Natar villages and build Wonders
- [ ] **Report: NPC Wonder milestone** — Generate report when NPC reaches Wonder Level 10
- [ ] **Allied faction defence** — Allied factions send troops to defend player's Wonder

### Complexity Note

The remaining Phase 4 tasks are **highly complex** and require:
- New building type in `buildings.ts` with special cost formula
- New hero item type in items system
- New seeder for Natar villages with speed-scaled garrisons
- Modifications to NPC brain to handle Wonder competition
- New report types
- Integration with reputation system for allied defence

---

## Phase 5 — Resource Convoy Raids & Village Morale ⏳ Pending

### What Needs To Be Done

- [ ] NPC resource convoys visible on map
- [ ] Interception mechanic (attack convoy before it arrives)
- [ ] Allied faction convoys to Wonder village
- [ ] Village morale system (0-150 range, affects combat and production)

---

## Phase 6 — Daily Quests & Server Age Pressure ⏳ Pending

### What Needs To Be Done

- [ ] Daily quest pool (8 quest types)
- [ ] 24-hour reset cycle (scaled by server speed)
- [ ] Server age escalation system (Threat Level indicator)
- [ ] NPC attack frequency increases over time

---

## Phase 7 — Extra Builder Hero Item & Hall of Fame ⏳ Pending

### What Needs To Be Done

- [ ] Extra Builder consumable hero item
- [ ] Building queue slot expansion (max 5)
- [ ] Hall of Fame table and page
- [ ] Server end statistics recording

---

## Bug Fixes Applied

| Fix | Description |
|-----|-------------|
| oasisLoyaltyRegeneration | Added missing duration calculation for oasis loyalty regeneration events |
| Phase 2 thundering herd | Replaced per-village attacks with reputation-gated faction wave system |
| Phase 3 speed constraint | Added 200x speed to CHECK constraint for Blitz mode |

---

## Test Results Summary

| Package | Tests | Status |
|---------|-------|--------|
| @pillage-first/db | 64 | ✅ Pass |
| @pillage-first/api | 249 | ✅ Pass |
| @pillage-first/web | 51 | ✅ Pass |
| **Total** | **364** | **✅ All Pass** |

---

## Commits

1. `feat(phase-1-2-3): implement map size scaling, proactive NPC aggression, and blitz mode`
2. `fix(phase-2): replace thundering-herd proactive attack with reputation-gated faction wave system`
3. `fix(phase-3): add 200x speed support for Blitz mode`
4. `feat(phase-4): complete Natar unit data with Travian-accurate values`

---

## Next Steps

To continue implementation, the recommended order is:

1. **Complete Phase 4 remaining tasks** (Natar villages, Construction Plan, World Wonder)
2. **Phase 5** (Convoys and Morale)
3. **Phase 6** (Daily Quests and Server Age)
4. **Phase 7** (Extra Builder and Hall of Fame)

Each phase should be tested and committed separately before moving to the next.
