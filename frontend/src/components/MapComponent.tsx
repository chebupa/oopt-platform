"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Default open map style using OpenStreetMap
const OPEN_SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
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
  draftPoints?: [number, number][];
}

function parseWktPolygon(wkt?: string): [number, number][] | null {
  if (!wkt) return null;
  const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
  if (match) {
    const coordsStr = match[1];
    const points = coordsStr.split(',').map(pair => {
      const [lng, lat] = pair.trim().split(/\s+/).map(Number);
      return [lng, lat] as [number, number];
    });
    if (points.every(p => !isNaN(p[0]) && !isNaN(p[1]))) {
      return points;
    }
  }
  return null;
}

const MapComponent: React.FC<MapComponentProps> = ({ onMapClick, wmsLayerUrl, tasks, draftPoints }) => {
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
          let coordinates: [number, number][] | null = null;
          if (t.geom_wkt) {
            coordinates = parseWktPolygon(t.geom_wkt);
          }
          if (!coordinates || coordinates.length < 3) return null;

          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Polygon' as const,
              coordinates: [coordinates],
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

        if (!mapInstance.getLayer('tasks-layer-fill')) {
          mapInstance.addLayer({
            id: 'tasks-layer-fill',
            type: 'fill',
            source: 'tasks',
            paint: {
              'fill-opacity': 0.6,
              'fill-color': '#39ff14', // Acid Green
            },
          });
        }
        
        if (!mapInstance.getLayer('tasks-layer-line')) {
          mapInstance.addLayer({
            id: 'tasks-layer-line',
            type: 'line',
            source: 'tasks',
            paint: {
              'line-width': 4,
              'line-color': '#39ff14', // Acid Green
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

        const beforeLayerId = mapInstance.getLayer('tasks-layer-fill') ? 'tasks-layer-fill' : undefined;
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

  // Sync draft points layer
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const mapInstance = map.current;
    const pts = draftPoints || [];

    const draftFeatures: GeoJSON.Feature[] = [];

    // Add polygon if >= 3 points
    if (pts.length >= 3) {
      const polygonCoords = [...pts, pts[0]];
      draftFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords]
        },
        properties: { draftType: 'Polygon' }
      });
    } else if (pts.length > 1) {
      draftFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: pts
        },
        properties: { draftType: 'LineString' }
      });
    }

    // Add points
    pts.forEach(p => {
      draftFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p },
        properties: { draftType: 'Point' }
      });
    });

    const collection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: draftFeatures
    };

    const source = mapInstance.getSource('draft') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(collection);
    } else {
      mapInstance.addSource('draft', { type: 'geojson', data: collection });
      
      mapInstance.addLayer({
        id: 'draft-polygon',
        type: 'fill',
        source: 'draft',
        filter: ['==', ['get', 'draftType'], 'Polygon'],
        paint: {
          'fill-color': '#39ff14',
          'fill-opacity': 0.6
        }
      });
      
      mapInstance.addLayer({
        id: 'draft-line',
        type: 'line',
        source: 'draft',
        filter: ['==', ['get', 'draftType'], 'LineString'],
        paint: {
          'line-color': '#39ff14',
          'line-width': 4
        }
      });

      mapInstance.addLayer({
        id: 'draft-points',
        type: 'circle',
        source: 'draft',
        filter: ['==', ['get', 'draftType'], 'Point'],
        paint: {
          'circle-radius': 6,
          'circle-color': '#39ff14',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#000'
        }
      });
    }
  }, [draftPoints, mapLoaded]);

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0 w-full h-full"
      style={{ minHeight: '500px' }}
    >
      <div className="absolute top-16 left-4 bg-white p-2 rounded shadow text-xs z-50">
        <div>Tasks prop count: {tasks?.length || 0}</div>
        <div>Tasks with WKT: {tasks?.filter(t => t.geom_wkt).length || 0}</div>
        <div>Tasks with valid points: {tasks?.filter(t => {
          if (!t.geom_wkt) return false;
          const match = t.geom_wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
          if (!match) return false;
          const pts = match[1].split(',').map(pair => pair.trim().split(/\s+/).map(Number));
          return pts.length >= 3 && pts.every(p => !isNaN(p[0]) && !isNaN(p[1]));
        }).length || 0}</div>
      </div>
    </div>
  );
};

export default MapComponent;

