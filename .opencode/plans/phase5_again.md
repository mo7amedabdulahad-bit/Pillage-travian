# Phase 5: Special Building Implementation - Revised Plan

## Critical Discovery: Fixed Position Buildings

Based on analysis of Travian's dorf2.php, three building fields have fixed positions and cannot be replaced by other buildings:
1. **Main Building** (aid=26, gid=15) - Central building, always buildable
2. **Rally Point** (aid=39, gid=16) - Troop gathering point, always buildable  
3. **Wall** (aid=40, gid=32) - Village perimeter, split into top/bottom graphics

These fields must be handled specially in the village view layout.

## Phase 5 Tasks: Special Building Implementation

### 1. Main Building & Rally Point Positioning ✅
- Main Building (aid26): Fixed position, standard 120x120 size
- Rally Point (aid39): Fixed position, larger 125x160 size
- Both use standard building rendering but with locked positions
- Remove from general building field processing, handle as fixed elements

### 2. Wall Implementation 🔄
- Wall (aid40): Split rendering - TOP and BOTTOM graphics
- Top: g32Top.png (and variants: _city, _shore, etc.)
- Bottom: g32Bottom.png (and variants: _city, _shore, etc.)
- Wall spans the entire village perimeter, not a point position
- Must render as background layers, not interactive building fields
- Field 40 must be completely removed from regular building field rendering

### 3. Special Building Constraints
- Main Building: Cannot be demolished or replaced
- Rally Point: Cannot be demolished or replaced  
- Wall: Cannot be demolished or replaced, always present
- These fields should show as always-available for upgrade (if not max level)
- No building construction animations (these are permanent structures)

### 4. Technical Implementation Requirements

#### A. Data Handling
- Exclude aid=26, aid=39, aid=40 from dynamic building field arrays
- Create fixed position data structures for these three buildings
- Maintain their building IDs and levels from village data

#### B. Rendering Approach
1. **Main Building & Rally Point**:
   - Render as standard BuildingImage components
   - Position fixed at their exact coordinates from Travian layout
   - Apply standard building interactions (hover, click, upgrade)

2. **Wall**:
   - Create WallBackground component that renders:
     * Wall top image as full-width top banner
     * Wall bottom image as full-width bottom banner
   - Position absolutely behind all other building fields
   - Make clickable to navigate to wall details (aid=40)
   - Support day/night themes and tribal variants
   - Handle wall variants (_city, _shore, _city_watchTowers, etc.)

#### C. Positioning System
- Extract exact pixel coordinates from Travian's dorf2.php/css_ltr/js
- Convert to percentage-based positioning for responsive scaling
- Main Building: Specific x,y coordinates from aid26 buildingSlot
- Rally Point: Specific x,y coordinates from aid39 buildingSlot
- Wall: Full-width top/bottom positioning (not point-based)

#### D. Size Specifications
- Main Building: 120x120px (standard building size)
- Rally Point: 125x160px (wider and taller than standard)
- Wall Top: 794x??px (full width, height varies by variant)
- Wall Bottom: 794x??px (full width, height varies by variant)

### 5. Component Structure

#### New Components:
- `FixedBuilding` - For Main Building and Rally Point (locked positions)
- `WallBackground` - Renders wall top/bottom as background layers
- `WallVariantResolver` - Determines correct wall variant based on village terrain

#### Updated Components:
- `VillageCanvas`: Now contains WallBackground as background layer
- `BuildingField` processing: Excludes aids 26, 39, 40 from dynamic rendering
- `occupied-building-field.tsx`: Special handling for aids 26, 39 (though they use FixedBuilding)

### 6. Implementation Dependencies

Requires understanding of:
- Exact pixel positions from Travian's dorf2.php buildingSlot elements
- CSS positioning system used in @Gpack\367\css_ltr\
- JavaScript behavior from @Gpack\367\js\ for building interactions
- Wall variant selection logic (city/shore/watchtowers based on village location)

### 7. Acceptance Criteria

- [ ] Main Building renders at exact Travian position with correct size
- [ ] Rally Point renders at exact Travian position with correct size (125x160)
- [ ] Wall renders as full-height top/bottom background layers
- [ ] Special buildings cannot be selected for replacement/demolition
- [ ] Special buildings show upgrade UI when applicable
- [ ] Wall is clickable to navigate to wall details (aid=40)
- [ ] All special buildings respect day/night theme switching
- [ ] Wall variants display correctly based on village terrain
- [ ] Regular building fields (1-25, 27-38, 41-44) render normally around specials
- [ ] Responsive scaling maintains correct positional relationships
- [ ] Hover effects, tooltips, and upgrade indicators work correctly

### 8. Integration Points

- Update building field processing to skip aids 26, 39, 40
- Modify VillageCanvas to include WallBackground layer
- Create FixedBuilding component for aids 26 and 39
- Update page.tsx to handle special building rendering
- Ensure building field positions array excludes the special aids