# Travian Village View Implementation Plan (Dorf2)

This document outlines the exact specifications required to replicate the Travian Legends (T4.6) village view buildings, including their precise positioning, sizing, and interactive canvases.

## 1. Core Container Specifications
To match the original UI, the village canvas must follow these dimensions:
- **Container ID:** `#villageContent`
- **Width:** `1280px`
- **Height:** `720px`
- **Positioning:** `relative`, `margin: 0 auto`.

## 2. Building Slot (a19-a40) Universal Styles
All building slots follow a standard base styling:
```css
.buildingSlot {
    width: 120px;
    height: 120px;
    position: absolute;
    pointer-events: none; /* Crucial: Div does not block clicks */
    user-select: none;
    z-index: 1;
}

/* Clickable elements inside the slot */
.buildingSlot a, 
.buildingSlot svg {
    pointer-events: auto; /* Enable clicks on the actual shape/link */
}
```

## 3. Precise Slot Coordinates (a19 - a40)
Based on extraction from `imports_compressed.css`, use these exact `left`, `top`, and `z-index` values:

| Slot ID | Left (px) | Top (px) | Z-Index | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **a19** | 381 | 222 | 19 | |
| **a20** | 475 | 178 | 17 | |
| **a21** | 586 | 163 | 15 | |
| **a22** | 705 | 177 | 17 | |
| **a23** | 791 | 232 | 20 | |
| **a24** | 323 | 275 | 23 | |
| **a25** | 838 | 292 | 24 | |
| **a26** | 438 | 282 | 25 | |
| **a27** | 345 | 425 | 32 | |
| **a28** | 316 | 357 | 27 | |
| **a29** | 651 | 226 | 21 | |
| **a30** | 449 | 361 | 27 | |
| **a31** | 596 | 283 | 23 | |
| **a32** | 533 | 415 | 32 | |
| **a33** | 839 | 367 | 32 | |
| **a34** | 439 | 477 | 36 | |
| **a35** | 670 | 415 | 29 | |
| **a36** | 771 | 448 | 33 | |
| **a37** | 551 | 496 | 39 | |
| **a38** | 669 | 483 | 38 | |
| **a39** | 732 | 307 | 28 | **Size:** 125x160 (Rally Point) |
| **a40** | 261 | 137 | 42 | **Size:** 794x540 (Village Wall) |

---

## 4. Interactive Canvas (SVG Shapes)
Each `buildingSlot` contains an SVG that acts as the pixel-perfect click target.

### Standard Structure (Occupied Field)
```html
<div class="buildingSlot a19 g23">
    <!-- Visual Image -->
    <img src="g23.png" class="building g23" />
    
    <!-- Interactive SVG Canvas -->
    <svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape">
        <g class="hoverShape">
            <!-- This path defines the mouse-over/clickable area -->
            <path d="..." onclick="..." />
        </g>
        <g class="highlightShape">
            <!-- This path appears on hover/selection -->
            <path d="..." />
        </g>
    </svg>
</div>
```

### Unoccupied Structure (Empty Field)
Empty fields use a shared "iso" (isometric) shape:
```html
<div class="buildingSlot a22 g0">
    <a href="/build.php?id=22" class="emptyBuildingSlot"></a>
    <svg width="120" height="120" viewBox="0 0 120 120" class="buildingShape iso">
        <path d="M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z" />
    </svg>
</div>
```

---

## 5. Resolving the Wall Overlap Issues
The **Village Wall (a40)** is the most common cause of "broken clicks" because:
- It covers a huge area (`794x540`).
- It has the highest `z-index` (`42`).

**Solution:**
1. **Pointer Events:** Ensure the `.a40` div has `pointer-events: none`.
2. **SVG Path Precision:** The wall's SVG `<path>` must only cover the actual visible wall parts.
3. **Layering:** By setting `pointer-events: none` on the container div and `pointer-events: auto` only on the SVG `<path>`, clicks will "pass through" the massive wall container and hit buildings behind it, unless the user specifically clicks on a wall segment.

## 6. Sizing Fix (Building Appearance)
If buildings look "smaller" than expected, check the **CSS scaling**:
- Travian often uses `transform: scale(0.8)` or similar for mobile responsiveness.
- To match the "Natural" Travian size, ensure the scaling on `#villageContent` is `1.0` or matches the browser's viewport scaling logic correctly.
- Ensure `img.building` has `width: 100%; height: auto;` within its `120x120` slot.

---

## 7. Extracted SVG Path Library (hoverShape)
Below are the exact paths extracted from `dorf2.php` for each building type (gid) or slot. Use these for the `<path d="...">` attribute.

| Slot / GID | Building Name | SVG Hover Path (`d` attribute) |
| :--- | :--- | :--- |
| **g23** (a19) | Cranny | `M42.75 60c15.31-2.35 28.15-7.84 36.45-19.1 9.52 10.65 14.52 22.67 14.54 36.22l-8.47 18.09-3.27 7.33a29.35 29.35 0 00-14.17 9.28L47 110.68c-9.42-2.14-17.73-5.76-23.78-12.38L24 82.83l4.24-12.55z` |
| **g10** (a20) | Warehouse | `M18.77 51.59a4.36 4.36 0 00-.57 1.91c-.1 1.4.3 2.5.8 2.5s1 7.1 1 18.8v18.7l9.3 4.7a93.79 93.79 0 008.81 3.8c8.23 3.27 11.08 11.26 23.46 8.73.23-.05 18.13-10.38 19.83-9.68 2.4.9 6.6.3 6.6-.9.1-.3.3-5.4.6-11.2l.6-10.7S82 69.14 84 57.5c1.8-1.1 1-2.2-3.7-4.9-5.1-2.8-7.2-4.1-11.3-6.7-2.44-1.58-4.72-2.49-6-2.26-12.49 2.36-24.83-1.79-25.43-1.59-2.39.78-18.49 9.13-18.8 9.54z` |
| **g11** (a21) | Granary | `M49.8 34c-9.91 4.2-17.86 10.08-23.66 17.82l1.72 51.07A60.59 60.59 0 0059 115.1a131 131 0 0029.21-19.79 76.16 76.16 0 00-.08-15C78.64 72.77 69.9 64.4 65.65 51.09 64.14 46.12 58.09 40.27 49.8 34z` |
| **g17** (a23) | Marketplace | `M20.9 53.6l-3 3.27s-5 10.23-5.64 10.43S8 84.7 8 86.3c0 1.84.28 3 1 3.75 1 .88 10.4 5.85 10.4 6.85 0 3.6 9.87 12.06 10.16 12.15s15.35 7.06 17.27 7.06 26.57 1.09 26.57 1.09 13.3-1.2 16.2-2.6a8.07 8.07 0 002.57-1.6c.64-.72 4.9-9.85 5.2-10.24.44-.57 6.23-10 6.43-11.43s1.5-2.6 3.7-3.4c4.3-1.6 6.3-5.6 4.4-9-1.5-2.9-3.4-4.9-4.7-4.9-.5 0-1.7-.9-2.8-2.1S96.47 62.39 89.07 59L75.9 52.6c-4.48-1.6-18.59-2.72-23.05-7.68.49 1.84-31.49 10.51-31.95 8.68z` |
| **g18** (a25) | Embassy | `M103.76 44.06c-6-.57-6.44-6.44-17.43-7.42v-.15.2l-5.66 7.6S37.7 50 37.1 50s-3.3 2.15-3.46 2.4S23.6 66.75 23.12 67a2.45 2.45 0 00-1 1.78c-.3 1.2-2.1 3.1-4 4.3l-3.3 2 .5 8.7c.5 8 .3 9.2-1.9 12.7a24.4 24.4 0 00-2.4 4.8c0 .4 3.9 2.6 8.6 4.7l8.5 4s9.2-1 24.9 3c.58.15 9.4 5.2 10 5.5 1.38.12.68 0 2.48 0 5.13-7.66 8.67-10.16 19.79-15.72a68.4 68.4 0 0113.93-.73c-.33-4.56-.09-2.85-.25-11.41.94-11.42 4.83-30.64 5.13-39.74a18 18 0 00-.08-2.7 9.11 9.11 0 00-.26-4.12z` |
| **g15** (a26) | Main Building | `M31.7 24.8c-.8.9-4.35 5.35-5.35 5.25-1.73 1.73-8 10.85-10.85 16.45C6.7 63.9.67 65.06.38 65.16S2.4 83.1 2.7 86.6l.6 6.5 9.4 4.8 9.5 4.9s7-4.42 40.76 7.45c9.77-1 18.44 3.75 21 3.75 1.71 0 2.14-.2 2.65-.76 6.06-6.74 17.13-4.35 16.35-11.54-.73-6.66-4.46-28.08-4.26-28.25.42-.31-6.3-7.45-6.3-7.45S81.2 54.7 81.09 49.16C64.15 43.3 51.3 35.1 49.5 30.6c-1.3-3.2-1.9-3.6-5.1-3.6a19.09 19.09 0 01-7.3-2c-3.6-1.8-4-1.8-5.4-.2z` |
| **g22** (a30) | Academy | `M47 45.3c-4.9 1.1-5.8 1.8-9.7 6.7-2.3 3-6.1 9.5-8.4 10.5-4.3 2-14.4 14.8-14.4 14.8l.2 9.5.1 9.6 10.6 5.3c8.5 4.3 10 10.67 13.2 13.2 2 1.6 4.1 2.1 8.6 2.1 4.16 0 7.16-.61 8.86-1.75s10.64-3.15 14.24-4.35c2.2-.7 4.4-2.1 5.1-3.2 1.4-2.4 7.8-5.7 11.1-5.7 4 0 10.5-3.7 10.5-6 0-1-.39-6.8-.09-13.4l.17-7.5-4.28-3.5c-1.5-1-2.8-2.3-2.8-3s-2-2.2-4.5-3.4c-3.8-1.8-4.5-2.6-4.5-5s-.7-3.2-4.2-4.8a59.61 59.61 0 01-9.2-5.3c-4.3-2.9-12.5-6.3-14.5-6-.3 0-3.1.6-6.1 1.2z` |
| **g19** (a32) | Barracks | `M35.39 53.28c-3.72.23-9 14.86-22.26 16.06C12.88 69.36 6 96.4 6.2 96.5s8.2 4.4 17.9 9.4c16.7 8.6 17.7 9 20.7 7.9a9.92 9.92 0 015.2-.4l2-2.2c1.2-1.2 2.5-2.2 3-2.2s6.3-2.9 7.3-4.5C71.91 94.61 91.24 94 91.24 94s12.45-10 12.61-10.26c.27-.39-1.85-9.45-1.85-10.25 0-1.6-5.55-11-7.5-21.68-2.61.49-4.09-1.26-4.5-.82-3.9 4.16-25.88 2.51-37.22-1.88a27.08 27.08 0 01-17.39 4.17z` |
| **g34** (a37) | Stonemason | `M47.42 30.81l-4.34 1.08C39 48.6 34.59 64.61 25.16 70.77c0 0-7.48 4.76-8.25 10.1-.73 5 .62 11.75.21 11.73l7.5 5.86 11.29 4.35c11.37-.83 21.31.67 28.56 6.51L74.9 107c1.5 0 27.4-11.66 29-12.27s-4.61-20.29-6.3-20.63c-10.8-6-17.4-15.06-18.89-27.91-13.32-3.38-24.81-7.89-31.29-15.38z` |
| **g16** (a39) | Rally Point | `M52 9.5L21.31 63.09c14.93 24 22.14 50.29 22.79 79.31 1.87 6.17 4.37 11.29 9.3 12.41l7.82 3.58c9.2.27 16.44-1.88 22.31-5.7 22-13.95 27.27-23.51 29.47-32.29-1.41-23.73-1.43-45.93.67-65.78C82.93 38.54 68.22 29.06 52 9.5z` |
| **g32** (a40) | Earth Wall | *(Bottom)* `M704 288v3.5c0 2.4-.6 3.7-2 4.5-1.6.9-2 2.1-2.1 6.8...` <br> *(Top)* `M733.7 282a43 43 0 00-1.8-5.5...` |
| **g0** | Empty Site | `M49.4 70.4c-7.8 1.8-13.5 4.7-16.8 8.6-3.5 4.3-4.1 7.2-2.1 11.3 3.3 7.1 13.9 11.7 28.5 12.4 19.8 1.1 35-6.5 35-17.5 0-4.9-5.8-10.2-14.2-13.1-8.1-2.8-22-3.6-30.4-1.7z` |

---
## 8. Summary of Findings
- All building slots (occupied or empty) aim for a **120x120px** coordinate system.
- The **Rally Point (a39)** is taller and wider (**125x160px**) to account for its flag and base.
- The **Village Wall (a40)** is a full-village overlay (**794x540px**). Correct placement is `left: 261px, top: 137px`.
- To fix the "small buildings" issue: Ensure the container scale is `1.0` and buildings are not being shrunk by parent flex layouts or viewport-relative units (vh/vw) incorrectly. Use fixed `px` as specified in the table.
