# Buildings UI Implementation Plan

This document outlines the phased approach to implementing the buildings UI based on Travian's approach, using the provided Gpack assets.

## Overview

The implementation will follow Travian's building field system with:
- Day/Night theme support (default/night themes)
- Tribal variations (teuton, roman, gaul, egyptian, hun, spartan, viking, natar)
- Building field positioning and layout
- Hover effects and interactions
- Responsive design matching Travian's canvas approach

## Phase 1: Foundation & Asset Mapping ✅ COMPLETED

### Tasks:
1. [x] Create mapping of building IDs to their corresponding image numbers for both day and night themes
2. [x] Establish the base path structure for building images:
   - Day: `/graphic-packs/day/buildings/{tribe}/g{id}.png`
   - Night: `/graphic-packs/night/buildings/{tribe}/g{id}.png`
3. [x] Identify special cases (Wall top/bottom, wonder stages, waterwork variants)
4. [x] Extract building IDs and their corresponding image numbers from Travian's dorf1.php/dorf2.php
5. [x] Create comprehensive building ID to image mapping table

### Deliverables:
- **BUILDING_GID_MAP** in `packages/game-assets/src/building-icons.ts` - Maps BuildingId to GID (image number)
- **WALL_GID_MAP** - Maps wall building IDs to their GIDs
- **Path functions** updated to support theme parameter:
  - `getBuildingIconPath(tribe, buildingId, size, theme)`
  - `getBuildingBigImagePath(tribe, buildingId, theme)`
  - `getBuildingImagePath(tribe, buildingId, theme)`
  - `getWallTopImagePath(tribe, theme)`
  - `getWallBottomImagePath(tribe, theme)`

### Findings:

#### Building GID Mapping:
| GID | Building ID |
|-----|-------------|
| 1 | WOODCUTTER |
| 2 | CLAY_PIT |
| 3 | IRON_MINE |
| 4 | WHEAT_FIELD |
| 5 | SAWMILL |
| 6 | BRICKYARD |
| 7 | IRON_FOUNDRY |
| 8 | GRAIN_MILL |
| 9 | BAKERY |
| 10 | WAREHOUSE |
| 11 | GRANARY |
| 13 | SMITHY |
| 14 | TOURNAMENT_SQUARE |
| 15 | MAIN_BUILDING |
| 16 | RALLY_POINT |
| 17 | MARKETPLACE |
| 18 | EMBASSY |
| 19 | BARRACKS |
| 20 | STABLE |
| 21 | WORKSHOP |
| 22 | ACADEMY |
| 23 | CRANNY |
| 24 | TOWN_HALL |
| 25 | RESIDENCE |
| 27 | TREASURY |
| 28 | TRADE_OFFICE |
| 29 | GREAT_BARRACKS |
| 30 | GREAT_STABLE |
| 31 | ROMAN_WALL |
| 32 | TEUTONIC_WALL |
| 33 | GAUL_WALL |
| 34 | WATERWORKS (alternate) |
| 35 | BREWERY / EGYPTIAN_WALL |
| 36 | HUN_WALL |
| 37 | HEROS_MANSION |
| 38 | GREAT_WAREHOUSE / NATAR_WALL |
| 39 | GREAT_GRANARY |
| 40 | WONDER (stages 0-5) |
| 41 | SPARTAN_WALL |
| 46 | HORSE_DRINKING_TROUGH |
| 47 | NATURE_WALL |
| 49 | WATERWORKS (with ship variants) |

#### Special Cases Identified:
1. **Wall Buildings** - Have separate top/bottom pieces:
   - `g{gid}Top.png` and `g{gid}Bottom.png`
   - Multiple variants: `_city`, `_shore`, `_city_watchTowers`, `_shore_city`, etc.
2. **Wonder of the World** - Has multiple stage images: `g40_0.png` through `g40_5.png`
3. **Waterworks** - Has ship variants: `g49_tradeShip.png`, `g49_warShip.png`, `g49_raidShip.png`, `g49_decoyWarShip.png`
4. **Teahouse** - Special variant: `g35_teahouse.png`

#### Image Sizes:
- Regular images: 120x120 pixels
- Big images: 176x145 pixels (in `/big/` subfolder)

####Path Structure:
```
/graphic-packs/
├── day/
│   └── buildings/
│       ├── default/
│       │   └── big/
│       │       ├── g1.png (Woodcutter)
│       │       ├── g2.png (Clay Pit)
│       │       ├── g3.png (Iron Mine)
│       │       └── g4.png (Wheat Field)
│       └── {tribe}/
│           ├── g{gid}.png (regular size)
│           └── big/
│               └── g{gid}.png (big size)
└── night/
    └── buildings/
        └── {tribe}/
            └── g{gid}.png (regular size only)
```

### Stop Point: ✅ Phase 1 Complete - Ready for user review

---

## Phase 2: Building Field Component Implementation ✅ COMPLETED

### Tasks:
1. [x] Create BuildingField component that renders building positions
2. [x] Implement field layout based on Travian's coordinate system
3. [x] Add day/night theme switching capability
4. [x] Implement tribal building variations
5. [x] Add loading states and error handling for images
6. [x] Create responsive container matching Travian's canvas dimensions

### Deliverables:
- **Updated `packages/game-assets/src/building-icons.ts`** with:
  - Theme-aware path functions (`getBuildingIconPath`, `getBuildingBigImagePath`, `getBuildingImagePath`)
  - Wall handling (walls use day theme images)
  - `isWallBuilding()` helper function
- **Updated `apps/web/app/components/building-icon.tsx`** with:
  - `useTheme()` hook for accessing current theme
  - Error handling with fallback display for broken images
  - `BuildingIcon`, `BuildingBigImage`, `BuildingImage` components with theme/tribe support
- **Updated `apps/web/app/(game)/(village-slug)/(village)/components/occupied-building-field.tsx`**:
  - Added `useTribe()` hook for tribe support
  - Added `BuildingImage` component for village buildings (slots 19-40)
  - Resource fields (slots 1-18) continue using CSS-based display
- **Updated `apps/web/app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-card.tsx`**:
  - Added `useTribe()` hook
  - Building cards now show correct tribal images

### Path Structure:
- **Day theme big images**: `/graphic-packs/day/buildings/{tribe}/big/g{gid}.png`
- **Night theme images**: `/graphic-packs/night/buildings/{tribe}/g{gid}.png`
- **Resource buildings**: Always use `/graphic-packs/day/buildings/default/big/g{gid}.png`
- **Walls**: Always use day theme big images (no night variants)
- **Icons**: Always use day theme paths (no night variants)

### Stop Point: ✅ Phase 2 Complete - Ready for user review

---

## Phase 3: Building Image Component & Asset Loading ✅ COMPLETED

### Tasks:
1. [x] Create BuildingImage component that handles day/night switching
2. [x] Implement image preloading and caching strategy
3. [x] Add error fallbacks for missing images
4. [x] Create tribal variant resolver
5. [x] Implement lazy loading for off-screen buildings
6. [x] Add support for building animations (no animations found in assets)

### Deliverables:
- **`apps/web/app/hooks/use-image-preloader.ts`** - New hook for image preloading and caching:
  - `preloadImage()` - Preload single image
  - `preloadImages()` - Preload multiple images
  - `useImagePreloader()` - Hook with loading state
  - `useBuildingPreloader()` - Hook specific for building images
- **`apps/web/app/components/building-icon.tsx`** - Enhanced components:
  - `ImageWithFallback` - Internal component with error handling and lazy loading
  - `BuildingBigImage` - Added `lazy` prop for lazy loading
  - `BuildingImage` - Added `lazy` prop for lazy loading
  - Intersection Observer for lazy loading off-screen images
  - Error fallbacks showing building ID when image fails

### Features:
- **Image Caching**: Images are cached in a Map to prevent duplicate requests
- **Lazy Loading**: Uses Intersection Observer with 100px rootMargin for pre-loading
- **Error Handling**: Shows fallback with building ID if image fails to load
- **Preloading**: Hook available for preloading images before they're needed

### Stop Point: ✅ Phase 3 Complete - Ready for user review

---

## Phase 4: Interactive Elements & Hover Effects ✅ COMPLETED

### Tasks:
1. [x] Implement hover effects matching Travian's style
2. [x] Add tooltip/showcase building information on hover
3. [x] Implement click handlers for building selection/upgrade
4. [x] Add building selection visual indicators
5. [x] Implement building construction/progress overlays
6. [ ] Add resource production indicators on fields (deferred - low priority)

### Deliverables:
- **Hover Effects** (`occupied-building-field.tsx`):
  - Building images scale up (1.1x) on hover
  - Brightness increases (1.1x) with drop shadow on hover
  - Smooth transitions (150ms duration)
  - Empty building fields have similar hover/active effects

- **Tooltip** (`building-field-tooltip.tsx`):
  - Shows building name and level
  - Displays upgrade costs
  - Shows construction timer when upgrading
  - Indicates if building is max level

- **Upgrade Indicator** (`building-upgrade-indicator.tsx`):
  - Level number displayed in circular badge
  - Upgrade icon shows on hover when upgrade available
  - Orange background when building is under construction
  - Click-to-upgrade functionality

- **Click Handlers**:
  - Click on building field navigates to building details
  - Click on upgrade button triggers upgrade action
  - Keyboard support (Enter key)

### Stop Point: ✅ Phase 4 Complete - Ready for user review

---

## Phase 5: Wall & Special Building Implementation 🔄 IN PROGRESS

### Tasks:
1. [x] Implement Wall top/bottom pieces as separate elements
2. [x] Remove wall (field 40) from regular building field rendering
3. [x] Create VillageCanvas component to render wall as background
4. [ ] Handle special building variants (Wonder stages, Waterwork ships)
5. [ ] Create building rotation/mirroring logic for wall corners
6. [ ] Implement special positioning for border buildings
7. [ ] Add wall connection logic (showing continuous walls)
8. [ ] Handle gate implementations

### Deliverables:
- **`packages/game-assets/src/village-page-assets.ts`** - New file for village page assets:
  - `getVillageBackgroundPath()` - Get village background path
  - `getWallTopPath()` - Get wall top image path with variant support
  - `getWallBottomPath()` - Get wall bottom image path with variant support
  - `getVillageAssets()` - Get all village assets for a tribe/theme
- **`apps/web/app/(game)/(village-slug)/(village)/components/village-canvas.tsx`** - New component:
  - Renders wall as background images (top and bottom)
  - Provides container for building fields
  - Makes wall clickable to navigate to wall details
- **`apps/web/app/(game)/(village-slug)/(village)/page.tsx`** - Updated:
  - Building field 40 (wall) removed from regular rendering
  - VillageCanvas wraps building fields for village view
- **`apps/web/app/(game)/(village-slug)/(village)/page.tsx`** - Updated:
  - Building field 40 (wall) removed from regular rendering
  - VillageCanvas wraps building fields for village view

### Wall Image Structure:
- Standard walls: `g{gid}Top.png` and `g{gid}Bottom.png`
- City variants: `g{gid}Top_city.png` and `g{gid}Bottom_city.png`
- Shore variants: `g{gid}Top_shore.png` and `g{gid}Bottom_shore.png`
- Watch tower variants: `g{gid}Top_city_watchTowers.png` and `g{gid}Bottom_city_watchTowers.png`

### Wall GID Mapping:
| Building | GID | Top/Bottom Files |
|----------|-----|-----------------|
| ROMAN_WALL | 31 | g31Top.png / g31Bottom.png |
| TEUTONIC_WALL | 32 | g32Top.png / g32Bottom.png |
| GAUL_WALL | 33 | g33Top.png / g33Bottom.png |
| EGYPTIAN_WALL | 35 | g35Top.png / g35Bottom.png |
| HUN_WALL | 36 | g36Top.png / g36Bottom.png |
| SPARTAN_WALL | 41 | g41Top.png / g41Bottom.png |
| NATAR_WALL | 38 | g38Top.png / g38Bottom.png |
| NATURE_WALL | 47 | g47Top.png / g47Bottom.png |

### Stop Point: 🔄 Phase 5 In Progress

---

## Phase 6: Performance Optimization & Final Integration

### Tasks:
1. [ ] Implement image sprite sheets where beneficial
2. [ ] Add virtual scrolling for large field sets
3. [ ] Implement CSS-based animations where possible
4. [ ] Add performance monitoring and debugging tools
5. [ ] Final integration with existing building data systems
6. [ ] Create comprehensive test suite

### Deliverables:
- Optimized building field rendering
- Performance benchmarks met
- Full integration with game systems
- Documentation and usage examples

### Final Stop Point: Complete system review and user acceptance testing

## Technical Details

### Image Path Patterns:
- Standard buildings: `/graphic-packs/{theme}/buildings/{tribe}/g{gid}.png`
- Big images: `/graphic-packs/{theme}/buildings/{tribe}/big/g{gid}.png`
- Resource buildings: `/graphic-packs/{theme}/buildings/default/big/g{1-4}.png`
- Wall top: `/graphic-packs/{theme}/buildings/{tribe}/g{gid}Top.png`
- Wall bottom: `/graphic-packs/{theme}/buildings/{tribe}/g{gid}Bottom.png`

### Theme Handling:
- Day theme: `/graphic-packs/day/...`
- Night theme: `/graphic-packs/night/...`

### Tribal Mapping:
- romans -> roman
- teutons -> teuton
- gauls -> gaul
- egyptians -> egyptian
- huns -> hun
- spartans -> spartan
- natars -> natar
- nature -> nature (for nature fields)

### Building Field Layout:
Based on Travian's dorf2.php, fields are arranged in a specific pattern with:
- Resource fields (positions 1-18) in dorf1 view
- Village buildings (positions 19-40) in dorf2 view
- Wall at position 32/40 (tribal dependent)

## Dependencies:
- Existing building data structures from @pillage-first/game-assets
- React functional components with hooks
- CSS modules or styled-components for styling
- Image optimization utilities

## Next Steps After Each Phase:
After completing each phase, the AI will stop and wait for user feedback/testing before proceeding to the next phase.