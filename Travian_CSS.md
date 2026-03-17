# Travian dorf2 Building UI Analysis

## Implementation Status: ✅ Complete

The village building UI has been implemented to match Travian's dorf2 structure.

## Building Image Paths

**Night theme:** `Gpack/367/img_ltr/themes/night/buildings/{tribe}/g{gid}.png`
**Day theme:** `Gpack/367/img_ltr/themes/default/buildings/{tribe}/g{gid}.png`

### Tribe Folder Names (CSS classes)

| Tribe | Folder Name | CSS Class |
|-------|-------------|-----------|
| Teutons | teuton | teuton |
| Gauls | gaul | gaul |
| Romans | roman | roman |
| Egyptians | egyptian | egyptian |
| Huns | hun | hun |
| Spartans | spartan | spartan |
| Natars | natars | natars |

Example:
- Night Main Building (Teuton): `Gpack/367/img_ltr/themes/night/buildings/teuton/g15.png`
- Day Main Building (Teuton): `Gpack/367/img_ltr/themes/default/buildings/teuton/g15.png`
- Night Main Building (Gaul): `Gpack/367/img_ltr/themes/night/buildings/gaul/g15.png`

## Current Implementation

### Files Modified:
1. `apps/web/app/(game)/(village-slug)/(village)/components/occupied-building-field.tsx`
2. `apps/web/app/(game)/(village-slug)/(village)/components/empty-building-field.tsx`

### Features Implemented:

#### 1. Dynamic Tribe Support
- Uses `useTribe()` hook to get player's tribe
- Maps Tribe types to Travian CSS class names:
  - `teutons` → `teuton`
  - `gauls` → `gaul`
  - `romans` → `roman`
  - `egyptians` → `egyptian`
  - `huns` → `hun`
  - `spartans` → `spartan`

#### 2. Data Attributes (dorf2-compatible)
```tsx
data-aid={buildingFieldId}      // e.g., 19, 20, 21
data-gid={getGidFromBuildingId(buildingId)}  // e.g., 10, 15, 16
data-level={level}              // e.g., 1, 2, 3
data-building-id={buildingFieldId}
data-name={t(`BUILDINGS.${buildingId}.NAME`)}
```

#### 3. CSS Classes (dorf2-compatible)
```tsx
// Container classes
'building-slot'                           // Village building container
'aid${buildingFieldId}'                  // e.g., aid19, aid20
'g${gid}'                                 // e.g., g10, g15, g16
getTribeClass(tribe)                      // e.g., teuton, gaul, roman

// Inner anchor classes
'level'                                    // Indicates building has level
'colorLayer'                              // Provides color overlay
canUpgrade ? 'good' : 'notNow'            // Upgrade status
```

#### 4. Label Layer (Level Display)
```tsx
<div className="labelLayer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs lg:text-sm z-10">
  {level}
</div>
```

#### 5. Building Images
- Uses `BuildingBigImage` component from `app/components/building-icon`
- Tribe-specific building images via `tribe` prop
- Classes: `g{gid} {tribe}` (e.g., `g15 teuton`)

#### 6. Size Classes
- Village buildings (id >= 19): `size-12 lg:size-20`
- Resource fields (id <= 18): `size-10 lg:size-16`

### GID Mapping Function
```tsx
const getGidFromBuildingId = (bid: string): string => {
  const gidMap: Record<string, string> = {
    warehouse: '10',
    granary: '11',
    blacksmith: '12',
    armoury: '13',
    stable: '14',
    workshop: '15',
    tournament_square: '16',
    main_building: '15',
    embassy: '18',
    marketplace: '17',
    barracks: '19',
    academy: '22',
    cranny: '23',
    // ... etc
  };
  return gidMap[bid] || '0';
};
```

### Empty Building Slots
- Added dorf2-compatible classes: `emptyBuildingSlot`, `a{buildingFieldId}`, `g0`, `aid{buildingFieldId}`
- Data attributes: `data-aid`, `data-gid="0"`, `data-level="0"`

## SVG ViewBox Sizes

| Building Type | Width | Height | ViewBox |
|---------------|-------|--------|---------|
| Standard buildings | 120 | 120 | `0 0 120 120` |
| Rally Point (g16) | 125 | 160 | `0 0 125 160` |
| Wall (g32) | 794 | 540 | `0 0 794 540` (split into top/bottom) |

## HTML Structure (dorf2.php)

```html
<div class="buildingSlot a{buildingFieldId} g{gid} aid{buildingFieldId} {tribe}"
     data-aid="{buildingFieldId}"
     data-gid="{gid}"
     data-building-id="{buildingId}"
     data-name="{buildingName}">
  <a href="/build.php?id={buildingFieldId}&gid={gid}"
     class="level colorLayer good/notNow aid{buildingFieldId} {tribe}"
     data-level="{level}"
     title="Building Name <span class='level'>Level {level}</span>||Cost for upgrading...">
    <div class="labelLayer">{level}</div>
  </a>
  <img src="/img/x.gif" class="building g{gid} {tribe}" alt="" />
  <svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape g{gid}">
```

## CSS Classes

### Container Classes (buildingSlot)
- `a{buildingFieldId}` - e.g., a19, a20, a21...
- `g{gid}` - e.g., g10, g11, g15...
- `aid{buildingFieldId}` - e.g., aid19, aid20...
- `{tribe}` - teuton, roman, gaul, egyptian, etc.

### Anchor Classes
- `level` - indicates building has a level
- `colorLayer` - provides color overlay
- `good` - can upgrade (green indicator)
- `notNow` - cannot upgrade (red/disabled indicator)
- `emptyBuildingSlot` - for empty building plots

## Data Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| data-aid | Building field ID | 19, 20, 21... |
| data-gid | Building type ID | 10, 11, 15, 16... |
| data-level | Current level | 1, 2, 3... |
| data-building-id | Internal building ID | 302979, 302980... |
| data-name | Building display name | "Main Building", "Warehouse"... |

## GID Reference Table

| GID | Building |
|-----|----------|
| 1 | Woodcutter (resource) |
| 2 | Clay Pit (resource) |
| 3 | Iron Mine (resource) |
| 4 | Cropland (resource) |
| 5 | Sawmill |
| 6 | Brickyard |
| 7 | Iron Foundry |
| 8 | Grain Mill |
| 9 | Bakery |
| 10 | Warehouse |
| 11 | Granary |
| 12 | Blacksmith |
| 13 | Armoury |
| 14 | Stable |
| 15 | Workshop / Main Building |
| 16 | Rally Point / Tournament Square |
| 17 | Marketplace |
| 18 | Embassy |
| 19 | Barracks |
| 22 | Academy |
| 23 | Cranny |
| 24 | Town Hall |
| 25 | Residence |
| 26 | Palace |
| 27 | Treasury |
| 28 | Trade Office |
| 29 | Great Barracks |
| 30 | Great Stable |
| 31 | City Wall |
| 32 | Earth Wall |
| 33 | Stone Wall |
| 34 | Palisade / Stonemason's Lodge |
| 35 | Horse Drinking Trough |
| 36 | Great Warehouse |
| 37 | Great Granary |
| 40 | World Wonder |

## Building Field IDs

### Resource Fields (dorf1): 1-18
### Village Buildings (dorf2): 19-44

| ID | Typical Building |
|----|------------------|
| 19 | Cranny |
| 20 | Warehouse |
| 21 | Granary |
| 22 | Empty / Embassy |
| 23 | Marketplace |
| 24 | Empty / Embassy |
| 25 | Embassy |
| 26 | Main Building |
| 27-29 | Empty slots |
| 30 | Academy |
| 31 | Empty slot |
| 32 | Barracks |
| 33-36 | Empty slots |
| 37 | Stonemason's Lodge |
| 38 | Empty slot |
| 39 | Rally Point |
| 40 | Wall (bottom) |
| 40 | Wall (top) |

## Label Layer

The level indicator displays as:
```html
<div class="labelLayer">{level}</div>
```
Position: Centered over the building icon, white bold text.

## Building States

- **good**: Can upgrade (resources available, not constructing)
- **notNow**: Cannot upgrade (insufficient resources or constructing)
- **emptyBuildingSlot**: Empty plot waiting for construction
