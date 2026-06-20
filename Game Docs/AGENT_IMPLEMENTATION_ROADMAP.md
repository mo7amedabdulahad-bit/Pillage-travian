# Pillage First! — AI Agent Implementation Roadmap

> **For the AI coding agent:** Before starting ANY phase, read this entire document first. Then read EVERY file in the codebase from top to bottom before writing a single line of code. Pay special attention to existing implementations that may overlap with what you are being asked to add. If a feature already exists — even partially — you MUST extend it, not replace or duplicate it. After reading the code, write a short internal summary of what already exists relevant to the phase before you begin implementation.

---

## Project Overview

- **Stack:** TypeScript monorepo (Turborepo) — React 19, React Router v7, SQLite WASM, Vite, Tailwind CSS, Zod
- **Key packages:**
  - `packages/api/src` — all game logic: controllers, routes, scheduler, events, combat resolver, NPC brain
  - `packages/db` — SQLite schema, seeders, migrations (`upgrade-db.ts`)
  - `packages/game-assets/src` — unit data, building data, tribe definitions
  - `packages/types` — shared TypeScript types
  - `apps/web/src` — React frontend: pages, components, hooks
- **NPC brain files:** `packages/api/src/` — look for `npc.ts`, `npc-brain`, `troop-movement-resolver.ts`, `combat-resolver.ts`
- **Event system:** `packages/api/src/events.ts` — all scheduled game events live here
- **Quest system:** look for `quest.ts`, `quest-list.tsx`, `quest-seeder.ts`
- **Hero system:** look for `hero-controllers.ts`, `hero-asset-mapping.ts`, adventure-related files
- **Map/world generation:** look for `tiles-seeder.ts`, `world-items-seeder.ts`, `use-map.ts`
- **Server creation:** look for `create-new-game-world-form.tsx`, server-slug related files
- **Reports system:** look for reports-related controllers, routes, and React pages

---

## PHASE 1 — Server Configuration Defaults & Map Size System

### Goal
Remove the 200×200 map option, make 100×100 the default map, make ×10 the default speed, make Teutons the default tribe, and implement a proper NPC count scaling system tied to map size.

### Pre-implementation checklist
- [ ] Read `create-new-game-world-form.tsx` fully — find every hardcoded map size, speed, and tribe default
- [ ] Read `tiles-seeder.ts` fully — understand how tiles are generated for different map sizes
- [ ] Read `world-items-seeder.ts` fully — understand how NPC villages, oases, and world items are placed
- [ ] Read `npc.ts` and any NPC seeder files — understand how many NPC villages are created and how
- [ ] Search the entire codebase for `200` as a map size value and catalog every occurrence before changing anything
- [ ] Search for any existing map-size-to-NPC-count relationship and document it

### Implementation tasks

#### 1.1 Remove 200×200 map
- Remove `200` from every map size option array in the frontend form and any backend validation
- Do NOT remove any logic that handles map coordinates — only remove it as a selectable option

#### 1.2 Set new defaults
- Default map size: `100`
- Default server speed: `10` (×10)
- Default tribe: `teutons`
- Apply these defaults in the server creation form AND in any backend seeder that falls back to defaults

#### 1.3 Add map size options: 25, 50, 75, 100
- Ensure all four sizes are selectable in the server creation form
- Validate that tile generation, coordinate math, and map rendering work correctly for 25×25 and 50×50 (these are the new small sizes)

#### 1.4 NPC count scaling by map size
Implement a single `getNpcCountForMapSize(mapSize: number): number` utility function in `packages/api/src/utils/` (or extend the existing utils file if one exists there). Use the following scale:

```
25×25  → 3 NPC villages per faction
50×50  → 3 NPC villages per faction
75×75  → 9 NPC villages per faction
100×100 → 9 NPC villages per faction (existing default, do not break)
```

- Replace any hardcoded NPC count in seeders with a call to this function
- Do NOT change the faction count — only the village count per faction

#### 1.5 Verify
- Generate a test server for each map size and confirm tile count, NPC village count, and map rendering are correct
- Confirm no existing tests break

---

## PHASE 2 — Proactive NPC Aggression (All Servers)

### Goal
NPC factions must proactively attack the player's village on a scheduled basis across ALL server types and speeds. Currently NPCs only retaliate. This is a fundamental game behaviour change.

### Pre-implementation checklist
- [ ] Read `npc.ts` fully — understand the entire NPC decision loop
- [ ] Read `events.ts` fully — understand how scheduled events are created and fired
- [ ] Read `combat-resolver.ts` fully — understand the combat resolution pipeline
- [ ] Read `troop-movement-resolver.ts` fully — understand how troop movements are initiated and resolved
- [ ] Search for any existing `attackPlayer`, `initiateAttack`, or proactive aggression logic — if it exists, extend it rather than create a new system
- [ ] Understand how the scheduler (`packages/api/src/scheduler/`) triggers NPC actions

### Implementation tasks

#### 2.1 Aggression scheduler
Add a recurring scheduled event called `npcProactiveAttack` that fires periodically per NPC village. The interval (in real milliseconds divided by server speed) should be:

```
Skirmish / Casual: every 60 minutes of in-game time → ~10% chance to actually send troops
Normal / Standard: every 45 minutes → ~25% chance
Assault / Hard:    every 30 minutes → ~45% chance
Siege / Hardest:   every 20 minutes → ~65% chance
```

If no difficulty level exists on the server model yet, add a `difficulty` field (`'skirmish' | 'assault' | 'siege'`) to the server/world settings table via a migration in `upgrade-db.ts`. Default existing servers to `'assault'`.

#### 2.2 Target selection
- The NPC village selects the player's nearest village as the target
- If the NPC has no troops available (all away or below a minimum threshold), skip the attack for this cycle
- NPC should never send 100% of its troops — cap at 70% of available troops per attack

#### 2.3 Army composition
- Use the NPC's existing troop composition logic (do not invent a new one)
- If the NPC tribe's units are not yet properly seeded (see TODO in `troop-seeder.ts:60`), add a fallback using the tribe's primary infantry and cavalry units

#### 2.4 Faction alliances (Siege difficulty only)
- On `siege` difficulty, if two NPC factions have a combined reputation score above a threshold (or simply by design: the two strongest factions ally), they can coordinate attacks
- Coordinated attack: both factions send troops so they arrive at the player's village within the same 2-minute in-game window
- Store alliance state in the database as a simple `npc_faction_alliances` table: `(faction_a_id, faction_b_id, server_slug, formed_at)`
- On `skirmish` and `assault`, alliances never form

#### 2.5 Reputation system foundation
- Add a `player_faction_reputation` table: `(server_slug, faction_id, reputation_score INTEGER DEFAULT 0)`
- Reputation increases when the player does NOT attack a faction for a full game day
- Reputation decreases by a fixed amount each time the player attacks that faction's village
- Reputation cannot go above `100` or below `-100`
- Design constraint: the game must make it impossible to have good reputation (≥50) with ALL factions simultaneously — when reputation with one faction rises above 70, a rival faction's reputation automatically drops by 15
- This table will be used by Phase 4 (Endgame) to determine which factions defend the World Wonder with the player

#### 2.6 Verify
- Confirm NPCs send attacks on a new server at normal speed
- Confirm they do NOT send attacks during the first 30 real-time minutes (see Phase 3 for Blitz — for standard servers use a shorter grace period of 5 in-game hours)
- Confirm existing retaliation logic is untouched

---

## PHASE 3 — Blitz Mode Server

### Goal
Add a new server type called "Blitz Mode" — a short, intense single-session game on a 25×25 map at 200× speed with three difficulty levels, a 30-minute protection period, a clear win condition (World Wonder Level 20), a Victory/Defeat screen, and a Rematch button.

### Pre-implementation checklist
- [ ] Read the server creation form and backend world-creation logic fully — understand every field that defines a server
- [ ] Read how server speed is applied throughout `events.ts` — every `duration` calculation must scale with speed
- [ ] Read how the protection timer works if it already exists (some Travian clones have beginner protection) — do NOT duplicate it
- [ ] Read all quest and tutorial logic — Blitz Mode should skip or fast-forward any tutorial
- [ ] Read how the game detects a server ending or a player being eliminated

### Implementation tasks

#### 3.1 Blitz Mode server type
Add `game_mode: 'standard' | 'blitz'` to the world/server settings. On creation:
- Force map size to `25`
- Force speed to `200`
- Force NPC count to `3` per faction
- Force faction count to `3` total
- Present the three difficulty options: **Skirmish**, **Assault**, **Siege** (stored as the existing `difficulty` field from Phase 2)

#### 3.2 Starting conditions
For ALL players and NPC villages on a Blitz server:
- All resource fields start at **Level 5** (not Level 1)
- Player starts with **3 settlers** already in the village (ready to found a second village immediately)
- Apply this in the village seeder / world creation logic — do not change standard server seeding

#### 3.3 Protection period
- For 30 real-time minutes from server creation, no NPC sends any attack
- Store `blitz_protection_ends_at: timestamp` in the server settings
- The frontend must show a visible countdown banner: "⚔️ Protection ends in: MM:SS — Prepare your defences!"
- After protection ends, aggression from Phase 2 activates immediately

#### 3.4 Win condition — World Wonder Level 20
The win condition for ALL servers (Blitz and standard) is **World Wonder Level 20** (see Phase 4 for full World Wonder implementation). On a Blitz server specifically:
- The moment any faction (player or NPC) reaches Wonder Level 20, the server ends
- If the player's Wonder reaches 20 → Victory
- If any NPC's Wonder reaches 20 → Defeat

#### 3.5 Elimination
- A player is eliminated if all their villages are conquered
- On Blitz Mode, trigger the Defeat screen immediately upon elimination

#### 3.6 Victory / Defeat screen
Create a full-screen modal/page component `BlitzResultScreen` in `apps/web/src/`:
- Shows "VICTORY" or "DEFEAT" with appropriate styling
- Displays a match summary:
  - Total time played
  - Number of attacks received
  - Number of attacks sent
  - Villages founded
  - Resources pillaged
  - Final Wonder level reached
- Two buttons: **"Play Again — Same Difficulty"** and **"Try Harder"** (increments difficulty by one level)
- "Try Harder" is hidden if already on Siege difficulty
- Both buttons create a new Blitz server with the same settings and navigate the player to it

#### 3.7 Blitz NPC behaviour
- On Blitz, NPCs behave exactly as per Phase 2 but with no grace period after protection ends
- On Siege difficulty: factions 2 and 3 ally against the player; faction 1 allies with the player (defends the Wonder — see Phase 4)
- The allied faction sends resource caravans to the player's Wonder village (see Phase 5 for convoy logic)

#### 3.8 Verify
- Create a Blitz server, verify starting conditions (Level 5 fields, 3 settlers)
- Verify protection timer appears and NPCs do not attack during it
- Verify NPCs attack after 30 minutes
- Verify Victory screen triggers on Wonder Level 20
- Verify Rematch button creates a new server correctly

---

## PHASE 4 — Natar Villages & World Wonder Endgame

### Goal
Add the full Travian-accurate endgame: Natar villages with authentic Natar troops, the Construction Plan item, the World Wonder building that goes to Level 20 (win condition for all servers), NPC factions competing to build their own Wonder, and allied factions defending the player's Wonder.

### Pre-implementation checklist
- [ ] Read `units.ts` and `packages/game-assets/src/` fully — find where Natar units are defined (the TODO in `units.ts:1095` says they exist but costs/times are unset). You MUST complete them
- [ ] Read `packages/game-assets/src/` for building definitions — check if `World Wonder` or `Wonder of the World` already exists as a building type. If it does, extend it. If not, add it.
- [ ] Read `treasury-artifacts.tsx` — the entire artifacts system is commented out. Read what was intended before implementing the Construction Plan item
- [ ] Read `troop-seeder.ts` lines 60–65 — the TODOs about NPC village sizes and unit seeding. These MUST be resolved as part of this phase
- [ ] Read `world-items-seeder.ts` — understand how special tiles and villages are placed
- [ ] Read `combat-resolver.ts` fully — Natar combat must use the same resolver as all other combat
- [ ] Read `npc.ts` — Natar villages are a special NPC type; understand how to distinguish them

### Implementation tasks

#### 4.1 Complete Natar unit data
In `packages/game-assets/src/units.ts`, complete the cost and recruitment time for all Natar units. Use these **exact Travian-accurate values** (speed is tiles/hour divided by server speed):

| Unit | Attack | Defence (inf) | Defence (cav) | Speed | Cost (Lumber/Clay/Iron/Crop) | Training time (base) |
|------|--------|---------------|----------------|-------|-------------------------------|----------------------|
| Pikeman | 20 | 35 | 60 | 5 | 40/60/20/40 | 00:46:40 |
| Thorned Warrior | 65 | 30 | 10 | 6 | 70/40/60/20 | 01:00:00 |
| Guardsman | 100 | 40 | 20 | 7 | 120/100/150/60 | 01:46:40 |
| Bird of Prey | 60 | 55 | 70 | 9 | 80/60/90/30 | 01:20:00 |
| Axerider | 155 | 80 | 50 | 10 | 170/150/20/40 | 02:20:00 |
| Natarian Knight | 250 | 140 | 200 | 10 | 350/330/250/80 | 04:00:00 |
| War Elephant | 600 | 440 | 520 | 7 | 1200/1000/800/500 | 10:00:00 |
| Ballista | 60 | 10 | 10 | 3 | 330/250/400/100 | 06:40:00 |
| Natarian Emperor | 200 | 80 | 80 | 7 | 0/0/0/0 | N/A (not trainable) |

Natar units are **not trainable by the player**. Mark them as `playable: false` in the unit definition.

#### 4.2 Natar village seeding
- A Natar village is seeded as a special NPC village with `tribe: 'natars'` and `village_type: 'natar_wonder_guardian'`
- **Number of Natar villages per map:**
  - 25×25: 1 Natar village
  - 50×50: 2 Natar villages
  - 75×75: 3 Natar villages
  - 100×100: 4 Natar villages
- Each Natar village is placed at a **random non-center tile** at minimum 30% of the map radius away from the edge
- Natar villages have pre-seeded troops that **scale with server speed**: `baseGarrison * (1 + serverSpeed / 100)`, capped at a reasonable maximum per unit type
- Natar villages **do not attack the player proactively** — they are passive defenders until attacked
- Natar villages **do not expand** and do not build anything
- Each Natar village holds **one Construction Plan** item (see 4.3)

#### 4.3 Construction Plan item
- Add `'construction_plan'` as a hero item type in the item/artifact system
- The item is obtained by attacking a Natar village with your Hero and winning the combat
- On a successful attack where the Hero survives:
  - Remove the Construction Plan from the Natar village
  - Add it to the player's Hero inventory
  - Generate a report of type `'construction_plan_obtained'`
- The player can only hold **one Construction Plan** at a time
- The Construction Plan is consumed when the World Wonder reaches Level 1 (used to start construction)
- Prerequisite to use: the player must have a **Treasury building at Level 10** in the village where they want to build the Wonder

#### 4.4 World Wonder building
- Add `'world_wonder'` as a special building type in `packages/game-assets/src/buildings.ts` (or the equivalent building definitions file — read it first)
- It can only be built in a village that holds a Construction Plan AND has a Level 10 Treasury
- Maximum level: **20** (win condition for all servers)
- Resource costs per level follow this formula: `baseCost * level^2.5` where baseCost is `{lumber: 50000, clay: 50000, iron: 50000, crop: 50000}` at Level 1
  - Level 1: ~50,000 each
  - Level 10: ~1,581,000 each
  - Level 20: ~8,944,000 each
  - These numbers are intentionally large — at 200× speed they are still achievable
- Build time per level: `baseTime * level` where baseTime is `3600 seconds / serverSpeed`
- Only **one World Wonder per player** is allowed
- Only **one World Wonder per faction** (NPC factions included) is allowed

#### 4.5 NPC factions competing for the Wonder
- Each NPC faction also attempts to obtain a Construction Plan by attacking a Natar village
- NPC factions use the existing combat system — no special logic needed
- Once an NPC faction obtains a Construction Plan, it designates its strongest village as the Wonder village and begins upgrading
- NPC Wonder upgrade speed is the same as the player's (uses the same building event system)

#### 4.6 Report: NPC Wonder milestone
- When any NPC faction's Wonder reaches **Level 10**, generate a report for the player of type `'npc_wonder_milestone'`
- Report text: `"[Faction Name] has completed Wonder of the World Level 10. The endgame has begun."`
- This report appears in the existing Reports page

#### 4.7 Allied faction defence
- Factions where `player_faction_reputation >= 50` (from Phase 2) are **allies**
- Allied factions will:
  - Send defending troops to the player's Wonder village when it is under attack (triggered by the same attack-incoming event that fires the existing warning)
  - Send resource caravans to the player's Wonder village every few in-game hours (uses Phase 5 convoy system)
- Factions where `player_faction_reputation < 50` will attack the Wonder village using Phase 2 aggression, with frequency increased by 30% after the Wonder reaches Level 5
- Game balance constraint (enforced at the reputation table level): it is impossible to have reputation ≥50 with more than 3 factions at once on a 9-faction server, and more than 1 on a 3-faction server. Enforce this via the rival reputation drop mechanic from Phase 2.

#### 4.8 Verify
- Confirm Natar villages are seeded correctly on each map size
- Confirm attacking a Natar village with Hero awards Construction Plan on victory
- Confirm Wonder building appears in Treasury village after plan is used
- Confirm Wonder upgrade cost and time scale correctly
- Confirm NPC factions also try to build Wonders
- Confirm ally factions send troops to defend Wonder when attacked
- Confirm win condition triggers Victory screen at Level 20

---

## PHASE 5 — Resource Convoy Raids & Village Morale

### Goal
Add two interactivity systems: (1) visible resource convoys on the map that the player can intercept to steal resources; (2) a village morale system that gives small bonuses/penalties based on recent combat outcomes.

### Pre-implementation checklist
- [ ] Read `troop-movement-resolver.ts` fully — convoys are a new movement type and must go through the same resolver
- [ ] Read `events.ts` — convoy delivery must be a scheduled event
- [ ] Read `use-map.ts` — understand how the map renders movement icons, and whether a "moving cart" concept already exists
- [ ] Read `combat-resolver.ts` — intercepting a convoy is a combat event; check if any "intercept" logic already exists
- [ ] Search the entire codebase for any existing "caravan", "convoy", or "merchant" implementation before building this

### Implementation tasks

#### 5.1 NPC resource convoys
- When an NPC faction has surplus resources (above a threshold), it creates a convoy movement from one of its villages to another (or to its Wonder village in Phase 4)
- A convoy is a new `movement_type: 'convoy'` in the troop movement table
- Convoys carry troops: a small escort (20% of available light infantry) plus the resource payload
- Convoy speed: same as the escort troops' movement speed
- Convoys travel on the map and are **visible to the player** as a distinct map icon (a cart/wagon)

#### 5.2 Interception
- The player can click a convoy icon on the map and select "Intercept" — this opens the Rally Point attack form pre-filled with the convoy's current projected position
- If the player's troops arrive at the convoy's tile before the convoy reaches its destination, combat is resolved using the existing combat system
- On player victory: the resource payload is added to the player's carrying troops and returned home
- On player defeat: convoy continues to destination
- If the convoy reaches its destination before the player's troops arrive, the intercept attempt fails silently (troops return home)

#### 5.3 Allied faction convoys to Wonder village
- After Phase 4 is implemented: allied factions (reputation ≥50) also send convoys to the player's Wonder village as aid
- These convoys use the same system but have `convoy_type: 'allied_aid'` — the player does NOT attack these; they arrive automatically and add resources to the Wonder village

#### 5.4 Village morale system
- Add a `village_morale` field to the villages table: `INTEGER DEFAULT 100` (range: 0–150)
- Morale changes after every combat event involving that village:
  - Successful defence: +15 morale
  - Failed defence (attacker wins): -20 morale
  - Successful attack launched: +5 morale
  - Failed attack (attacker loses): -10 morale
- Morale drifts back toward 100 at a rate of +2 per in-game hour (handled by the scheduler)
- Effects:
  - Morale > 110 ("High Morale"): +5% defence bonus for troops stationed in this village
  - Morale < 80 ("Low Morale"): -10% crop consumption to represent reduced garrison, AND resource production -5%
  - Morale < 50 ("Broken Morale"): -20% resource production
- Display the current morale status in the village overview page — a simple coloured indicator (green / yellow / red) with a tooltip explaining the effect
- Do NOT show a numeric morale value to the player — only the status label

#### 5.5 Verify
- Confirm convoys appear on the map between NPC villages
- Confirm interception opens the attack form with correct pre-fill
- Confirm resource transfer on successful intercept
- Confirm morale updates after each combat event
- Confirm morale effects apply to combat resolution and resource production

---

## PHASE 6 — Daily Quests & Server Age Pressure

### Goal
Add a rotating daily quest system and a server age escalation system that makes the game progressively harder the longer it runs.

### Pre-implementation checklist
- [ ] Read `quest.ts`, `quest-seeder.ts`, and `quest-list.tsx` **fully and carefully** — a quest system already exists. You MUST understand it completely before adding anything. Do NOT create a parallel quest system. Extend the existing one.
- [ ] Read `quest-list.tsx:41` — there is a TODO about hero item rewards. Understand what was planned.
- [ ] Read the scheduler — understand how timed resets can be scheduled
- [ ] Search for any existing `daily_quest` or `quest_type` distinctions in the codebase

### Implementation tasks

#### 6.1 Daily quest pool
- Add a new `quest_category: 'daily'` to the existing quest system (do not add a new system)
- Add a `daily_quest_reset_at: timestamp` to the server/player settings
- Every 24 real-time hours (scaled by server speed — so on a 200× server, every `24h / 200 = 7.2 minutes`), 3 daily quests are randomly selected from the pool and assigned to the player
- Daily quests expire at the next reset whether completed or not

#### 6.2 Daily quest pool (content)
Add these quest types to the existing quest definitions pool:

| Quest ID | Description | Reward |
|----------|-------------|--------|
| `daily_train_troops_50` | Train 50 troops in a single day | 5,000 of each resource |
| `daily_raid_3_villages` | Successfully raid any 3 villages | 3,000 iron + 3,000 lumber |
| `daily_upgrade_resource_field` | Upgrade any resource field | 2,000 crop |
| `daily_upgrade_building` | Upgrade any building | 2,000 clay |
| `daily_send_hero_adventure` | Send Hero on an adventure | 1 random hero item |
| `daily_defend_attack` | Successfully defend against 1 incoming attack | 5,000 crop |
| `daily_scout_village` | Scout any enemy village | 1,000 of each resource |
| `daily_collect_oasis` | Collect resources from an oasis | 3,000 lumber |

#### 6.3 Server Age Pressure
- Add a `server_age_escalation_level: INTEGER DEFAULT 0` to the server settings
- Every 24 real-time hours after server start (every `24h / serverSpeed` real milliseconds), the escalation level increments by 1
- For each escalation level, apply the following cumulative modifiers to ALL NPC villages:
  - Attack frequency multiplier: `+5% per level` (stacks, so level 5 = 25% more frequent attacks)
  - NPC troop regeneration speed: `+3% per level`
  - Maximum escalation level: `20` (at level 20, NPCs are at 100% increased frequency — double their base rate)
- Display the current escalation level to the player as a "Threat Level" indicator in the server header: 🟢 (0–4), 🟡 (5–9), 🟠 (10–14), 🔴 (15–20)
- On Blitz Mode: escalation increments every 10 real-time minutes instead of 24 hours

#### 6.4 Verify
- Confirm 3 daily quests appear and reset on schedule
- Confirm quest rewards are delivered to the player on completion
- Confirm no existing quests are broken
- Confirm escalation level increments on schedule
- Confirm NPC attack frequency visibly increases at higher escalation levels
- Confirm Threat Level indicator displays correctly in the UI

---

## PHASE 7 — Extra Builder Hero Item & Hall of Fame

### Goal
Add the "Extra Builder" consumable hero item that permanently grants an additional building queue slot. Add a persistent Hall of Fame page that records top players across all completed servers.

### Pre-implementation checklist
- [ ] Read `hero-controllers.ts` fully — understand the hero item system end to end
- [ ] Read `use-has-available-building-queue-slot.ts` — there is a known TODO about raising the queue slot count to 5 after a bug fix. Understand the current limit logic.
- [ ] Read `construction-queue.tsx` — understand how the building queue limit is enforced in the UI
- [ ] Read `treasury-artifacts.tsx` — understand the artifact/item display system (currently commented out)
- [ ] Search for any existing "extra builder" or "master builder" item in the codebase before adding one
- [ ] Understand how hero items are stored, awarded from adventures, and consumed

### Implementation tasks

#### 7.1 Extra Builder hero item
- Add a new hero item type: `'extra_builder'`
- Item properties:
  - `consumable: true` — using it removes it from inventory permanently
  - `stackable: false` — the player can hold multiple but each use adds one builder
  - `max_builders_cap: 5` — a player can never exceed 5 concurrent building slots regardless of how many items are used
- When the player uses this item:
  - Increment `player_building_slots: INTEGER` on the player/village settings (add this column if it does not exist, default `1`)
  - This value replaces the hardcoded slot limit in `use-has-available-building-queue-slot.ts`
  - Remove the item from the hero inventory
  - Generate a report: `"Master Builder joined your village. You can now construct [N] buildings simultaneously."`
- The item can be won from hero adventures (add it to the adventure reward pool with a low drop rate — approximately 5% chance per adventure)
- Display the current builder count in the construction queue UI next to the queue slots

#### 7.2 Hall of Fame
- Add a `hall_of_fame` table: `(id, server_slug, server_end_date, category, player_name, tribe, value, rank)`
- Categories recorded at server end:
  - `'top_score_1'`, `'top_score_2'`, `'top_score_3'` — top 3 players by final score
  - `'most_raids'` — player with the most successful raids
  - `'best_defence'` — player with the highest defence points
  - `'wonder_builder'` — player who reached Wonder Level 20 (the winner)
- Populate this table when a server ends (when win condition is triggered or server is manually closed)
- Add a public `/hall-of-fame` page in the React app that:
  - Lists all completed servers, newest first
  - For each server, shows the category winners in a clean table
  - No login required to view this page
  - The winner's tribe icon is shown next to their name

#### 7.3 Verify
- Confirm Extra Builder item appears in hero adventure rewards
- Confirm using the item increments the building queue slot count
- Confirm the slot count cap of 5 is enforced
- Confirm Hall of Fame is populated when a server ends
- Confirm the Hall of Fame page loads and displays historical data correctly

---

## General Agent Rules (Apply to Every Phase)

1. **Read before you write.** Before modifying any file, read it completely. Before creating any new file, search for a file that already does the same thing.
2. **No duplicate systems.** If a system exists even partially, extend it. Creating a second quest system, a second NPC attack system, or a second convoy system will break the game.
3. **Database migrations only via `upgrade-db.ts`.** Never modify the base schema SQL directly for live columns. Add new columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in the existing migration pattern.
4. **Preserve existing tests.** Run the test suite after every phase. If tests fail, fix them before moving to the next phase.
5. **TypeScript types first.** When adding a new concept (e.g., `difficulty`, `morale`, `convoy_type`), define the type in `packages/types/` first, then use it everywhere.
6. **Zod validation.** Any new API route input or output must have a Zod schema. Follow the existing route pattern in `packages/api/src/routes/`.
7. **No `as any` or `as unknown` unless strictly unavoidable.** If the existing code uses it, do not propagate it into new code.
8. **One phase at a time.** Complete and verify each phase fully before starting the next. Do not mix implementation across phases in a single commit.
9. **Commit message format:** `feat(phase-N): brief description` — e.g., `feat(phase-1): add map size scaling and remove 200x200 option`
10. **When in doubt, ask.** If a design decision is ambiguous or two approaches seem equally valid, stop and ask the project owner before implementing.
