import { readFileSync, writeFileSync } from 'fs';

const defaultFieldPaths = JSON.parse(readFileSync('apps/web/app/(game)/(village-slug)/(village)/components/defaultFieldPaths.json', 'utf-8'));

// Read all extracted paths
const extractedFiles = {
  '5436': 'extracted-data/paths-5436.json',
};

const results = {};

for (const [rfc, file] of Object.entries(extractedFiles)) {
  const data = JSON.parse(readFileSync(file, 'utf-8'));
  const paths = data[rfc] || data;
  
  const diffs = {};
  for (const [slot, path] of Object.entries(paths)) {
    const slotNum = parseInt(slot);
    if (defaultFieldPaths[slotNum] && path !== defaultFieldPaths[slotNum]) {
      diffs[slotNum] = path;
    }
  }
  
  results[rfc] = diffs;
  console.log(`RFC ${rfc}: ${Object.keys(diffs).length} slots differ from default`);
  for (const slot of Object.keys(diffs)) {
    console.log(`  Slot ${slot}`);
  }
}

writeFileSync('extracted-data/all-diffs.json', JSON.stringify(results, null, 2));
console.log('\nResults written to extracted-data/all-diffs.json');
