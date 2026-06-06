# Hero Items System - Complete Technical Reference

> Last updated: June 7, 2026
> Scope: Everything needed to add, modify, fix, or debug hero items, overlay sprites, icons, positions, and rendering.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Item Definition System](#2-item-definition-system)
3. [Item ID Map](#3-item-id-map)
4. [Two Image Systems](#4-two-image-systems)
5. [Hero Overlay Sprites (Canvas Compositing)](#5-hero-overlay-sprites-canvas-compositing)
6. [Item Icons (Inventory UI)](#6-item-icons-inventory-ui)
7. [Compact Positions System](#7-compact-positions-system)
8. [Atlas Loader - How Sprites Are Loaded and Drawn](#8-atlas-loader--how-sprites-are-loaded-and-drawn)
9. [Hero Avatar Renderer - The Compositing Pipeline](#9-hero-avatar-renderer--the-compositing-pipeline)
10. [Canvas System Details](#10-canvas-system-details)
11. [Gender System - Male vs Female](#11-gender-system--male-vs-female)
12. [Arm Pose System](#12-arm-pose-system)
13. [Source Assets (Unity Extracted)](#13-source-assets-unity-extracted)
14. [How to Add New Items - Step-by-Step](#14-how-to-add-new-items--step-by-step)
15. [How to Fix Broken Items](#15-how-to-fix-broken-items)
16. [Known Issues and Missing Pieces](#16-known-issues-and-missing-pieces)
17. [File Reference Index](#17-file-reference-index)
18. [Reference Files in This Folder](#18-reference-files-in-this-folder)

---

## 1. Architecture Overview

The hero system composites a visual representation of the player hero on an **875x1574 pixel canvas**. The hero is built from ~14 layers drawn back-to-front, including body parts, equipment overlays, and facial features.

### Data Flow

`
Unity Game Engine (Travian)
    |
    v
Unity .meta JSON files (7,436 files)    Unity .png sprite sheets (7,754 files)
    |  [External extraction tool - NOT in this repo]
    v
apps/web/public/v2-overlays/
  |-- unity-sprite-map.json              (raw Unity rect/offset/pivot per sprite)
  |-- compact-positions-male.json        (pre-computed canvas positions for Male)
  +-- compact-positions-female.json      (pre-computed canvas positions for Female)
    |
    v
apps/web/public/V3 Hero/{Male|Female}/   (individual transparent PNGs per sprite)
    |
    v
atlas-loader.ts
  |-- fetches compact-positions-{gender}.json at runtime
  |-- loads PNGs from /V3 Hero/{Male|Female}/
  +-- drawEquipmentFromAtlas() composites onto canvas
    |
    v
hero-avatar-renderer.ts
  |-- orchestrates full back-to-front layer drawing
  |-- CANVAS_WIDTH=875, CANVAS_HEIGHT=1574
  +-- 14 render layers (back-hair, skin, clothing, arms, equipment, hair, helmet)
    |
    v
hero-avatar.tsx -> hero-inventory.tsx (React component renders the canvas in the UI)
`

### Two Separate Rendering Paths

| Path | Used For | Data Source | Rendering Method |
|------|----------|-------------|-----------------|
| **Packed Atlas** | Body parts (skin, hair, eyes, face) | {gender}-{type}-{color}.json + .png atlas sheets | ctx.drawImage() with source rect from atlas JSON |
| **Individual PNGs** | Equipment overlays (weapons, armor, helmets, boots) | /V3 Hero/{Male|Female}/{spriteName}.png + compact positions | ctx.drawImage(img, pos.x, pos.y, pos.w, pos.h) |

---

## 2. Item Definition System

### HeroItem Type

**File:** packages/types/src/models/hero-item.ts (lines 60-74)

`	ypescript
type HeroItem = {
  id: number;           // Unique item ID (1-178, with gaps at 70-72, 145-148)
  imageId: number;      // Maps to icon file: item{imageId}.png
  name: string;         // Internal name (UPPER_SNAKE_CASE)
  displayName: string;  // Human-readable name
  description: string;  // Description of item bonus
  slot: HeroItemSlot;   // Equipment slot
  tier?: HeroItemTier;  // 1=common, 2=uncommon, 3=rare (optional for consumables)
  rarity: HeroItemRarity; // common | uncommon | rare | epic
  category: HeroItemCategory; // helmet | armour | boots | left-hand | right-hand | horse | consumable | artifact
  tribe: HeroItemTribe; // romans | gauls | teutons | huns | egyptians | spartans | vikings | any
  basePrice: number | null;
  effects?: Omit<Effect, 'sourceSpecifier' | 'villageId'>[];
  heroBonus?: HeroBonus[];
};
`

### Slot Values and Their Visual Meaning

| Slot Value | Hero Part | Z-Order | Visual |
|-----------|-----------|---------|--------|
| horse | Mount | 0 (DOM, not canvas) | Rendered as separate DOM element |
| boots | Shoes | 2 | Drawn near feet |
| torso | Body armor | 3 | Covers torso area |
| left-hand | Off-hand item | 4 | Maps, flags, shields, horns |
| right-hand | Weapon | 5 | Spears, swords, axes, bows |
| head | Helmet | 6 | Drawn on top of everything |
| consumable | N/A | N/A | No visual overlay |

### Items Are Defined In

**File:** packages/game-assets/src/items.ts (1,606 lines)

Exports:
- items: HeroItem[] - Combined array of all items
- itemsMap: Map<number, HeroItem> - O(1) lookup by ID
- getItemsByCategory(category) - Filter by category
- getItemsByTribe(tribe) - Filter by tribe

### Tribe Weapon Generation

Items for each tribe's weapons (15 per tribe) are auto-generated using:

`	ypescript
function generateTribeWeapons(tribe, startId, units): HeroItem[]
`

Pattern: 5 units x 3 tiers = 15 weapons per tribe

| Tier | Rarity | Power | Price |
|------|--------|-------|-------|
| 1 | common | 250 | 100 |
| 2 | uncommon | 1000 | 500 |
| 3 | rare | 4000 | 2000 |

---

## 3. Item ID Map

### Complete ID Ranges

| ID Range | Category | Tribe | Count | Notes |
|----------|----------|-------|-------|-------|
| 1-3 | Helmets (XP bonus) | any | 3 | +15/20/25% experience |
| 4-6 | Helmets (HP regen) | any | 3 | +10/15/20 HP/day |
| 7-9 | Helmets (Culture) | any | 3 | +100/400/1600 CP/day |
| 10-12 | Helmets (Cavalry) | any | 3 | +10/15/20% cavalry training |
| 13-15 | Helmets (Infantry) | any | 3 | +10/15/20% infantry training |
| 16-30 | Right-Hand Weapons | romans | 15 | 5 units x 3 tiers |
| 31-45 | Right-Hand Weapons | gauls | 15 | 5 units x 3 tiers |
| 46-60 | Right-Hand Weapons | teutons | 15 | 5 units x 3 tiers |
| 61-63 | Left-Hand (Maps) | any | 3 | Return speed +30/40/50% |
| 64-66 | Left-Hand (Pennants) | any | 3 | Own village speed +30/40/50% |
| 67-69 | Left-Hand (Standards) | any | 3 | Alliance speed +15/20/25% |
| 70-72 | **GAP - NOT DEFINED** | - | 0 | Intentionally skipped |
| 73-75 | Left-Hand (Thief Bags) | any | 3 | Cranny reduction +10/15/20% |
| 76-78 | Left-Hand (Shields) | any | 3 | Fighting strength +250/1000/4000 |
| 79-81 | Left-Hand (Horns) | any | 3 | Natar bonus +20/25/30% |
| 82-84 | Armour (Regen) | any | 3 | HP/day +20/30/40 |
| 85-87 | Armour (Scale) | any | 3 | Damage reduction + HP/day |
| 88-90 | Armour (Breastplate) | any | 3 | Fighting strength +250/1000/4000 |
| 91-93 | Armour (Segmented) | any | 3 | Damage reduction + fighting strength |
| 94-96 | Boots (Health) | any | 3 | HP/day +10/15/20 |
| 97-99 | Boots (Troop Speed) | any | 3 | +25/50/75% after 20 fields |
| 100-102 | Boots (Spurs) | any | 3 | Hero speed +3/4/5 fields/hour |
| 103-105 | Horses | any | 3 | Rendered as DOM, not canvas |
| 106-114 | Consumables | any | 9 | No visual overlay, no tier |
| 115-129 | Right-Hand Weapons | egyptians | 15 | 5 units x 3 tiers |
| 130-144 | Right-Hand Weapons | huns | 15 | 5 units x 3 tiers |
| 145-148 | **SKIPPED - Resources** | - | 0 | Lumber, Clay, etc. |
| 149-154 | Right-Hand Weapons | spartans | 6 | Hoplite/Shieldsman spears |
| 155-160 | Left-Hand/Shields | spartans | 6 | Shield-type overlays |
| 161-163 | Right-Hand Weapons | spartans | 3 | Corinthian Crusher spears |
| 164-178 | Right-Hand Weapons | vikings | 15 | Hand-coded (not auto-generated) |

Total defined items: ~155 (with 70-72 and 145-148 gaps)

---

## 4. Two Image Systems

### System 1: Item Icons (Inventory UI)

**Purpose:** Display item icons in the hero inventory/equipment UI panels.

**Location:** apps/web/public/hero-assets/items/ (491 files)
- Pattern: item{imageId}.png
- Also: item{imageId}_{rarity}.png for rarity variants (e.g., item179_epic.png)

**V2 Icons:** apps/web/public/hero-assets/v2/icons/ (175 files)
- Pattern: item{id}.png (covers IDs 1-178)

**Used by:** HeroItemIcon component at hero-item-icon.tsx
`html
<img src="/hero-assets/items/item.png" />
`

**Important:** imageId is NOT the same as id. The imageId is a separate field that maps to the icon filename.

### System 2: Hero Overlay Sprites (Canvas Compositing)

**Purpose:** Draw equipment items on the hero avatar canvas as part of the character composite.

**Location:** apps/web/public/V3 Hero/{Male|Female}/{spriteName}.png
- Male directory: ~576 PNG files
- Female directory: ~760 PNG files
- Each PNG is a small transparent sprite (~30-750px) that gets STRETCHED to fill the compact position dimensions

**Used by:** atlas-loader.ts -> loadV2SpriteImage() -> drawEquipmentFromAtlas()

**Sprite names** come from heroAssetMapping[itemId] (defined in hero-asset-mapping.ts).

---

## 5. Hero Overlay Sprites (Canvas Compositing)

### The hero-asset-mapping.ts File

**File:** packages/game-assets/src/hero-asset-mapping.ts (166 lines)

This maps item IDs to sprite filenames. The sprite filename is used to:
1. Look up the PNG: /V3 Hero/{Male|Female}/{spriteName}.png
2. Look up the position: compact-positions-{gender}.json[spriteName]

### Naming Conventions by Category

| Category | Pattern | Example |
|----------|---------|---------|
| Helmets | helmet-{type}{tier} | helmet-xp1, helmet-health2 |
| Roman weapons | sword-{unit}{tier} or lance-{unit}{tier} | sword-legionaire1, lance-caesaris3 |
| Gaul weapons | lance-{unit}{tier}, bow-{unit}{tier}, etc. | lance-phalanx1, bow-theutates2 |
| Teuton weapons | club-{unit}{tier}, spear-{unit}{tier}, etc. | club-clubswinger1, hammer-paladin3 |
| Left-hand items | Simple name + tier | map1, pennant2, standard3, shield2 |
| Armour | {type}-armor{tier} | health-armor1, strength-armor3 |
| Boots | boots-{type}{tier} | boots-health1, boots-speedarmy2 |
| Egyptian weapons | {type}-{unit}{tier} (camelCase) | club-slaveMilitia1, khopesh-warrior3 |
| Hun weapons | {type}-{unit}{tier} (camelCase) | axe-mercenary1, sword-steppeRider3 |
| **Spartan weapons** | **item{id}** | item149 through item163 |
| Viking weapons | {type}-{unit}{tier} | axe-norseman1, sword-valkyrie3 |

### What Is NOT in the Mapping

- IDs 70-72: Gap (no items defined)
- IDs 103-105: Horses (rendered as DOM elements, not canvas overlays)
- IDs 106-114: Consumables (no visual overlay)
- IDs 145-148: Resources (skipped)

---

## 6. Item Icons (Inventory UI)

### Icon File Locations

| Location | Count | Used By |
|----------|-------|---------|
| apps/web/public/hero-assets/items/item{id}.png | 491 | HeroItemIcon component |
| apps/web/public/hero-assets/v2/icons/item{id}.png | 175 | V2 icon variants |

### How Icons Are Loaded

**File:** apps/web/app/(game)/(village-slug)/(hero)/components/hero-item-icon.tsx

Uses item.imageId, NOT item.id.

### Empty Slot Icons

Located at apps/web/public/hero-assets/slots/:
- slotHelmet_medium.png
- slotBody_medium.png
- slotShoes_medium.png
- slotHorse_medium.png
- slotBag_medium.png

---

## 7. Compact Positions System

### What Are Compact Positions?

Pre-computed {x, y, w, h} rectangles that tell the renderer WHERE to draw each sprite on the 875x1574 canvas. These are derived from Unity sprite metadata (rect, pivot, offset).

### File Locations

| File | Entries | Path |
|------|---------|------|
| compact-positions-male.json | ~575 | apps/web/public/v2-overlays/ |
| compact-positions-female.json | ~751 | apps/web/public/v2-overlays/ |
| unity-sprite-map.json | 47,334 lines | apps/web/public/v2-overlays/ |

### JSON Structure

`json
{
  "sprite-name": {"x": 150, "y": 110, "w": 85, "h": 1393},
  ...
}
`

- x, y: Top-left corner position on the 875x1574 canvas
- w, h: Width and height to draw the sprite (the small PNG gets STRETCHED to these dimensions)

### How Positions Are Computed from Unity Metadata

Given Unity metadata for a sprite:
`json
{
  "m_Rect": {"m_X": 150.03, "m_Y": 71.08, "m_Width": 84.93, "m_Height": 1392.85},
  "m_Pivot": {"m_X": 0.5, "m_Y": 0.514}
}
`

The compact position is:
`
compact_x = round(m_Rect.m_X)
compact_y = round(787 - (1 - m_Pivot.m_Y) * m_Rect.m_Height)
compact_w = round(m_Rect.m_Width)
compact_h = round(m_Rect.m_Height)
`

Key constants:
- Canvas height: 1574
- Grip/hand point Y: 787 (half of 1574)
- The formula ensures the weapon grip point aligns with the hand at Y=787

### Unity Metadata File Naming Convention

| File | Atlas Tag | Content |
|------|-----------|---------|
| item{id}.json | Usually HeroMale | Male sprite metadata |
| item{id}_0.json | Usually HeroFemale | Female sprite metadata |

**WARNING:** The atlas tag is authoritative, NOT the filename. For some items (157, 158, 159, 162), the tags are reversed:
- item157.json -> HeroFemale (not Male!)
- item157_0.json -> HeroMale (not Female!)
- item158.json -> HeroFemale
- item159.json -> HeroFemale
- item162.json -> HeroFemale

Always check m_AtlasTags to determine gender, not the filename.

---

## 8. Atlas Loader - How Sprites Are Loaded and Drawn

### File: atlas-loader.ts (468 lines)

### Path Constants

`	ypescript
BASE_PATH = '/hero-assets/v2/textures'     // Atlas textures
BASE_PATH_V2 = '/hero-assets/v2'           // V2 base
`

### Cache Mechanisms

| Cache | Type | Key Format | Purpose |
|-------|------|------------|---------|
| jsonCache | Map | v2-{gender}-{featureType}-{color} | Atlas JSON metadata |
| imageCache | Map | img-v2-{gender}-{featureType}-{color} | Atlas PNG images |
| v2SpriteCache | Map | v2-sprite-{gender}-{spriteName} | Individual equipment PNGs |
| unityOffsetsCache | Record | {gender} | Unity sprite offsets |
| equipPosCache | Record | {gender} | Compact positions |

### Key Functions

#### loadV2SpriteImage(gender, spriteName) - Line 148

Loads individual equipment PNGs from /V3 Hero/{Male|Female}/.

`	ypescript
const folder = gender === 'female' ? 'Female' : 'Male';
const basePath = /V3 Hero/;

// Try exact name first, then with _1 suffix (V3 Hero naming)
let img = await tryLoad(${basePath}/.png);
if (!img) {
  img = await tryLoad(${basePath}/_1.png);
}
`

The fallback to _1.png is important - some sprites only exist with the _1 suffix.

#### drawEquipmentFromAtlas(ctx, gender, spriteName, dx?, dy?) - Line 445

This is the main function that draws equipment overlays on the canvas:

1. Loads compact positions from /v2-overlays/compact-positions-{gender}.json
2. Looks up position for the sprite name (tries both spriteName and spriteName + "_1")
3. Loads the PNG via loadV2SpriteImage(gender, spriteName)
4. Draws with: ctx.drawImage(img, destX, destY, pos.w, pos.h)
5. Returns true if successfully drawn, false otherwise

The dx, dy parameters allow offset adjustments (used for head crop mode).

#### loadEquipPositions(gender) - Line 418

Fetches and caches the compact positions JSON:
`	ypescript
const url = /v2-overlays/compact-positions-.json;
const data = await fetch(url).then(r => r.json());
`

#### createAtlasDrawer(gender, skinColor, hairColor, eyeColor, bodyArmor?) - Line 284

Creates a drawer function for packed atlas textures (body parts). This handles:
- Loading 5 atlas types: skin, hair, eye, tribeColor, tattoo
- Building a nameMap (sprite name -> atlas frame)
- Handling rotated/non-rotated frames
- Using spriteSourceSize for positioning

### Error Handling

All load functions return null on error (graceful degradation). The hero will render without missing layers rather than crashing.

---

## 9. Hero Avatar Renderer - The Compositing Pipeline

### File: hero-avatar-renderer.ts (341 lines)

### Canvas Constants

`	ypescript
CANVAS_WIDTH = 875
CANVAS_HEIGHT = 1574
HEAD_CROP = { x: 310, y: 150, w: 254, h: 334 }
`

### renderHeroAvatar Function - Line 118

This is the main rendering function. It composites the hero in **back-to-front** order:

| Step | Layer | Z-Order | Description |
|------|-------|---------|-------------|
| 1 | Back Hair | - | Behind the head |
| 2 | Base Skin | - | Base body silhouette |
| 3 | Tribal Clothing | - | Body armor/clothing |
| 4 | Arms | - | Left and right arm states |
| 5 | Boots | z=2 | Equipment overlay |
| 6 | Body Armor | z=3 | Equipment overlay |
| 7 | Face Features | - | Ears, jaw, eyes, mouth, nose, brows |
| 8 | Left Hand Item | z=4 | Maps, flags, shields, horns |
| 9 | Right Hand Item | z=5 | Weapons |
| 10 | Tattoo | - | On top of weapons |
| 11 | Scar | - | After tattoo |
| 12 | Front Hair | - | Helmet variant or hidden |
| 13 | Beard | - | After front hair |
| 14 | Helmet | z=6 | Drawn on top of everything |

Key rendering details:
- Horse (z=0) is intentionally skipped on canvas - rendered as DOM element
- Equipment overlays only drawn in mode === 'body' (not in mode === 'head')
- Head mode uses crop transform for zoomed-in head view

### How Equipment Is Drawn

For each equipment layer, the renderer calls:
`	ypescript
await drawEquipmentFromAtlas(ctx, gender, spriteName);
`

This function:
1. Loads the compact position {x, y, w, h} for the sprite
2. Loads the PNG from /V3 Hero/{Male|Female}/{spriteName}.png
3. Draws it stretched to the compact position dimensions

---

## 10. Canvas System Details

### Canvas Dimensions

- Width: 875 pixels
- Height: 1574 pixels
- Grip/hand point: (437.5, 787.0) - center X, half height

### Why These Dimensions?

The canvas is sized to fit a full-body hero character with room for:
- Weapons that extend far left/right (up to 757px wide for axe-berserk3)
- Spears/lances that extend far up (height ~1400px for narrow weapons)
- Body armor that may be full-width (875px for health-armor2/3)

### Rendering Context

The hero is drawn using HTML5 Canvas 2D context (ctx). All sprites are drawn with:
`	ypescript
ctx.drawImage(image, x, y, width, height);
`

Where x, y, width, height come from the compact positions JSON.

---

## 11. Gender System - Male vs Female

### Two Gender Variants

Every hero item needs TWO separate visual variants:

1. **Male variant** - Used when hero gender is male
2. **Female variant** - Used when hero gender is female

### Why Separate Variants?

Male and female heroes have different:
- Body proportions (width, height)
- Arm positions (weapons held at different angles/positions)
- Hair styles (different hair sprites)
- Clothing fit (different clothing sprites)

### How Gender Affects Rendering

1. **Compact positions** are different for each gender (separate JSON files)
2. **PNG files** are different for each gender (separate directories)
3. **Atlas textures** are different for each gender (separate atlas files)

### File Organization by Gender

`
apps/web/public/
  V3 Hero/
    Male/           <- 576 equipment PNGs for male heroes
      item149.png
      item150.png
      sword-legionaire1.png
      ...
    Female/         <- 760 equipment PNGs for female heroes
      item149.png
      item150.png
      sword-legionaire1.png
      ...
  v2-overlays/
    compact-positions-male.json     <- Male draw positions
    compact-positions-female.json   <- Female draw positions
    unity-sprite-map.json           <- Both genders' Unity metadata
  hero-assets/v2/textures/
    male-skinColor-skin1.json/.png  <- Male body atlas
    female-skinColor-skin1.json/.png <- Female body atlas
    ...
`

### Critical Rule: Never Share PNGs Between Genders

Each gender MUST have its own PNG. The same weapon looks different when held by male vs female hero (different arm position, different scale). Putting the same PNG in both directories will cause visual glitches.

---

## 12. Arm Pose System

### Right Arm States

**File:** hero-avatar-renderer.ts, getRightArmState() - Line 37

| State | Condition | Visual |
|-------|-----------|--------|
| armBase | No right-hand item | Arm at rest |
| armUp | Spear, lance, staff, or specific item IDs | Arm raised holding weapon up |
| armFist | All other weapons | Arm with clenched fist holding weapon |

### Left Arm States

**File:** hero-avatar-renderer.ts, getLeftArmState() - Line 67

| State | Condition | Visual |
|-------|-----------|--------|
| armBase | No left-hand item | Arm at rest |
| armUp | Pennant or Standard (flags) | Arm raised holding flag up |
| armFist | All other left-hand items | Arm with clenched fist |

### Spear Item IDs (armUp pose)

`	ypescript
const SPEAR_ITEM_IDS = new Set([
  149, 150, 151,  // Hoplite spears
  152, 153, 154,  // Shieldsman spears
  161, 162, 163,  // Corinthian Crusher spears
]);
`

### Arm State Naming Convention

The arm state determines which sprite variant is loaded:
- armBase -> armBaseR-{gender}.png (right) or armBaseL-{gender}.png (left)
- armUp -> armUpR-{gender}.png (right) or armUpL-{gender}.png (left)
- armFist -> armFistR-{gender}.png (right) or armFistL-{gender}.png (left)

---

## 13. Source Assets (Unity Extracted)

### Source Locations (NOT in the game repo)

| Location | Content | Count |
|----------|---------|-------|
| C:\Users\Mohamed\Downloads\Assets\Sprite\ | Extracted PNG sprites | 7,754 files |
| C:\Users\Mohamed\OneDrive\Desktop\Hero\3rd try\Assets\Sprite\ | Unity .meta JSON files | 7,436 files |

### Unity Metadata Files

For each game item with ID N:
- item{N}.json - Primary sprite (usually HeroMale)
- item{N}_0.json - Secondary sprite (usually HeroFemale)

**Important:** Always check m_AtlasTags field to determine gender. The filename convention (no suffix = male, _0 = female) is NOT always correct.

### Extracting New Sprites from Unity

The process to extract a new sprite from Unity metadata:

1. Read item{N}.json to get m_Rect (position in atlas) and m_AtlasTags (gender)
2. Read item{N}_0.json for the other gender
3. Match PNG widths to rect widths to determine which source PNG goes to which gender
4. Copy the PNG to the correct V3 Hero directory
5. Compute compact positions using the formula in Section 7
6. Add entries to both compact-positions-male.json and compact-positions-female.json

### Width-Matching Technique

When you have two source PNGs and need to determine which is male vs female:

1. Read the Unity rects for both genders
2. The PNG whose width matches the Male rect width is the Male variant
3. The PNG whose width matches the Female rect width is the Female variant

Example for item 149:
- item149 #15210.png (69px wide) matches Male rect width 69 -> Male
- item149.png (200px wide) matches Female rect width 200 -> Female

---

## 14. How to Add New Items - Step-by-Step

### Prerequisites

- Unity metadata files (.json) for the new items
- Extracted PNG sprites for both genders
- Understanding of which slot the item goes in

### Step 1: Define the Item in items.ts

**File:** packages/game-assets/src/items.ts

For auto-generated tribe weapons, add to the generateTribeWeapons call:

`	ypescript
// Example: Adding a new tribe "persians" with 5 units
const persianWeapons = generateTribeWeapons('persians', NEW_START_ID, [
  { name: 'Swordsman', atk: 40, def: 20, tier1: 'Bronze Sword', tier2: 'Iron Sword', tier3: 'Steel Sword' },
  // ... 5 units total
]);
`

For hand-coded items, add directly to the items array with the full HeroItem shape.

### Step 2: Add to hero-asset-mapping.ts

**File:** packages/game-assets/src/hero-asset-mapping.ts

`	ypescript
export const heroAssetMapping: Record<number, string> = {
  // ... existing entries ...
  NEW_ID: 'sprite-name',  // e.g., 'sword-swordsman1'
};
`

### Step 3: Copy Gender-Specific PNGs

Copy the correct source PNGs to:

`
apps/web/public/V3 Hero/Male/{spriteName}.png     <- Male variant
apps/web/public/V3 Hero/Female/{spriteName}.png   <- Female variant
`

**NEVER** copy the same PNG to both directories. Each gender needs its own PNG.

### Step 4: Add Compact Positions

Add entries to BOTH compact position files:

**File:** apps/web/public/v2-overlays/compact-positions-male.json
`json
"sprite-name": {"x": 150, "y": 110, "w": 85, "h": 1393}
`

**File:** apps/web/public/v2-overlays/compact-positions-female.json
`json
"sprite-name": {"x": 200, "y": 100, "w": 200, "h": 1400}
`

Compute positions using the formula from Section 7.

### Step 5: Update Arm Pose Logic (if needed)

**File:** hero-avatar-renderer.ts

If the new item requires a special arm pose (like armUp for spears), add its ID to the appropriate set:

`	ypescript
const SPEAR_ITEM_IDS = new Set([
  // ... existing IDs ...
  NEW_ID,  // Add here if it needs armUp pose
]);
`

### Step 6: Verify Item Icon Exists

Check that apps/web/public/hero-assets/items/item{imageId}.png exists. If not, you need to add it.

### Step 7: Test

1. Run the dev server
2. Equip the new item on a hero
3. Check both male and female heroes
4. Verify the overlay appears at the correct position
5. Verify the arm pose is correct

---

## 15. How to Fix Broken Items

### Common Issues and Fixes

#### Issue: Item not appearing on hero

**Checklist:**
1. Is the item defined in items.ts?
2. Is there an entry in hero-asset-mapping.ts for this ID?
3. Does the PNG exist at V3 Hero/{Male|Female}/{spriteName}.png?
4. Is there an entry in compact-positions-{gender}.json?
5. Is the sprite name correct (check for typos)?

#### Issue: Item appears in wrong position

**Checklist:**
1. Verify the compact position x, y, w, h values
2. Check that male and female positions are NOT swapped (common for reversed atlas tags)
3. Verify the grip point formula: compact_y = round(787 - (1 - pivot_y) * h)

#### Issue: Item looks wrong/stretched/distorted

**Checklist:**
1. Verify the correct PNG is in the correct gender directory
2. Check that the PNG dimensions roughly match the compact position w, h (ratio should be similar)
3. For items where small PNGs get stretched to large rects, verify the PNG is the correct variant

#### Issue: Item icon missing in inventory

**Checklist:**
1. Does apps/web/public/hero-assets/items/item{imageId}.png exist?
2. Is the imageId field correct in the item definition?

#### Issue: Wrong arm pose

**Checklist:**
1. Check if the item ID is in the correct set (SPEAR_ITEM_IDS for armUp)
2. Check the sprite name pattern (spear-*, lance-*, staff-* get armUp automatically)
3. Bows with tier 1 get armFist, tier > 1 get armUp

---

## 16. Known Issues and Missing Pieces

### Confirmed Issues

1. **Viking weapons have uniform power values:** All Viking weapons (164-178) have heroBonus power=250 regardless of tier. This appears to be a bug/placeholder since tier 1 and tier 3 get the same power value.

2. **No avatar rendering tests:** There are no test files for the hero avatar renderer, atlas-loader, or item-sprite-map modules. The rendering pipeline is entirely untested.

3. **No compact position generation scripts:** The compact-positions JSON files appear to have been generated by an external tool that is NOT in this repository. There is no way to regenerate them from Unity metadata within this codebase.

4. **Egyptian weapon naming inconsistency:** Entry 124-126 uses spear-anhorgaurd (typo for "anhorguard") while the actual sprite name may differ.

5. **Items 70-72 gap:** These IDs are intentionally skipped. Any new left-hand items should use IDs 82+ (or find the next available gap).

6. **Items 145-148 gap:** These are resource items (Lumber, Clay, etc.) that are intentionally skipped.

### Missing Pieces

1. **Visual verification tooling:** No way to visually verify all items render correctly without manually equipping each one in the game.

2. **Automated sprite validation:** No script to verify that all entries in hero-asset-mapping.ts have corresponding PNGs and compact positions.

3. **Unity metadata extraction pipeline:** The process of going from Unity .meta JSON files to compact positions is done manually. An automated pipeline would be valuable.

4. **Item icon consistency check:** No verification that imageId values in items.ts map to existing icon files.

---

## 17. File Reference Index

### Core Definition Files

| File | Purpose | Lines |
|------|---------|-------|
| packages/types/src/models/hero-item.ts | HeroItem type definition | ~81 |
| packages/game-assets/src/items.ts | All item definitions | 1,606 |
| packages/game-assets/src/hero-asset-mapping.ts | Item ID to sprite name mapping | 166 |

### Rendering Files

| File | Purpose | Lines |
|------|---------|-------|
| apps/web/.../hero-avatar/hero-avatar-renderer.ts | Main compositing pipeline | 341 |
| apps/web/.../hero-avatar/atlas-loader.ts | Sprite loading and drawing | 468 |
| apps/web/.../hero-avatar/item-sprite-map.ts | Slot-to-z-order mapping | 52 |

### Data Files

| File | Purpose | Size |
|------|---------|------|
| apps/web/public/v2-overlays/compact-positions-male.json | Male draw positions | ~575 entries |
| apps/web/public/v2-overlays/compact-positions-female.json | Female draw positions | ~751 entries |
| apps/web/public/v2-overlays/unity-sprite-map.json | Raw Unity metadata | 47,334 lines |

### Asset Directories

| Directory | Content | Count |
|-----------|---------|-------|
| apps/web/public/V3 Hero/Male/ | Male equipment PNGs | ~576 |
| apps/web/public/V3 Hero/Female/ | Female equipment PNGs | ~760 |
| apps/web/public/hero-assets/items/ | Item inventory icons | 491 |
| apps/web/public/hero-assets/v2/icons/ | V2 item icons | 175 |
| apps/web/public/hero-assets/v2/textures/ | Packed atlas textures | 144 files |

### Source Asset Locations (NOT in repo)

| Location | Content | Count |
|----------|---------|-------|
| C:\Users\Mohamed\Downloads\Assets\Sprite\ | Extracted PNG sprites | 7,754 |
| C:\Users\Mohamed\OneDrive\Desktop\Hero\3rd try\Assets\Sprite\ | Unity .meta JSON | 7,436 |

---

## 18. Reference Files in This Folder

The following files have been copied into this hero docs folder for reference:

| File | Source | Purpose |
|------|--------|---------|
| compact-positions-male.json | apps/web/public/v2-overlays/ | Male draw positions snapshot |
| compact-positions-female.json | apps/web/public/v2-overlays/ | Female draw positions snapshot |
| hero-asset-mapping.ts | packages/game-assets/src/ | Item-to-sprite mapping |
| hero-item-type.ts | packages/types/src/models/ | HeroItem type definition |

---

*End of Hero Items System documentation.*
