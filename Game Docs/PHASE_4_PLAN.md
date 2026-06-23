# Phase 4 — Natar Villages & World Wonder Endgame
## Implementation Plan

> **Status:** Planning only — no code changes yet.
> **Scope:** Complete the remaining Phase 4 tasks (Natar unit data is already done).
> **Vanilla deviation:** Our World Wonder goes to **Level 20** (not 100) and is the win condition for **all** servers (Blitz + standard). Only 1–4 Natar villages per map (not 14 WW villages). Construction Plans are obtained by attacking Natar villages with a Hero (not spawned by the server).

---

## 0. Pre-Implementation Notes (from research)

### 0.1 Natars (lore + data)
- **Tribe:** `'natars'` already exists in `packages/types/src/models/tribe.ts` → `NPC_ONLY_TRIBES = ['nature','natars']`. Tribe infra already present: `NATAR_WALL` building, `TRIBE_TROOP_TIERS.natars`, `TRIBE_COLORS.natars`.
- **Units (all done in Phase 4 partial):** Pikeman, Thorned Warrior, Guardsman, Bird of Prey (scout), Axerider, Natarian Knight, War Elephant, Ballista, Natarian Emperor. All marked `playable: false`. IDs `WAR_ELEPHANT`, `BALLISTA`, `NATARIAN_EMPEROR` were added.
- **Vanilla T4 behaviour (for reference):** Natars are passive defenders. They hold WW villages (8 outside grey area + 6 inside + capital at 0|0). After a delay they build their own WW; at level 75 they recall all forces to defend it. Natars periodically scout every village on the server.
- **Our adaptation:** Natar villages are passive. They each hold exactly one Construction Plan. They do **not** build their own WW in our version (NPC *factions* compete to build Wonders instead — see §5). Natars do not scout the server (out of scope; can be a future enhancement).

### 0.2 World Wonder (vanilla T4 reference)
- Vanilla: level 100 win condition, huge costs, no walls/residence, no gold, 2 levels queueable, 50% faster build, 50% crop consumption after plans appear, unconquerable after level 1, Natars recall at their WW lvl 75.
- **Our adaptation:** level 20 win condition; cost formula `baseCost * level^2.5` with `baseCost = {lumber:50000, clay:50000, iron:50000, crop:50000}`; build time `3600s * level / serverSpeed`; one WW per player and per NPC faction; requires Construction Plan + Treasury lvl 10 in the village; plan consumed at WW Level 1.

### 0.3 Available assets — FULL INVENTORY

Assets are spread across two source folders:
- **`NOT NEEDED/`** — the T4.6 web Gpack (browser-game assets, JPG/PNG, ready to use)
- **`Unity Assets For hero/`** — the Unity mobile client export (spritesheet atlases + JSON rect data + C# data models + individual PNGs)

The canonical, most-complete Unity export is at:
`Unity Assets For hero\Hero\3rd try\Assets\` (mirrored in `Try 2 27\Assets\`).

#### 0.3.1 Natar unit sprites (ALL 9 combat units + settler) ✅ FOUND

**Spritesheet atlas** — all 10 Natar unit sprites packed into one atlas:
- **Atlas JSON:** `Unity Assets For hero\Hero\3rd try\Assets\TLMobile\SpriteAtlases\Units\UnitsNatars.json`
- **Atlas JSON (alt AssetRipper format):** `Unity Assets For hero\Hero\3rd try\Assets\SpriteAtlas\UnitsNatars.json` (PathID=1 references)
- **Atlas textures (crunched, 10 pages of 1024×1024):** `Unity Assets For hero\Hero\3rd try\Assets\Texture2D\sactx-{0..9}-1024x1024-Crunch-UnitsNatars-8f9a0b58.png`

**Sprite name → index → our unit ID mapping** (from `m_PackedSpriteNamesToIndex`):
| Index | Sprite name | Our unit ID |
|-------|-------------|-------------|
| 0 | `settlers` | (Natarian Settler — not in combat) |
| 1 | `natarian-emperor` | NATARIAN_EMPEROR |
| 2 | `guardsman` | GUARDSMAN |
| 3 | `birds-of-prey` | BIRD_OF_PREY |
| 4 | `pikeman` | PIKEMAN |
| 5 | `war-elephant` | WAR_ELEPHANT |
| 6 | `ballista` | BALLISTA |
| 7 | `natarian-knight` | NATARIAN_KNIGHT |
| 8 | `thorned-warrior` | THORNED_WARRIOR |
| 9 | `axerider` | AXERIDER |

Each sprite has a full 1024×1024 texture rect (one texture page per unit — they are high-res individual illustrations, not packed into a single small sheet). The crunched PNGs need decoding; alternatively, use the pre-extracted individual PNGs below.

**Pre-extracted individual PNGs** (ready to use, no decoding) — at:
`Unity Assets For hero\UnityDataAssetPack\New folder (5)\Sprite\`
| File | Size | Type |
|------|------|------|
| `ic_n_natarianEmperor.png` | 4.7 KB | Small icon |
| `ic_n_natarianKnight.png` | 4.6 KB | Small icon |
| `ic_n_natarianSettler.png` | 3.3 KB | Small icon |
| `natarian-emperor.png` | 90.8 KB | Large illustration |
| `natarian-knight.png` | 92.3 KB | Large illustration |
| `natar_hero.png` | 173.6 KB | Hero portrait |

> ⚠️ **Only 3 of 9 combat units have pre-extracted individual PNGs** (Emperor, Knight, Settler). The remaining 6 (Pikeman, Thorned Warrior, Guardsman, Bird of Prey, Axerider, War Elephant, Ballista) exist only inside the crunched spritesheet atlas and must be extracted using the JSON rect data, OR we fall back to the web Gpack tribe badge.(User Comment: they should be extracted never fall back to tribe badge.)

**Web Gpack fallback (T4.6):** `NOT NEEDED\scripts\Travian-T4.6-Gpack\mainPage\img_ltr\units\natar\icon\natar.png` — a single generic Natar tribe badge (used by the existing `NATAR_UNIT_MAP` in `troop-icons.ts`).

**Individual sprite JSON definitions** (with rect data) — at `Unity Assets For hero\Hero\3rd try\Assets\Sprite\`:
`ic_n_natarianEmperor.json`, `ic_n_natarianEmperor_0.json`, `ic_n_natarianKnight.json`, `ic_n_natarianKnight_0.json`, `ic_n_natarianSettler.json`, `ic_n_natarianSettler_0.json`, `ic_n_natarianSettler_1.json`, `natarian-emperor.json`, `natarian-knight.json`, `natar_hero.json`, `ic_report_natar.json` (report tribe icon).

**Icon strategy for the 6 missing unit PNGs:** Two options —
1. **(Recommended)** Extract from the crunched atlas using the JSON rect data (`m_TextureRect` fields in `UnitsNatars.json` give exact x/y/width/height for each sprite). Gives all 9 unit illustrations at full quality.
2. **(Fallback)** Use the existing `NATAR_UNIT_MAP` tribe-badge approach (single `natar.png` for all Natar units) — already implemented in `troop-icons.ts`. Acceptable for icons, not for detailed views. (user comment: NOT ACCEPTED fallback)

#### 0.3.2 Natar building icons (ALL 38 buildings incl. World Wonder) ✅ FOUND

**Spritesheet atlas** — 38 Natar building icons in one 2048×2048 atlas:
- **Atlas JSON:** `Unity Assets For hero\Hero\3rd try\Assets\TLMobile\SpriteAtlases\Icons\Buildings\IconsBuildings_Natars.json`
- **Atlas textures:** `Unity Assets For hero\Hero\3rd try\Assets\Texture2D\sactx-0-2048x2048-Crunch-IconsBuildings_Natars-916e5edc.png` (+ `_0.png` variant)

**All 38 building icon names** (from `m_PackedSpriteNamesToIndex`):
| # | Icon name | Building |
|---|-----------|----------|
| 0 | `ic_n_main building` | Main Building |
| 1 | `ic_n_stable` | Stable |
| 2 | `ic_n_barracks` | Barracks |
| 3 | `ic_n_residence` | Residence |
| 4 | `ic_n_great stable` | Great Stable |
| 5 | `ic_n_backery` | Bakery |
| 6 | `ic_n_palace_simulator` | Palace (sim) |
| 7 | `ic_n_great barracks` | Great Barracks |
| 8 | `ic_n_academy` | Academy |
| 9 | `ic_n_hospital` | Hospital |
| 10 | `ic_n_trade office` | Trade Office |
| 11 | `ic_n_granary` | Granary |
| 12 | `ic_n_harbor` | Harbor |
| 13 | `ic_n_rally point` | Rally Point |
| 14 | `ic_n_palace` | Palace |
| 15 | `ic_n_great granary` | Great Granary |
| 16 | `ic_n_stonemason's lodge` | Stonemason's Lodge |
| 17 | `ic_n_Brickyard` | Brickyard |
| 18 | `ic_n_workshop` | Workshop |
| 19 | `ic_n_embassy` | Embassy |
| 20 | `ic_n_warehouse` | Warehouse |
| 21 | `ic_n_grain mill` | Grain Mill |
| 22 | `ic_n_city wall` | City Wall (NATAR_WALL) |
| 23 | **`ic_n_WoW`** | **World Wonder** ⭐ |
| 24 | `ic_n_horse drinking trough` | Horse Drinking Trough |
| 25 | `ic_n_smithy` | Smithy |
| 26 | `ic_n_sawmil` | Sawmill |
| 27 | `ic_n_stonemason's lodge_simulator` | Stonemason's Lodge (sim) |
| 28 | `ic_n_wall` | Wall |
| 29 | `ic_n_townhall` | Town Hall |
| 30 | `ic_n_hero mansion` | Hero Mansion |
| 31 | `ic_n_wall_simulator` | Wall (sim) |
| 32 | `ic_n_marketplace` | Marketplace |
| 33 | `ic_n_cranny` | Cranny |
| 34 | `ic_n_great warehouse` | Great Warehouse |
| 35 | `ic_n_tornament square` | Tournament Square |
| 36 | `ic_n_iron foundry` | Iron Foundry |
| 37 | `ic_n_treasury` | Treasury ⭐ |

> ⭐ **`ic_n_WoW` (index 23) is the official World Wonder building icon.** Its `m_TextureRect` in the atlas JSON is `{x:1550, y:261, w:248.9, h:253.9}` (≈249×254 px region within the 2048×2048 atlas). Use this for the WW building card.
> ⭐ **`ic_n_treasury` (index 37)** — the Treasury icon, needed for the Construction Plan hosting UI.

**Illustration sprites (Natar buildings):** Additional illustration JSONs at `Unity Assets For hero\Hero\3rd try\Assets\Sprite\`: `ic_illu_natar_palace.json`, `ic_illu_natar_stonemason.json`, `ic_illu_natar_wall.json`, `ic_illu_natarian_horn.json`.

#### 0.3.3 World Wonder building illustrations (per-tribe, day + night) ✅ FOUND

The WW building (`g40`) has **per-tribe illustrations** at multiple construction stages, with **day and night variants**. Vanilla goes to level 100 (stages at 0/20/40/60/80); our version maxes at level 20.

**Canonical per-tribe folder:** `Unity Assets For hero\Hero\3rd try\Assets\TLMobile\Textures\Illustarations\Buildings\{Tribe}\`

**Tribes available:** Egyptians, Gauls, Huns, Romans, Spartan, Teutons (6 tribes; no separate "Natars" WW illustration — the Natars' own WW uses the generic set or the `ic_n_WoW` icon).

**File naming — LTR tribes (Egyptians/Gauls/Huns/Romans/Teutons):**
| File | Vanilla stage | Our level mapping (max 20) |
|------|--------------|----------------------------|
| `g40-ltr.png` | Base icon / level 0 | Level 0 (empty slot) / detail view |
| `g40_0-ltr.png` | Stage 0 (foundation) | Level 1–4 |
| `g40_20-ltr.png` | Stage at ~lvl 20 | Level 5–9 |
| `g40_40-ltr.png` | Stage at ~lvl 40 | Level 10–14 |
| `g40_60-ltr.png` | Stage at ~lvl 60 | Level 15–19 |
| `g40_80-ltr.png` | Stage at ~lvl 80 | Level 20 (complete) |

**Spartan naming (different pattern — numbered stages):**
| File | Our level mapping |
|------|-------------------|
| `g40.png` | Base / detail |
| `g40_3.png` | Level 1–4 |
| `g40_5.png` | Level 5–8 |
| `g40_7.png` | Level 9–12 |
| `g40_9.png` | Level 13–16 |
| `g40_11.png` | Level 17–20 |

**Night theme variants** exist for every day variant (e.g. `g40_3_night.png`, `g40_night.png`, etc.) — located in `UnityDataAssetPack\New folder (5)\Sprite\` and `New folder (6)\Sprite\`.

**Pre-extracted individual WW PNGs (ready to use):** `Unity Assets For hero\UnityDataAssetPack\New folder (5)\Sprite\` contains all `g40*.png` and `g40*_night.png` pre-extracted. The `#NNNN`-suffixed files are duplicate exports — use the non-suffixed ones.

**Web Gpack WW art (T4.6, ready to use):** `NOT NEEDED\Gpack\367\img_ltr\themes\default\buildings\{tribe}\g40_0.png` through `g40_5.png` (6 stages per tribe, day theme only) + `NOT NEEDED\Gpack\367\img_ltr\global\buildings\{tribe}\big\g40.png` (big icon).

**Our stage → level mapping** (since our WW max is 20, not 100):
```
Level 0 (empty)     → g40-ltr.png        (base icon)
Level 1–4           → g40_0-ltr.png      (foundation)
Level 5–9           → g40_20-ltr.png     (early construction)
Level 10–14         → g40_40-ltr.png     (mid construction)
Level 15–19         → g40_60-ltr.png     (late construction)
Level 20 (complete) → g40_80-ltr.png     (near-complete) OR g40-ltr.png (full)
```

#### 0.3.4 Natar village & landscape art ✅ FOUND

| Asset | Path | Use |
|---|---|---|
| Natar village landscape | `Unity Assets For hero\Hero\3rd try\Assets\Sprite\art_Landscape_village_natar.json` (+ `.png` in folder 5) | Map village detail view |
| Natar village header (wilderness) | `Unity Assets For hero\Hero\3rd try\Assets\Sprite\art_header_wilderness_natarvillage.json` (+ `_0` + `.png` in folder 5) | Natar village card / adventure header |
| Natar village (web Gpack) | `NOT NEEDED\Gpack\367\img_ltr\legacy\views\map\detailView\village\villageNatar.jpg` | Map detail (web) |
| Natar village (T4.6 Gpack) | `NOT NEEDED\scripts\Travian-T4.6-Gpack\mainPage\img_ltr\g\detail.popup\landscape\villageNatar.jpg` | Map detail (T4.6 web) |
| Natar tribe badge (medium) | `NOT NEEDED\Gpack\367\img_ltr\global\tribes\natar_medium.png` | UI tribe badge |
| Natar tribe badge (small) | `NOT NEEDED\Gpack\367\img_ltr\global\tribes\natar_small.png` | UI tribe badge (small) |
| Natar report tribe icon | `NOT NEEDED\Gpack\367\img_ltr\legacy\views\report\tribes\natar.png` | Report header icon |
| Combat sim tribe icon | `NOT NEEDED\Gpack\367\img_ltr\legacy\views\combatSimulator\tribes\natar.png` (+ `natar_inactive.png`) | Combat simulator |
| Natar player profile bg | `NOT NEEDED\Gpack\367\img_ltr\views\PlayerProfile\playerProfileBackground_natar.jpg` | Profile background |

#### 0.3.5 Endgame system message art ✅ FOUND

| Asset | Path | Use |
|---|---|---|
| Construction Plans spawned | `NOT NEEDED\Gpack\367\img_ltr\legacy\views\systemMessage\constructionPlansSpawned\constructionPlansBackground.jpg` | "Plans available" system message bg |
| Natars won (header) | `NOT NEEDED\Gpack\367\img_ltr\legacy\views\systemMessage\gameEnded\vanilla\header_natarsWon.jpg` | Defeat screen header |
| Natars started building WW | `Unity Assets For hero\UnityDataAssetPack\New folder (5)\Sprite\natars_started_build_ww.png` (142 KB) | "Natars started WW" system message |
| World ended — Natars won | `Unity Assets For hero\UnityDataAssetPack\New folder (5)\Sprite\world_has_ended_natars.png` (156 KB) | Defeat screen art |
| Natar hero portrait | `Unity Assets For hero\UnityDataAssetPack\New folder (5)\Sprite\natar_hero.png` (174 KB) | Natar hero portrait |

#### 0.3.6 Endgame UI prefabs (3D scene models) ✅ FOUND

| Asset | Path | Use |
|---|---|---|
| NatarsWWInfoboxMessage prefab | `Unity Assets For hero\Hero\3rd try\Assets\PrefabHierarchyObject\14_NatarsWWInfoboxMessage.glb` | 3D scene model for Natars WW infobox |
| WorldEndNatarsWonNotification prefab | `Unity Assets For hero\Hero\3rd try\Assets\PrefabHierarchyObject\WorldEndNatarsWonNotification.glb` | 3D scene model for Natars-won notification |

#### 0.3.7 Official Travian data models (from C# decompiled source) ✅ FOUND

These are the **official GraphQL data models** from the Travian mobile client. They define the exact field structure the real game uses — mirror them in our TypeScript types.

**WoW (the World Wonder building instance)** — `WoWDTO.cs`:
```csharp
public class WoWDTO {
    public string name;                    // Custom player-given name (max 25 chars)
    public string cannotBeUpgradedReason;  // null if upgradeable; reason string if blocked
}
```
→ Our `world_wonders` table should include `name TEXT` (max 25 chars) and a derived `cannot_be_upgraded_reason`.

**WonderOfWorldStatEntry (WW leaderboard entry)** — `WonderOfWorldStatEntry.cs`:
```csharp
public class WonderOfWorldStatEntry {
    public int level;              // current WW level
    public Village village;        // the village holding the WW
    public int? lastAttackAt;      // timestamp of last attack on this WW (nullable)
    public int? nextAttackAt;      // timestamp of next scheduled Natar attack (nullable)
    public string wwName;          // custom WW name
}
```
→ This is the **WW statistics/leaderboard model**. Our `world_wonders` table should include `last_attack_at` and `next_attack_at` for the Natar-attack scheduling feature.

**NatarsWWInfoboxMessageType (Natar WW progress notification states)** — `NatarsWWInfoboxMessageType.cs`:
```csharp
public enum NatarsWWInfoboxMessageType {
    STARTED = 0,    // Natars have started building their WW
    NO_ATTACK = 1,  // Natars are not attacking player WWs (recall phase)
    FINISHED = 2    // Natars have finished their WW (game over)
}
```
→ Maps to our `'npc_wonder_milestone'` report type. Use `STARTED` for "NPC began WW", `NO_ATTACK` for "NPC WW past recall threshold", `FINISHED` for "NPC WW reached 20".

**WorldEndPlayerWonNotification (Victory screen data)** — `WorldEndPlayerWonNotification.cs`:
```csharp
public class WorldEndPlayerWonNotification {
    public List<Player> topPlayers;     // top 3 players by score
    public Player topAttacker;          // #1 attacker
    public Player topDefender;          // #1 defender
    public int worldEndTime;            // timestamp the server ended
    public Tribe tribe;                 // winner's tribe
    public Village village;             // winner's WW village
    public Player player;               // the winner
    public Alliance alliance;           // winner's alliance
    public List<int> topPlayersIds;
}
```
→ **Victory screen data model**. Our `endServer` response should return similar fields. `topAttacker` / `topDefender` feed into Phase 7's Hall of Fame.

**WorldEndNatarsWonNotification (Defeat screen data)** — `WorldEndNatarsWonNotification.cs`:
```csharp
public class WorldEndNatarsWonNotification {
    public List<Player> topPlayers;     // top 3 players (still ranked even though Natars won)
    public Player topAttacker;
    public Player topDefender;
    public int worldEndTime;
    public List<int> topPlayersIds;
    // No tribe/village/player/alliance — because Natars won, not a player
}
```
→ Defeat screen model — same stats but no winner player data.

**ChangeWoWName** — `RestAPI\Game\Model\ChangeWoWName.cs`: REST API model for renaming the WW. → We need a `PATCH /api/villages/:villageId/world-wonder/name` route.

**WonderOfTheWorldWindowController** — `WoWWindow\WonderOfTheWorldWindowController.cs`:
- Extends `BuildingDetailWindowController`
- `wowName` field (max 25 chars, `MaxStringLength = 25`)
- `SaveNameChange()` method (`[UICallable]`)
- Listens to `CurrentVillageChanged` to load the WW data for the current village

**StatisticsWonderOfTheWorldTabController** — `Windows\Statistics\StatisticsWonderOfTheWorldTabController.cs`: A statistics tab showing all WW entries (the leaderboard). → Add a WW statistics/leaderboard view showing all WWs on the server (player + NPC factions) with their levels.

#### 0.3.8 Asset import plan (which files to copy where)

| Source | Destination | Files |
|---|---|---|
| `UnityDataAssetPack\New folder (5)\Sprite\` | `apps/web/app/components/icons/natar-units/` | `ic_n_natarianEmperor.png`, `ic_n_natarianKnight.png`, `ic_n_natarianSettler.png`, `natarian-emperor.png`, `natarian-knight.png`, `natar_hero.png` |
| Crunched atlas `UnitsNatars` (extract via JSON rects) | `apps/web/app/components/icons/natar-units/` | `pikeman.png`, `thorned-warrior.png`, `guardsman.png`, `birds-of-prey.png`, `axerider.png`, `war-elephant.png`, `ballista.png` |
| `Gpack\367\img_ltr\global\tribes\` | `apps/web/public/tribes/` | `natar_medium.png`, `natar_small.png` |
| `Gpack\367\img_ltr\legacy\views\map\detailView\village\` | `apps/web/public/villages/` | `villageNatar.jpg` |
| `Gpack\367\img_ltr\legacy\views\report\tribes\` | `apps/web/public/tribes/` | `natar.png` (report icon) |
| `Gpack\367\img_ltr\legacy\views\systemMessage\` | `apps/web/public/system-messages/` | `constructionPlansBackground.jpg`, `header_natarsWon.jpg` |
| `UnityDataAssetPack\New folder (5)\Sprite\` | `apps/web/public/system-messages/` | `natars_started_build_ww.png`, `world_has_ended_natars.png` |
| `Hero\3rd try\Assets\TLMobile\Textures\Illustarations\Buildings\{Tribe}\` | `apps/web/public/buildings/ww/{tribe}/` | `g40-ltr.png`, `g40_0-ltr.png`, `g40_20-ltr.png`, `g40_40-ltr.png`, `g40_60-ltr.png`, `g40_80-ltr.png` (+ Spartan `g40_3/5/7/9/11.png`) + night variants |
| Crunched atlas `IconsBuildings_Natars` (extract `ic_n_WoW` + `ic_n_treasury` via JSON rects) | `apps/web/public/buildings/natar/` | `ic_n_WoW.png`, `ic_n_treasury.png` |

---

## 1. Implementation Order (recommended commit sequence)

The remaining Phase 4 work splits into **7 sub-phases** that should be committed separately to keep diffs reviewable and tests green:

| # | Sub-phase | Depends on | Estimated complexity |
|---|---|---|---|
| 4A | Types & schemas (tribe/faction/enum additions) | — | Low |
| 4B | World Wonder building definition + cost/time helpers | 4A | Low |
| 4C | Construction Plan item + Hero inventory integration | 4A | Medium |
| 4D | Natar village seeder + garrison scaling | 4A, 4C | Medium |
| 4E | Construction Plan drop logic (attack Natar village with Hero) | 4C, 4D | Medium |
| 4F | World Wonder construction logic + win-condition + server-end | 4B, 4E | High |
| 4G | NPC factions compete for Wonder + allied defence + milestone report | 4F | High |

Run the full test suite (`@pillage-first/db`, `@pillage-first/api`, `@pillage-first/web`) + typecheck after each sub-phase.

---

## 2. Sub-phase 4A — Types & Schemas (foundation)

### 2.1 New Zod types / enums

**`packages/types/src/models/report.ts`** — extend `ReportType`:
```
'attack' | 'raid' | 'defence' | 'reinforcement' | 'scout-attack' | 'scout-defence' | 'adventure' | 'trade'
+ 'construction_plan_obtained'   // 4E
+ 'npc_wonder_milestone'         // 4G
+ 'world_wonder_level'           // (optional) level-up notification
+ 'server_end'                   // 4F
```

**`packages/types/src/models/faction.ts`** — add `'natars'` to the `factionSchema` enum so a Natar village can be assigned to a dedicated faction key (keeping it distinct from npc1..npc9). Update `FACTION_KEYS` arrays accordingly. This avoids polluting the 9 personality factions with passive Natar behaviour.

**`packages/types/src/models/game-event.ts`** — add new `GameEventType` values:
- `'worldWonderUpgrade'` — scheduled building-level-up event for WW (mirrors `buildingUpgrade`)
- `'natarReinforcement'` — (optional) periodic garrison top-up for Natar villages
- `'npcWonderUpgradeDecision'` — periodic NPC brain tick to decide whether an NPC faction starts/advances its WW

**`packages/types/src/models/hero-item.ts`** — `HeroItemCategory` already has `'artifact'`; add a new category `'construction_plan'` (kept separate from `'artifact'` so the "only one plan per player" rule is a simple category-count check). Add `'construction_plan'` to the `heroItemCategorySchema`.

**`packages/types/src/models/server.ts`** — add endgame fields to `serverDbSchema`:
```ts
endedAt: number | null,
winnerPlayerId: number | null,        // null = Natars won / no winner
winnerType: 'player' | 'natars' | null,
winConditionMetAt: number | null,     // timestamp WW lvl 20 reached
```

### 2.2 DB migrations (`packages/db/src/migrations/upgrade-db.ts`)

Append `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations (the codebase's established pattern — never edit base schema SQL for live columns):
- `servers` → add `ended_at INTEGER`, `winner_player_id INTEGER`, `winner_type TEXT`, `win_condition_met_at INTEGER`
- `villages` → add `is_world_wonder_village INTEGER DEFAULT 0`, `world_wonder_level INTEGER DEFAULT 0`, `construction_plan_held INTEGER DEFAULT 0` (denormalised for fast lookup)
- New table `natar_villages`: `(village_id INTEGER PK, server_slug TEXT, construction_plan_available INTEGER DEFAULT 1, plan_holder_player_id INTEGER)` — tracks which Natar village still has its plan.
- New table `world_wonders`: `(village_id INTEGER PK, owner_player_id INTEGER, owner_faction_id TEXT, current_level INTEGER DEFAULT 0, started_at INTEGER, name TEXT DEFAULT NULL, last_attack_at INTEGER DEFAULT NULL, next_attack_at INTEGER DEFAULT NULL)` — single source of truth for WW state. The `name`, `last_attack_at`, `next_attack_at` fields mirror the official Travian `WoWDTO` / `WonderOfWorldStatEntry` data models (§0.3.7). `name` is max 25 chars (per `WonderOfTheWorldWindowController.MaxStringLength`).
- `reports.type` CHECK constraint: extend to include the new report types (only if there is a CHECK; otherwise no migration needed — SQLite doesn't enforce TEXT enum).

### 2.3 Faction profile entry for Natars

**`packages/api/src/controllers/resolvers/utils/npc-brain/faction-profiles.ts`** — add a `natars` profile:
- `proactiveCooldownMultiplier: Infinity` (never attacks proactively)
- `aggressionTier: 'passive'`
- `personality: 'Natar Guardians'`
- Skip `natars` in every proactive/retaliation subsystem via a `isPassiveFaction(key)` helper.

**`packages/game-assets/src/factions.ts`** — add `natars` to `FACTION_NAMES` and `FACTION_COLORS` (use the existing `TRIBE_COLORS.natars` `#1f2937`).

### 2.4 Verification (4A)
- Typecheck passes.
- Existing 364 tests still pass (no behaviour change yet — only types/migrations).

---

## 3. Sub-phase 4B — World Wonder building definition

### 3.1 Building entry

**`packages/game-assets/src/buildings.ts`** — add `WORLD_WONDER`:
```ts
{
  id: 'WORLD_WONDER',
  category: 'wonder',                 // new category (add to BuildingCategory enum in types)
  tribe: undefined,                   // buildable by any tribe
  populationCoefficient: 0,           // WW consumes no population
  culturePointsCoefficient: 0,        // no CP (vanilla rule)
  effects: [],
  buildingRequirements: [
    { id: 1, type: 'building', buildingId: 'TREASURY', level: 10 },
    { id: 2, type: 'amount', amount: 1 }, // requires holding a Construction Plan (checked in code, not declaratively)
  ],
  baseBuildingCost: [50000, 50000, 50000, 50000],
  buildingCostCoefficient: 0,         // we use a custom formula, not the standard exponential
  maxLevel: 20,
  buildingDurationBase: 0,            // custom formula
  buildingDurationModifier: 0,
  buildingDurationReduction: 0,
  isWorldWonder: true,                // new flag — gate special rules
}
```
Add `isWorldWonder?: boolean` to the `Building` type in `packages/types/src/models/building.ts` and add `'wonder'` to `BuildingCategory`.

### 3.2 Custom cost/time helpers

**`packages/game-assets/src/utils/buildings.ts`** — add (do not modify existing `calculateBuildingCostForLevel` — branch on `building.isWorldWonder`):
```ts
export function calculateWorldWonderCostForLevel(level: number): Resources {
  const f = Math.pow(level, 2.5);
  return { lumber: 50000*f, clay: 50000*f, iron: 50000*f, crop: 50000*f };
}
export function calculateWorldWonderDurationForLevel(level: number, serverSpeed: number): number {
  return Math.floor((3600 * level) / serverSpeed); // seconds, real-time
}
```
Sanity check (matches roadmap):
- L1: ~50k each, 3600/speed s
- L10: ~1,581,000 each, 36000/speed s
- L20: ~8,944,000 each, 72000/speed s
- At 200× (Blitz): L1 = 18s, L20 = 360s = 6 min — fast but achievable.

### 3.3 Special-rule gate

In **every** place that handles building construction/queueing, add a guard `if (building.isWorldWonder) { /* apply WW special rules */ }`:
- Only one WW per player (check `world_wonders` table for `owner_player_id`).
- Only one WW per faction (NPC factions included).
- Only in a village with `construction_plan_held = 1` AND Treasury lvl ≥ 10.
- Plan is consumed when WW reaches Level 1 (set `construction_plan_held = 0`, remove plan item from hero inventory, set `natar_villages.plan_holder_player_id` unchanged — the plan is gone from the Natar village forever).
- After Level 1, village cannot be conquered (extend existing conquest logic in `combat-conquest.test.ts`/conquest resolver).
- No walls/residence/palace buildable in WW village (vanilla rule — add to building requirements check).
- 50% faster build is **already baked into our formula** (we use `3600*level/speed`, which is already aggressive). Do not double-apply.
- 2 levels queueable (vanilla) — extend the construction-queue limit check for WW villages only.

### 3.4 Verification (4B)
- Unit test: `calculateWorldWonderCostForLevel(1/10/20)` returns expected values.
- Unit test: `calculateWorldWonderDurationForLevel` scales with speed.
- Existing building tests still pass (we only *added* a branch).

---

## 4. Sub-phase 4C — Construction Plan item

### 4.1 Item definition

**`packages/game-assets/src/items.ts`** — add a new `constructionPlan` item:
```ts
export const constructionPlan: HeroItem = {
  id: 200,                 // next free id (consumables go to 114; spartan/viking to 178; pick 200+ to leave room)
  name: 'Construction Plan',
  category: 'construction_plan',
  slot: 'non-equipable',
  tier: 'legendary',
  rarity: 'legendary',
  tribe: 'all',
  consumable: true,
  stackable: false,
  description: 'A World Wonder Construction Plan. Required to start a World Wonder. Consumed when WW reaches Level 1.',
  bonus: [],
};
```
Add it to the `items` array and to a new exported `constructionPlans: HeroItem[] = [constructionPlan]` array. Update `itemCategories`/`categoryDisplayNames` to include `'construction_plan'`.

### 4.2 "Only one plan per player" rule

**`packages/api/src/controllers/hero-controllers.ts`** — add a helper `hasConstructionPlan(heroId): boolean` (counts items in `hero_inventory` with `item_id = 200`). Enforce in the plan-grant path (4E): refuse to grant if already held. (The rule "only one WW per player" is enforced separately in 4F.)

### 4.3 UI: Treasury "Construction Plan" panel

**`apps/web/app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/treasury/treasury-artifacts.tsx`** — un-comment the `availableArtifacts` filter and adapt it to the new `construction_plan` category. Add a small panel showing:
- Whether the current village holds a plan (from `villages.construction_plan_held`).
- The player's owned plan (from hero inventory, filtered by `category === 'construction_plan'`).
- A "Start World Wonder" button (visible only when Treasury ≥ lvl 10 AND plan held AND no existing WW) → calls the new WW-start API route (4F).

### 4.4 Icon

Use the `constructionPlansBackground.jpg` asset cropped, or generate a simple scroll icon. Place a `construction_plan.png` in `apps/web/app/components/icons/` and add an entry to `icons.tsx`. Add localisations to `en-US/assets.json`.

### 4.5 Verification (4C)
- Test: hero can hold at most one Construction Plan.
- Test: granting a second plan is refused.

---

## 5. Sub-phase 4D — Natar village seeder

### 5.1 Count + placement

**New file: `packages/db/src/seeders/natar-villages-seeder.ts`** — runs after `tiles-seeder` and the general NPC village seeder.

```
getNatarVillageCount(mapSize): 25→1, 50→2, 75→3, 100→4
```
(Utility lives in `packages/api/src/utils/faction-scaling.ts` alongside `getFactionCountForMapSize`.)

Placement rules:
- Random tile with `mapSize * 0.35 ≤ distanceFromCenter ≤ mapSize * 0.5` (i.e. between 35% and 50% of map radius — outside the very centre, not on the edge).
- Not on the player's start tile (0,0).
- Not on an existing village/oasis tile.
- Min separation between Natar villages: `mapSize * 0.2` tiles.

### 5.2 Village creation

For each placed tile:
1. Create a `players` row: `name = 'Natars'`, `tribe_id = natars`, `is_npc = 1`, `faction_id = 'natars'`.
2. Create a `villages` row on that tile, `is_world_wonder_village = 0` (Natar villages are *guardians*, not WW villages in our version — players build Wonders in their own villages).
3. Create `npc_village_state` row with `faction_key = 'natars'`, size derived from `getVillageSize` (force `'4xl'` so garrisons are large).
4. Seed starting buildings: use `npc-starting-buildings-seeder.ts`'s `UNIVERSAL_BUILDINGS` + `NATAR_WALL` (already mapped).
5. Create `natar_villages` row with `construction_plan_available = 1`.

### 5.3 Garrison scaling

**`packages/db/src/seeders/troop-seeder.ts`** — extend to handle `faction_key === 'natars'`:
- Base garrison per unit (Travian-accurate-ish, scaled to be challenging but killable by a mid-game army):
  ```
  Pikeman:        800 * (1 + speed/100),   cap 5000
  Thorned Warrior: 600 * (1 + speed/100),  cap 4000
  Guardsman:      400 * (1 + speed/100),   cap 3000
  Bird of Prey:   100 * (1 + speed/100),   cap 800
  Axerider:       300 * (1 + speed/100),   cap 2000
  Natarian Knight: 200 * (1 + speed/100),  cap 1500
  War Elephant:    50 * (1 + speed/100),   cap 400
  Ballista:        80 * (1 + speed/100),   cap 500
  Natarian Emperor: 1                     (single hero unit)
  ```
- On Blitz (200×): multiplier = 3 → e.g. Pikeman 2400 (under cap). Reasonable.
- Use the existing `TRIBE_UNIT_TIERS.natars` distribution but **force all 9 unit IDs** (the existing tier list only has 4 — extend it).
- Resolve the `troop-seeder.ts` TODOs at lines 225-227 by either deleting the unused `_npcUnitCompositionByTribeAndSize` map or wiring it up; for Phase 4 we just need the Natar branch to be correct.

### 5.4 Natar behaviour

In **`packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/proactive-attack.ts`** and **`retaliation-execution.ts`**: add an early `if (factionKey === 'natars') return;` so Natar villages never attack or retaliate. They are pure defenders.

### 5.5 Verification (4D)
- For each map size, seed a server and assert Natar village count (1/2/3/4).
- Assert garrisons present for all 9 Natar unit types.
- Assert Natar villages never appear in proactive-attack logs.

---

## 6. Sub-phase 4E — Construction Plan drop logic

### 6.1 Trigger

In **`packages/api/src/controllers/resolvers/troop-movement-resolver.ts`** → the attack/raid resolution path (after combat is resolved by `combat-resolver.ts` and the defender is a Natar village):

```ts
if (defenderVillage.faction_id === 'natars' && combatResult.attackerWon && heroSurvived) {
  const natarRow = getNatarVillage(defenderVillageId);
  if (natarRow.construction_plan_available && !hasConstructionPlan(attackerHeroId)) {
    grantConstructionPlan(attackerHeroId);
    markNatarPlanTaken(defenderVillageId, attackerPlayerId);
    saveConstructionPlanObtainedReport(attackerVillageId, defenderVillageId);
  }
}
```
Conditions:
- Attack type must be `'attack'` (full attack), not `'raid'` — vanilla requires a real attack to capture plans. (Decision point — see §9 Open Questions.)
- Hero must survive the combat (check `combatResult.heroSurvived` / hero HP > 0 after).
- Defender must be a Natar village with `construction_plan_available = 1`.
- Attacker must not already hold a plan.

### 6.2 Report

**`packages/api/src/controllers/resolvers/utils/reports.ts`** — add `saveConstructionPlanObtainedReport(attackerVillageId, natarVillageId)`:
- Inserts a row with `type = 'construction_plan_obtained'`, `data = { natarVillageId, heroId, timestamp }`.
- Appears in the attacker's Reports page (extend the React `reports.tsx` filter list to include the new type).

### 6.3 World-items mirroring (optional)

The `world-items` system already has `artifactIds` plumbing (`useArtifactsAroundCurrentVillage`). We can optionally surface the Natar village's plan on the map via a `world_items` row of type `'construction_plan'` anchored to the Natar tile, so the map shows a plan icon. This is a **nice-to-have** — the authoritative state lives in `natar_villages.construction_plan_available`.

### 6.4 Verification (4E)
- Test: attack Natar village with Hero, win, Hero survives → plan granted, Natar village `construction_plan_available` → 0, report created.
- Test: attack without Hero → no plan.
- Test: attack with Hero that already holds a plan → no second plan granted.

---

## 7. Sub-phase 4F — World Wonder construction + win condition

### 7.1 Starting a WW

**New API route: `POST /api/villages/:villageId/world-wonder/start`** (Zod-validated, in `packages/api/src/routes/`):
- Preconditions (all checked server-side):
  - Village belongs to player.
  - Village has `TREASURY` at level ≥ 10.
  - Player's hero holds a Construction Plan (`hasConstructionPlan`).
  - Player does not already own a WW (`world_wonders` has no row with `owner_player_id = playerId`).
  - Village is not already a WW village.
- Side effects:
  - Create `world_wonders` row: `{ village_id, owner_player_id, owner_faction_id: 'player', current_level: 0, started_at: now }`.
  - Set `villages.is_world_wonder_village = 1`.
  - Schedule the first `worldWonderUpgrade` event (to Level 1) via `createEvents`.

### 7.2 WW upgrade events

**`packages/api/src/controllers/utils/events.ts`** — add `worldWonderUpgrade` to the event union and implement `getEventCost` / `getEventDuration` branches:
- `cost = calculateWorldWonderCostForLevel(targetLevel)`
- `duration = calculateWorldWonderDurationForLevel(targetLevel, serverSpeed)`
- `starts_at = now` (queue immediately if resources available)

**New resolver: `packages/api/src/controllers/resolvers/world-wonder-resolvers.ts`** — `worldWonderUpgradeResolver(event)`:
1. Re-check preconditions (resources still available — they were reserved at event creation).
2. Deduct resources.
3. Increment `world_wonders.current_level` and `villages.world_wonder_level`.
4. If `current_level === 1`: consume the Construction Plan (remove from hero inventory, set `villages.construction_plan_held = 0`).
5. If `current_level === 20`: trigger server-end (§7.4).
6. Optionally schedule the next level automatically if the queue allows (vanilla: 2 levels queueable). Otherwise wait for the player to queue the next.
7. Save a `'world_wonder_level'` report (optional, for player log).

### 7.3 UI

- **Village view:** show the WW building using the per-tribe illustration set. See §0.3.3 for the stage→level mapping. For LTR tribes: `g40_0-ltr.png` (L1–4), `g40_20-ltr.png` (L5–9), `g40_40-ltr.png` (L10–14), `g40_60-ltr.png` (L15–19), `g40_80-ltr.png` (L20). Use night variants (`g40_*_night.png`) if the server is in night mode. For the building-card icon, use the extracted `ic_n_WoW.png` from the Natar building atlas (§0.3.2, index 23).
- **Building detail panel** (mirrors `WonderOfTheWorldWindowController`): show current level, next-level cost/time, a "Upgrade to Level N" button (calls a `POST /api/villages/:villageId/world-wonder/upgrade` route), a **WW name input** (max 25 chars, saves via `PATCH /api/villages/:villageId/world-wonder/name` — mirrors `ChangeWoWName`), and a `cannotBeUpgradedReason` display if the WW is blocked. Use the `ic_n_WoW.png` icon (extracted from Natar building atlas, §0.3.2) as the building card icon.
- **WW Statistics / Leaderboard view** (mirrors `StatisticsWonderOfTheWorldTabController`): a new tab or page showing all WWs on the server (player + NPC factions) with their level, village, owner, `wwName`, `lastAttackAt`, `nextAttackAt` — the `WonderOfWorldStatEntry` model. This gives the player visibility into NPC faction WW progress (creates tension as NPC WWs approach level 20).
- **Server header (top bar):** show "World Wonder: Level X / 20" progress indicator, plus any NPC faction WW levels (for tension).

### 7.4 Win condition + server end

**`packages/api/src/controllers/server-controllers.ts`** — add `endServer(serverSlug, winner)`:
- Set `servers.ended_at`, `winner_player_id`, `winner_type`, `win_condition_met_at`.
- Save a `'server_end'` report for every player.
- Stop the scheduler from processing new game events (the scheduler reads events; we can either mark all pending events as cancelled, or have `resolveEvent` short-circuit when `servers.ended_at IS NOT NULL`).

**Trigger points** (both call `endServer`):
- `worldWonderUpgradeResolver` when `current_level === 20` and owner is the player → `winnerType = 'player'`.
- NPC WW upgrade resolver (4G) when `current_level === 20` and owner is an NPC faction → `winnerType = 'natars'` (or the faction key — but the roadmap's Blitz spec says "any NPC's Wonder reaches 20 → Defeat").

**Elimination detection** (Blitz requirement from Phase 3.5, reused here):
- Add a check in the conquest/elimination path: if a player has 0 villages left, mark them eliminated. On Blitz → trigger Defeat screen. On standard → mark eliminated (no victory). This is a **Phase 3 carry-over** — confirm whether the Phase 3 commit already did it; if not, do it here.

### 7.5 Victory/Defeat screen (Blitz)

**`apps/web/app/(game)/(village-slug)/components/blitz-result-screen.tsx`** — already specified in Phase 3.6. Phase 4 wires the *trigger*: when `use-server` hook sees `endedAt != null`, render `BlitzResultScreen` instead of the normal game view. For standard servers, show a softer "Server Ended" banner + Hall of Fame link (Hall of Fame is Phase 7).

**Data model** (mirrors official `WorldEndPlayerWonNotification` / `WorldEndNatarsWonNotification` — §0.3.7):
- Victory: `{ topPlayers, topAttacker, topDefender, worldEndTime, tribe, village, player, alliance }`
- Defeat (Natars won): `{ topPlayers, topAttacker, topDefender, worldEndTime }` (no winner player data)
- Use the `world_has_ended_natars.png` art (§0.3.5) for the Defeat screen header, and `header_natarsWon.jpg` (web Gpack) as fallback.

### 7.6 Verification (4F)
- Start WW without Treasury lvl 10 → rejected.
- Start WW without plan → rejected.
- Start a second WW for same player → rejected.
- Upgrade path L1→L20 with injected resources → server ends at L20.
- Plan consumed exactly at L1.

---

## 8. Sub-phase 4G — NPC competition, allied defence, milestone report

### 8.1 NPC factions compete for the Wonder

**New subsystem: `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/wonder-competition.ts`** — invoked from `simulate-elapsed-time.ts` on each NPC brain tick:

1. **Plan acquisition:** Each NPC faction (npc1..npc9) that does not yet hold a plan and has no WW rolls a small chance per tick to "attack a Natar village" — simulate this as an instant combat resolution (not a visible troop movement, to keep it simple) using the faction's available troop budget vs. the Natar garrison. If the faction wins, it captures the plan (set `natar_villages.plan_holder_player_id` to a synthetic NPC player id, `construction_plan_available = 0`). Rate-limit: one attempt per faction per Natar village per in-game day.
   - **Alternative (simpler):** after a real-time delay scaled by server speed, simply *award* a plan to each NPC faction deterministically (e.g. 1 plan per faction at `T = serverStart + 24h/speed`). The roadmap says "use the existing combat system — no special logic needed" but also "NPC factions use the existing combat system". Decision point — see §9.
2. **WW start:** Once a faction holds a plan, designate its strongest village (highest population / troop count) as the WW village. Set `is_world_wonder_village = 1`, create `world_wonders` row with `owner_faction_id = factionKey`, `owner_player_id = synthetic_npc_player_id`.
3. **WW upgrade:** Schedule `worldWonderUpgrade` events for the NPC WW using the *same* `worldWonderUpgradeResolver`. NPC factions get resources from their `loot-recovery`/`growth-simulation` subsystems (extend those to feed the WW budget). Upgrade cadence: queue the next level as soon as the previous finishes (NPCs queue continuously, no player input).
4. **Balance:** NPC WW upgrade speed is the same formula as the player's (roadmap §4.5). To avoid the NPC always winning, gate NPC WW progress behind having enough resources in its faction pool — if the faction can't afford the next level, it waits.

### 8.2 NPC Wonder milestone report

In `worldWonderUpgradeResolver` (or the NPC WW variant), when `current_level === 10` and owner is an NPC faction:
```ts
saveNpcWonderMilestoneReport(playerVillageIds, {
  factionName: FACTION_NAMES[factionKey],
  level: 10,
  villageId: wwVillageId,
});
```
- `type = 'npc_wonder_milestone'`, `data = { factionName, level: 10, villageId }`.
- Report text: `"[Faction Name] has completed Wonder of the World Level 10. The endgame has begun."`
- Send to **all** players (one report row per player village, or one per player — match the existing `saveCombatReport` pattern).

**Milestone sub-types** (mirror official `NatarsWWInfoboxMessageType` enum — §0.3.7):
- `STARTED` — when an NPC faction first begins its WW (level 0→1): `"[Faction Name] has started building a Wonder of the World."`
- `NO_ATTACK` — (vanilla: Natars recall at WW lvl 75; our adaptation: at lvl 15) when an NPC faction's WW reaches level 15: `"[Faction Name] has reached Wonder Level 15 and is recalling all forces to defend it."` Use the `natars_started_build_ww.png` art (§0.3.5) for this system message.
- `FINISHED` — when an NPC faction's WW reaches level 20: triggers server-end (Defeat). Use the `world_has_ended_natars.png` art (§0.3.5).

Store the sub-type in the report `data.milestoneType` field (`'started' | 'no_attack' | 'finished'`).

### 8.3 Allied faction defence

**`packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/allied-defence.ts`** — triggered when a WW village (player-owned) has an incoming attack event (`troopMovementAttack` scheduled against it):

1. Query `faction_reputation` for the player's faction (`'player'`) vs each npc1..npc9.
2. For each faction with `reputation >= 50`:
   - Send a reinforcement troop movement from that faction's nearest village to the player's WW village, timed to arrive within ±2 in-game minutes of the incoming attack (mirror the Phase 2 coordinated-attack timing logic).
   - Use the faction's existing troop composition; cap at 30% of the faction's available defence troops per call (don't strip the faction bare).
3. The reinforcement arrives and joins the defender side in `combat-resolver.ts` (existing reinforcement logic handles this — no combat changes needed).

### 8.4 Enemy faction aggression boost

In `proactive-attack.ts`: if the target village `is_world_wonder_village = 1` AND attacker faction `reputation < 50` AND target WW level ≥ 5, multiply the attack chance by 1.3 (roadmap §4.7). Add a comment pointing at the roadmap.

### 8.5 Reputation cap enforcement

The roadmap §4.7 requires: max 3 allies on a 9-faction server, max 1 ally on a 3-faction server. This is enforced by the Phase 2 rival-reputation-drop mechanic (when one faction's rep rises above 70, a rival's drops by 15). **Verify** in `reputation-impact.ts` that the drop mechanic is implemented; if not, implement it here. The cap falls out naturally from the drop mechanic — no hard count check needed.

### 8.6 Verification (4G)
- Simulate an NPC faction capturing a plan and building a WW → milestone report at L10, server-end at L20.
- Simulate an incoming attack on the player's WW village with an allied faction (rep ≥ 50) → reinforcement arrives.
- Simulate with no allies → no reinforcement.
- Confirm enemy factions attack WW village 30% more often after L5.

---

## 9. Open Questions (need project owner decision before implementation)

1. **Plan capture attack type:** Should capturing a Construction Plan require a full `'attack'` (chiefing-style, clears the village) or is a `'raid'` sufficient? Vanilla requires a full attack. **Recommendation:** full attack (matches vanilla; prevents trivial raid-spam). (User answer to question 1: Yes full attack do the recommended)

2. **NPC plan acquisition model:** Real simulated combat vs. deterministic time-based award? Real combat is more authentic but heavier; deterministic is simpler and guaranteed-predictable. **Recommendation:** deterministic award (one plan per NPC faction at `serverStart + 24h/speed` for standard, `+ 10 min` for Blitz) for the first pass; upgrade to simulated combat later if desired.(User answer to question 2: You have to understand that this is an End game feature, we want the game to end soon only in blitz mode, no in other modes, what should happen is the natar villages spwan with server start, 1 Village Per faction, so each faction will attack the natar closest to it or randomely is fine also, they don't attack the natars to capture the plan unless they have enough troop power to take it, even if all faction NPC attack it to take it, then the strongest NPC would start building the World wonder and the player gets a notification that this happend, this all has to be done perfectly and cheap on server performance.)

3. **Does the Natar village disappear after its plan is taken?** Vanilla: Natar WW villages are conquerable. In our version Natar villages are *guardians*, not WW villages. **Recommendation:** Natar village stays on the map after plan is taken (garrison regenerates slowly, no new plan). Keeps the map stable.(User answer to question 3:do the recommended they stay after the plan is taken.)

4. **NPC WW village location:** Player picks their WW village; where do NPC factions put theirs? **Recommendation:** the NPC faction's highest-population village (already designated in §8.1.2). (User answer to question 4: Yes do the recommended biggest population takes it, for the player the village that has the construction plan only can build the WW)

5. **Server-end behaviour:** Should all in-flight events be cancelled, or just frozen? **Recommendation:** set `ended_at`; have `resolveEvent` short-circuit when `ended_at IS NOT NULL` (no new resolutions); leave the events table intact for post-game inspection / Hall of Fame stats (Phase 7). (User answer to question 5: Yes do the recommended)

6. **Elimination screen on standard servers:** Phase 3.5 only mandates the Defeat screen for Blitz. On standard, do eliminated players get a "You were eliminated" screen or just a ghost view? **Recommendation:** soft banner + redirect to Hall of Fame (Phase 7); full Defeat screen is Blitz-only. ((User answer to question 6: They should all have the same defeat screen))

7. **Construction Plan tradeable/droppable?** Vanilla plans are tradeable between players. We are single-player vs. NPCs, so this is moot — plans are non-tradeable, bound to the hero. **Recommendation:** non-tradeable.(User answer to question 7: Yes do the recommended)

---

## 10. File-Change Checklist (summary)

### New files
- `packages/db/src/seeders/natar-villages-seeder.ts`
- `packages/api/src/controllers/resolvers/world-wonder-resolvers.ts`
- `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/wonder-competition.ts`
- `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/allied-defence.ts`
- `packages/api/src/routes/world-wonder-routes.ts` (or extend village routes)
- `apps/web/app/(game)/(village-slug)/components/blitz-result-screen.tsx` (Phase 3 carry-over if not present)
- `apps/web/app/components/icons/construction-plan-icon.tsx`

### Modified files (types)
- `packages/types/src/models/report.ts` — new report types
- `packages/types/src/models/faction.ts` — add `'natars'`
- `packages/types/src/models/game-event.ts` — new event types
- `packages/types/src/models/hero-item.ts` — `'construction_plan'` category
- `packages/types/src/models/server.ts` — endgame fields
- `packages/types/src/models/building.ts` — `isWorldWonder` flag, `'wonder'` category

### Modified files (game assets)
- `packages/game-assets/src/buildings.ts` — add `WORLD_WONDER`
- `packages/game-assets/src/utils/buildings.ts` — WW cost/time helpers
- `packages/game-assets/src/items.ts` — Construction Plan item + `constructionPlans` export
- `packages/game-assets/src/factions.ts` — `natars` faction name/colour
- `packages/game-assets/src/troop-icons.ts` — (already done in Phase 4 partial)
- `apps/web/app/components/icons/icons.tsx` — WW + plan icons
- `apps/web/app/localization/locales/en-US/assets.json` — WW + plan strings

### Modified files (DB)
- `packages/db/src/migrations/upgrade-db.ts` — new columns + `natar_villages` + `world_wonders` tables
- `packages/db/src/seeders/troop-seeder.ts` — Natar garrison branch + resolve TODOs
- `packages/db/src/seeders/npc-village-state-seeder.ts` — `natars` starting values
- `packages/db/src/seeders/npc-faction-state-seeder.ts` — `natars` faction state
- `packages/db/src/seeders/npc-starting-buildings-seeder.ts` — (already has NATAR_WALL)
- `packages/db/src/schemas/lookup-tables/unit-ids-schema.sql` — (already done)
- `packages/db/src/migrate.ts` — invoke new `natar-villages-seeder`

### Modified files (API)
- `packages/api/src/controllers/utils/events.ts` — `worldWonderUpgrade` cost/duration
- `packages/api/src/controllers/utils/create-event.ts` — (no change if generic)
- `packages/api/src/controllers/resolvers/troop-movement-resolver.ts` — plan-drop on Natar defeat
- `packages/api/src/controllers/resolvers/utils/reports.ts` — new report savers
- `packages/api/src/controllers/resolvers/utils/npc-brain/faction-profiles.ts` — `natars` profile
- `packages/api/src/controllers/resolvers/utils/npc-brain/npc-brain-types.ts` — passive-faction helper
- `packages/api/src/controllers/resolvers/utils/npc-brain/simulate-elapsed-time.ts` — wire wonder-competition + allied-defence
- `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/proactive-attack.ts` — skip `natars` + WW aggression boost
- `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/retaliation-execution.ts` — skip `natars`
- `packages/api/src/controllers/resolvers/utils/npc-brain/subsystems/reputation-impact.ts` — verify rival-drop mechanic
- `packages/api/src/controllers/hero-controllers.ts` — `hasConstructionPlan`, grant/drop plan
- `packages/api/src/controllers/server-controllers.ts` — `endServer` + win-state read route
- `packages/api/src/utils/faction-scaling.ts` — `getNatarVillageCount`

### Modified files (web)
- `apps/web/app/(game)/(village-slug)/(...building-field-id)/components/components/treasury/treasury-artifacts.tsx` — un-comment + plan panel
- `apps/web/app/(game)/(village-slug)/(reports)/components/reports.tsx` — new report types in filter
- `apps/web/app/(game)/(village-slug)/hooks/use-server.ts` — endgame state
- `apps/web/app/(game)/(village-slug)/(...building-field-id)/components/building-detail.tsx` (or equivalent) — WW detail panel

---

## 11. Test Plan (per sub-phase)

| Sub-phase | New tests |
|---|---|
| 4A | Migration applies cleanly on a seeded DB; types compile |
| 4B | `calculateWorldWonderCostForLevel` / `Duration` values; building lookup returns WW |
| 4C | `hasConstructionPlan` true/false; granting second plan refused |
| 4D | Natar village count per map size; garrison composition; Natar never attacks |
| 4E | Plan granted on Hero-bearing winning attack; not on raid; not without Hero; not if already held |
| 4F | WW start preconditions; L1 consumes plan; L20 ends server; second WW rejected |
| 4G | NPC plan acquisition; NPC WW milestone at L10; allied reinforcement on incoming attack; enemy aggression +30% after L5 |

Run full suite (`db` 64 + `api` 249 + `web` 51 = 364) after each sub-phase; expect additions to bring the total to ~410+.

---

## 12. References

- `Game Docs/AGENT_IMPLEMENTATION_ROADMAP.md` — Phase 4 spec (§4.1–4.8)
- `Game Docs/IMPLEMENTATION_PROGRESS.md` — what's already done (Natar units)
- **Unity assets (canonical):** `Unity Assets For hero\Hero\3rd try\Assets\`
  - `TLMobile\SpriteAtlases\Units\UnitsNatars.json` — Natar unit spritesheet atlas (10 sprites, all 9 combat units + settler)
  - `TLMobile\SpriteAtlases\Icons\Buildings\IconsBuildings_Natars.json` — Natar building icons atlas (38 icons incl. `ic_n_WoW` at index 23, `ic_n_treasury` at index 37)
  - `TLMobile\Textures\Illustarations\Buildings\{Tribe}\g40*-ltr.png` — per-tribe WW building illustrations (day)
  - `Sprite\art_Landscape_village_natar.json`, `art_header_wilderness_natarvillage.json` — Natar village art
  - `PrefabHierarchyObject\14_NatarsWWInfoboxMessage.glb`, `WorldEndNatarsWonNotification.glb` — endgame 3D prefabs
- **Unity assets (pre-extracted PNGs):** `Unity Assets For hero\UnityDataAssetPack\New folder (5)\Sprite\`
  - `natarian-emperor.png`, `natarian-knight.png`, `ic_n_natarianEmperor.png`, `ic_n_natarianKnight.png`, `ic_n_natarianSettler.png`, `natar_hero.png` — ready-to-use Natar unit PNGs
  - `natars_started_build_ww.png`, `world_has_ended_natars.png` — endgame system message art
  - `g40*.png`, `g40*_night.png` — pre-extracted WW building PNGs (all stages, day + night)
- **Unity C# data models:** `Unity Assets For hero\Try 2 27\Scripts\TLMobile\TLMobile\`
  - `Generated\GraphQL\Game\WoW.cs` + `GraphQL\DTO\Game\WoWDTO.cs` — WW instance model (`name`, `cannotBeUpgradedReason`)
  - `Generated\GraphQL\Game\WonderOfWorldStatEntry.cs` — WW leaderboard model (`level`, `village`, `lastAttackAt`, `nextAttackAt`, `wwName`)
  - `Generated\GraphQL\Game\NatarsWWInfoboxMessageType.cs` — Natar WW milestone enum (`STARTED`, `NO_ATTACK`, `FINISHED`)
  - `Generated\GraphQL\Game\WorldEndPlayerWonNotification.cs` — Victory screen data model
  - `Generated\GraphQL\Game\WorldEndNatarsWonNotification.cs` — Defeat screen data model
  - `Scripts\UIComponents\Windows\WoWWindow\WonderOfTheWorldWindowController.cs` — WW window controller (`MaxStringLength = 25`, `SaveNameChange()`)
  - `Scripts\UIComponents\Windows\Statistics\StatisticsWonderOfTheWorldTabController.cs` — WW statistics/leaderboard tab
  - `RestAPI\RestAPI\Game\Model\ChangeWoWName.cs` — WW rename REST model
- **Web Gpack (T4.6):** `NOT NEEDED\Gpack\367\img_ltr\`
  - `global\tribes\natar_medium.png`, `natar_small.png` — tribe badges
  - `legacy\views\map\detailView\village\villageNatar.jpg` — village map detail
  - `legacy\views\report\tribes\natar.png` — report tribe icon
  - `legacy\views\systemMessage\constructionPlansSpawned\constructionPlansBackground.jpg` — plans system message
  - `legacy\views\systemMessage\gameEnded\vanilla\header_natarsWon.jpg` — Natars-won header
  - `themes\default\buildings\{tribe}\g40_0.png`..`g40_5.png` — WW building stages (web, 6 per tribe)
  - `global\buildings\{tribe}\big\g40.png` — WW big icon
- https://travian.fandom.com/wiki/Natars — T3.6 lore
- https://support.travian.com/en/articles/103-world-wonder — T4 Legends WW rules (we deviate: lvl 20, 1–4 villages, plan-by-attack)
