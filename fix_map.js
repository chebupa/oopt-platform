const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/map/MapComponent.tsx', 'utf8');

content = content.replace(
  /import Map, \{ Marker, NavigationControl, Source, Layer, FillLayer, LineLayer, CircleLayer \} from 'react-map-gl\/maplibre';/,
  "import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';"
);

content = content.replace(
  /type: 'Feature', geometry: \{ type: 'Point', coordinates: p \}/g,
  "type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: p }"
);
content = content.replace(
  /type: 'Feature', geometry: \{ type: 'Point', coordinates: draftPolygon\[0\] \}/g,
  "type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: draftPolygon[0] }"
);
content = content.replace(
  /type: 'Feature', geometry: \{ type: 'LineString', coordinates: draftPolygon \}/g,
  "type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: draftPolygon }"
);
content = content.replace(
  /type: 'Feature', geometry: \{ type: 'Polygon', coordinates: \[\[\.\.\.draftPolygon, draftPolygon\[0\]\]\] \}/g,
  "type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...draftPolygon, draftPolygon[0]]] }"
);


fs.writeFileSync('frontend/src/components/map/MapComponent.tsx', content);
console.log("Fixed MapComponent imports and types");
