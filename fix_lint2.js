const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/map/MapComponent.tsx', 'utf8');

if (!content.includes('import * as maplibregl')) {
  content = content.replace(/import Map, \{/, "import * as maplibregl from 'maplibre-gl';\nimport Map, {");
}
content = content.replace(/as any/g, "as unknown as any");

fs.writeFileSync('frontend/src/components/map/MapComponent.tsx', content);
