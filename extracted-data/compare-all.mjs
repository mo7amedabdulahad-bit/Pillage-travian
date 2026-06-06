import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const defaultFieldPaths = JSON.parse(readFileSync(join(__dirname, 'defaultFieldPaths.json'), 'utf8'));

const pathsFiles = readdirSync(__dirname)
  .filter(f => f.startsWith('paths-') && f.endsWith('.json'))
  .map(f => join(__dirname, f));

const results = {};

for (const filePath of pathsFiles) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const keys = Object.keys(data);

  if (keys.length !== 1) {
    console.warn(`Skipping ${filePath}: expected 1 top-level key, got ${keys.length}`);
    continue;
  }

  const composition = keys[0];
  const paths = data[composition];

  const diffs = {};
  const differingSlots = [];

  for (const [slotStr, path] of Object.entries(paths)) {
    const slot = parseInt(slotStr);
    if (defaultFieldPaths[slot] !== undefined && path !== defaultFieldPaths[slot]) {
      differingSlots.push(slot);
      diffs[slotStr] = path;
    }
  }

  differingSlots.sort((a, b) => a - b);

  if (differingSlots.length > 0) {
    results[composition] = { differingSlots, paths: diffs };
    console.log(`RFC ${composition}: ${differingSlots.length} slots differ [${differingSlots.join(', ')}]`);
  } else {
    console.log(`RFC ${composition}: identical to default`);
  }
}

const outputPath = join(__dirname, 'all-diffs.json');
writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\nResults written to ${outputPath}`);
