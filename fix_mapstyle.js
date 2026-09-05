const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/map/MapComponent.tsx', 'utf8');

const osmStyle = `{
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      }`;

content = content.replace(/"https:\/\/basemaps.cartocdn.com\/gl\/positron-gl-style\/style.json"/, osmStyle);

// Also let's check interactiveLayerIds. If we changed 'osm-layer', we should probably remove 'satellite' from interactiveLayerIds if we want the tasks to be clickable, or just add 'osm-layer' to it. Actually 'tasks-fill' is what we want interactive.
content = content.replace(/interactiveLayerIds=\{\['satellite', 'tasks-fill'\]\}/, "interactiveLayerIds={['tasks-fill']}");


fs.writeFileSync('frontend/src/components/map/MapComponent.tsx', content);
