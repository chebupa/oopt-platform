"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Default open satellite raster style using ESRI World Imagery (requires no proprietary token)
const OPEN_SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'satellite-tiles': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  layers: [
    {
      id: 'satellite-tiles-layer',
      type: 'raster',
      source: 'satellite-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  geom?: {
    type: string;
    coordinates: number[];
  };
  geom_wkt?: string;
}

interface MapComponentProps {
  onMapClick?: (lng: number, lat: number) => void;
  wmsLayerUrl?: string;
  tasks: Task[];
}

function parseWktPoint(wkt?: string): [number, number] | null {
  if (!wkt) return null;
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (match) {
    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    if (!isNaN(lng) && !isNaN(lat)) {
      return [lng, lat];
    }
  }
  return null;
}

const MapComponent: React.FC<MapComponentProps> = ({ onMapClick, wmsLayerUrl, tasks }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: OPEN_SATELLITE_STYLE,
      center: [37.6173, 55.7558],
      zoom: 9,
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapInstance.on('click', (e) => {
      if (onMapClickRef.current) {
        onMapClickRef.current(e.lngLat.lng, e.lngLat.lat);
      }
    });

    mapInstance.once('load', () => {
      setMapLoaded(true);
    });

    map.current = mapInstance;

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.resize();
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Sync tasks GeoJSON layer with map
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const mapInstance = map.current;

    const syncTasksSource = () => {
      const features = tasks
        .map((t) => {
          let coordinates: [number, number] | null = null;
          if (t.geom && Array.isArray(t.geom.coordinates) && t.geom.coordinates.length >= 2) {
            coordinates = [t.geom.coordinates[0], t.geom.coordinates[1]];
          } else if (t.geom_wkt) {
            coordinates = parseWktPoint(t.geom_wkt);
          }
          if (!coordinates) return null;

          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates,
            },
            properties: { id: t.id, title: t.title, status: t.status },
          };
        })
        .filter((f): f is NonNullable<typeof f> => f !== null);

      const featureCollection = {
        type: 'FeatureCollection' as const,
        features,
      };

      const existingSource = mapInstance.getSource('tasks') as maplibregl.GeoJSONSource | undefined;
      if (existingSource) {
        existingSource.setData(featureCollection);
      } else {
        mapInstance.addSource('tasks', {
          type: 'geojson',
          data: featureCollection,
        });

        if (!mapInstance.getLayer('tasks-layer')) {
          mapInstance.addLayer({
            id: 'tasks-layer',
            type: 'circle',
            source: 'tasks',
            paint: {
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-color': [
                'match',
                ['get', 'status'],
                'open', '#fbb03b',
                'in_progress', '#223b53',
                'done', '#2ecc71',
                '#ccc',
              ],
            },
          });
        }
      }
    };

    syncTasksSource();
  }, [tasks, mapLoaded]);

  // Sync WMS overlay layer
  const activeWmsLayerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const mapInstance = map.current;

    const applyWmsLayer = () => {
      // Clean up previous WMS layer if it exists
      if (activeWmsLayerRef.current) {
        const oldId = activeWmsLayerRef.current;
        if (mapInstance.getLayer(oldId)) mapInstance.removeLayer(oldId);
        if (mapInstance.getSource(oldId)) mapInstance.removeSource(oldId);
        activeWmsLayerRef.current = null;
      }

      if (wmsLayerUrl) {
        // Use a unique ID to prevent MapLibre synchronous remove/add conflicts
        const uniqueId = `planetary-tiles-${Date.now()}`;
        
        mapInstance.addSource(uniqueId, {
          type: 'raster',
          tiles: [wmsLayerUrl],
          tileSize: 256,
        });

        const beforeLayerId = mapInstance.getLayer('tasks-layer') ? 'tasks-layer' : undefined;
        mapInstance.addLayer(
          {
            id: uniqueId,
            type: 'raster',
            source: uniqueId,
            paint: {
              'raster-opacity': 0.7,
            },
          },
          beforeLayerId
        );
        
        activeWmsLayerRef.current = uniqueId;
      }
    };

    applyWmsLayer();
  }, [wmsLayerUrl, mapLoaded]);

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0 w-full h-full"
      style={{ minHeight: '500px' }}
    />
  );
};

export default MapComponent;

