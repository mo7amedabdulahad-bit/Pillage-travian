import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const jsonDir = 'C:\\Users\\Mohamed\\Downloads\\again\\Assets\\Sprite';

// Read all resourceField JSON files (not the _0 or "1" variants)
const files = readdirSync(jsonDir)
  .filter(f => f.match(/^resourceField\d+\.json$/))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });

console.log(`Found ${files.length} resourceField JSON files\n`);

// The SVG viewBox is 0 0 473 304
// We need to find the coordinate transformation from Unity space to SVG space

// First, let's analyze the bounds of all polygons across all compositions
let globalMinX = Infinity, globalMaxX = -Infinity;
let globalMinY = Infinity, globalMaxY = -Infinity;

const allData = {};

for (const file of files) {
  const num = parseInt(file.match(/\d+/)[0]);
  const raw = readFileSync(join(jsonDir, file), 'utf-8');
  const data = JSON.parse(raw);
  const shapes = data.m_PhysicsShape || [];
  
  allData[num] = {
    name: data.m_Name,
    offset: data.m_Offset,
    shapes: shapes,
    shapeCount: shapes.length
  };
  
  for (const shape of shapes) {
    for (const pt of shape) {
      if (pt.m_X < globalMinX) globalMinX = pt.m_X;
      if (pt.m_X > globalMaxX) globalMaxX = pt.m_X;
      if (pt.m_Y < globalMinY) globalMinY = pt.m_Y;
      if (pt.m_Y > globalMaxY) globalMaxY = pt.m_Y;
    }
  }
}

console.log(`Global bounds: X=[${globalMinX}, ${globalMaxX}], Y=[${globalMinY}, ${globalMaxY}]`);
console.log(`Range: X=${globalMaxX - globalMinX}, Y=${globalMaxY - globalMinY}\n`);

// Now let's figure out the transformation
// The SVG viewBox is 0 0 473 304
// We need to map Unity coordinates to SVG coordinates

// Let's look at the existing SVG paths for resourceField3 (composition 4446) to calibrate
// The first path (slot 1) starts at M321.6 13.2

// Let's check what the first polygon of resourceField3 looks like
const rf3 = allData[3];
console.log(`resourceField3: ${rf3.shapeCount} shapes`);
console.log(`First shape has ${rf3.shapes[0].length} points`);
console.log(`First point: (${rf3.shapes[0][0].m_X}, ${rf3.shapes[0][0].m_Y})`);
console.log(`Offset: (${rf3.offset.m_X}, ${rf3.offset.m_Y})`);

// The m_Offset shifts the sprite's position
// The m_PhysicsShape coordinates are in the sprite's local space
// We need to account for the offset and the sprite's texture dimensions

// Let's try a simple normalization approach:
// 1. Find the bounding box of all points (already done)
// 2. Map to SVG viewBox with padding

const padding = 10;
const svgWidth = 473;
const svgHeight = 304;

const rangeX = globalMaxX - globalMinX;
const rangeY = globalMaxY - globalMinY;
const scaleX = (svgWidth - 2 * padding) / rangeX;
const scaleY = (svgHeight - 2 * padding) / rangeY;
const scale = Math.min(scaleX, scaleY);

const offsetX = padding + (svgWidth - 2 * padding - rangeX * scale) / 2;
const offsetY = padding + (svgHeight - 2 * padding - rangeY * scale) / 2;

function toSVG(pt) {
  const x = (pt.m_X - globalMinX) * scale + offsetX;
  // Y is inverted in SVG (down is positive)
  const y = (globalMaxY - pt.m_Y) * scale + offsetY;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

function pointsToPath(points) {
  if (!points || points.length === 0) return '';
  
  const svgPoints = points.map(toSVG);
  
  let d = `M${svgPoints[0].x} ${svgPoints[0].y}`;
  
  // Use quadratic curves for smoother shapes
  for (let i = 1; i < svgPoints.length; i++) {
    const prev = svgPoints[i - 1];
    const curr = svgPoints[i];
    
    // Simple line segment
    d += ` L${curr.x} ${curr.y}`;
  }
  
  d += ' Z';
  return d;
}

// Output all paths
console.log('\n--- SVG Paths ---\n');

for (const num of Object.keys(allData).map(Number).sort((a, b) => a - b)) {
  const data = allData[num];
  console.log(`resourceField${num} (${data.name}): ${data.shapeCount} shapes`);
  
  for (let i = 0; i < data.shapes.length; i++) {
    const path = pointsToPath(data.shapes[i]);
    console.log(`  Shape ${i}: ${data.shapes[i].length} points`);
    console.log(`  Path: ${path}`);
  }
  console.log('');
}
