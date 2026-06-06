import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const jsonDir = 'C:\\Users\\Mohamed\\Downloads\\again\\Assets\\Sprite';
const pngDir = 'C:\\Users\\Mohamed\\Downloads\\Assets\\Sprite';

// Composition mapping: RFC -> image number
const rfcToImage = {
  '3339': 1, '3456': 2, '4446': 3, '4536': 4, '5346': 5,
  '11115': 6, '4437': 7, '3447': 8, '4347': 9, '3546': 10,
  '4356': 11, '5436': 12, '00018': 13
};

const imageToRfc = Object.fromEntries(Object.entries(rfcToImage).map(([k, v]) => [v, k]));

// Read all JSON data
const files = readdirSync(jsonDir)
  .filter(f => f.match(/^resourceField\d+\.json$/))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });

const allData = {};
for (const file of files) {
  const num = parseInt(file.match(/\d+/)[0]);
  const raw = readFileSync(join(jsonDir, file), 'utf-8');
  const data = JSON.parse(raw);
  allData[num] = {
    name: data.m_Name,
    offset: data.m_Offset,
    shapes: data.m_PhysicsShape || [],
  };
}

// Calculate bounding boxes and centroids for each shape
function getCentroid(points) {
  let cx = 0, cy = 0;
  for (const pt of points) { cx += pt.m_X; cy += pt.m_Y; }
  return { x: cx / points.length, y: cy / points.length };
}

function getBBox(points) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pt of points) {
    if (pt.m_X < minX) minX = pt.m_X;
    if (pt.m_X > maxX) maxX = pt.m_X;
    if (pt.m_Y < minY) minY = pt.m_Y;
    if (pt.m_Y > maxY) maxY = pt.m_Y;
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

// For each composition, analyze the shapes
console.log('=== Shape Analysis ===\n');
for (const num of Object.keys(allData).map(Number).sort((a, b) => a - b)) {
  const data = allData[num];
  console.log(`resourceField${num} (${data.name}): ${data.shapes.length} shapes`);
  console.log(`  Offset: (${data.offset.m_X.toFixed(3)}, ${data.offset.m_Y.toFixed(3)})`);
  
  for (let i = 0; i < Math.min(data.shapes.length, 5); i++) {
    const shape = data.shapes[i];
    const centroid = getCentroid(shape);
    const bbox = getBBox(shape);
    console.log(`  Shape ${i}: ${shape.length} pts, centroid=(${centroid.x.toFixed(3)}, ${centroid.y.toFixed(3)}), bbox=[${bbox.minX.toFixed(2)}-${bbox.maxX.toFixed(2)}, ${bbox.minY.toFixed(2)}-${bbox.maxY.toFixed(2)}]`);
  }
  if (data.shapes.length > 5) console.log(`  ... and ${data.shapes.length - 5} more shapes`);
  console.log('');
}

// Now let's try to understand the mapping
// The existing SVG for resourceField3 has 18 slots
// Let's look at shape 0 for resourceField3 - it has 112 points
// That's likely the overall outline
// Shapes 1+ should be the individual slot areas

// Let's compute global bounds to find coordinate transformation
let globalMinX = Infinity, globalMaxX = -Infinity;
let globalMinY = Infinity, globalMaxY = -Infinity;

for (const num of Object.keys(allData)) {
  const data = allData[num];
  // Only use shape 0 (the outline) to find bounds
  if (data.shapes.length > 0) {
    for (const pt of data.shapes[0]) {
      if (pt.m_X < globalMinX) globalMinX = pt.m_X;
      if (pt.m_X > globalMaxX) globalMaxX = pt.m_X;
      if (pt.m_Y < globalMinY) globalMinY = pt.m_Y;
      if (pt.m_Y > globalMaxY) globalMaxY = pt.m_Y;
    }
  }
}

console.log(`\n=== Global Bounds (shape 0 only) ===`);
console.log(`X: [${globalMinX.toFixed(3)}, ${globalMaxX.toFixed(3)}] range=${(globalMaxX - globalMinX).toFixed(3)}`);
console.log(`Y: [${globalMinY.toFixed(3)}, ${globalMaxY.toFixed(3)}] range=${(globalMaxY - globalMinY).toFixed(3)}`);

// The SVG viewBox is 0 0 473 304
// Shape 0 is the overall outline, so its bounds should map to the SVG bounds
const svgW = 473, svgH = 304;
const pad = 15;
const rangeX = globalMaxX - globalMinX;
const rangeY = globalMaxY - globalMinY;
const scaleX = (svgW - 2 * pad) / rangeX;
const scaleY = (svgH - 2 * pad) / rangeY;
const scale = Math.min(scaleX, scaleY);

const ox = pad + (svgW - 2 * pad - rangeX * scale) / 2;
const oy = pad + (svgH - 2 * pad - rangeY * scale) / 2;

function toSVG(pt) {
  const x = (pt.m_X - globalMinX) * scale + ox;
  const y = (globalMaxY - pt.m_Y) * scale + oy; // Y inverted
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

function polyToPath(points) {
  if (!points || points.length === 0) return '';
  const pts = points.map(toSVG);
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L${pts[i].x} ${pts[i].y}`;
  }
  return d + ' Z';
}

// Generate SVG for each composition
console.log('\n=== Generated SVG Paths ===\n');

const output = {};
for (const num of Object.keys(allData).map(Number).sort((a, b) => a - b)) {
  const data = allData[num];
  const rfc = imageToRfc[num];
  console.log(`resourceField${num} (RFC ${rfc}): ${data.shapes.length} shapes`);
  
  // Skip shape 0 (outline), use shapes 1+ as slot paths
  output[num] = {};
  for (let i = 1; i < data.shapes.length; i++) {
    const path = polyToPath(data.shapes[i]);
    if (path) {
      output[num][i] = path;
      console.log(`  Slot ${i}: ${path.substring(0, 80)}...`);
    }
  }
  console.log('');
}

// Generate verification HTML page
let html = `<!DOCTYPE html>
<html>
<head>
<title>Resource Field SVG Verification</title>
<style>
  body { font-family: Arial; background: #1a1a1a; color: #fff; margin: 20px; }
  .comp { display: inline-block; margin: 10px; text-align: center; }
  .comp h3 { margin: 5px 0; }
  .container { position: relative; width: 473px; height: 304px; border: 1px solid #555; }
  .container img { width: 473px; height: 304px; }
  .container svg { position: absolute; top: 0; left: 0; width: 473px; height: 304px; }
  .slot { fill: rgba(255,255,0,0.15); stroke: yellow; stroke-width: 1; cursor: pointer; }
  .slot:hover { fill: rgba(255,0,0,0.3); }
</style>
</head>
<body>
<h1>Resource Field SVG Verification</h1>
<p>Yellow overlay = generated SVG paths from m_PhysicsShape data. Hover to highlight.</p>
<div>
`;

for (const num of Object.keys(allData).map(Number).sort((a, b) => a - b)) {
  const rfc = imageToRfc[num];
  const paths = output[num];
  let svgPaths = '';
  for (const [slotId, path] of Object.entries(paths)) {
    svgPaths += `  <path class="slot" d="${path}" title="Shape ${slotId}" />\n`;
  }
  
  html += `
  <div class="comp">
    <h3>RF${num} (RFC ${rfc}) - ${Object.keys(paths).length} slots</h3>
    <div class="container">
      <img src="file:///${pngDir.replace(/\\/g, '/')}/resourceField${num}.png" />
      <svg viewBox="0 0 473 304">${svgPaths}</svg>
    </div>
  </div>`;
}

html += `
</div>
</body>
</html>`;

writeFileSync('C:\\Users\\Mohamed\\OneDrive\\Desktop\\Pillage-First-Ask-Questions-Later-master\\verify-paths.html', html);
console.log('\nVerification HTML written to verify-paths.html');
