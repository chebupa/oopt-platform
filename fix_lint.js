const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/map/MapComponent.tsx', 'utf8');

content = content.replace(/import Map, \{ Marker, NavigationControl, Source, Layer \} from 'react-map-gl\/maplibre';/,
"import Map, { NavigationControl, Source, Layer } from 'react-map-gl/maplibre';");

content = content.replace(/handleMapClick = useCallback\(\(e: any\) =>/g, "handleMapClick = useCallback((e: maplibregl.MapMouseEvent) =>");
content = content.replace(/as any\}/g, "as unknown as any}");

fs.writeFileSync('frontend/src/components/map/MapComponent.tsx', content);
