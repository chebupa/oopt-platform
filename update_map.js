const fs = require('fs');

const content = `"use client";

import { useState, useCallback, useMemo } from 'react';
import Map, { Marker, NavigationControl, Source, Layer, FillLayer, LineLayer, CircleLayer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore } from '@/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const generateRandomColor = () => {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function MapComponent({ layer }: { layer: string }) {
  const { tasks, currentUser, addTask } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftPolygon, setDraftPolygon] = useState<[number, number][]>([]);
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  // Use a public ESRI satellite map style for true color or openstreetmap
  const mapStyle = layer === 'rgb' 
    ? {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '&copy; Esri'
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      }
    : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  const handleMapClick = useCallback((e: any) => {
    if (currentUser?.role === 'inspector' && isDrawing) {
      setDraftPolygon(prev => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
    }
  }, [currentUser, isDrawing]);

  const handleCreateTask = () => {
    if (draftPolygon.length >= 3 && taskTitle) {
      // Close the polygon
      const closedPolygon = [...draftPolygon, draftPolygon[0]];
      
      addTask({
        title: taskTitle,
        description: taskDescription,
        polygon: closedPolygon,
        color: generateRandomColor()
      } as any);
      
      setIsModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setDraftPolygon([]);
      setIsDrawing(false);
      toast.success('Задание-алерт успешно создано на карте');
    }
  };

  const draftGeoJSON = useMemo(() => {
    if (draftPolygon.length === 0) return null;
    if (draftPolygon.length === 1) {
      return {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: draftPolygon[0] } }]
      };
    }
    if (draftPolygon.length === 2) {
      return {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: draftPolygon } }]
      };
    }
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...draftPolygon, draftPolygon[0]]] } }]
    };
  }, [draftPolygon]);

  const tasksGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: tasks.map(t => {
        // Ensure it's a closed polygon. If not, close it.
        const coords = [...t.polygon];
        if (coords.length > 0 && (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1])) {
          coords.push(coords[0]);
        }
        return {
          type: 'Feature',
          properties: {
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            color: t.color || (t.status === 'open' ? '#f44336' : '#4caf50')
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords]
          }
        };
      })
    };
  }, [tasks]);

  return (
    <div className="relative w-full h-full">
      {currentUser?.role === 'inspector' && (
        <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-md border border-gray-200">
          {!isDrawing ? (
            <Button onClick={() => setIsDrawing(true)} className="bg-blue-600 hover:bg-blue-700">
              Выделить зону на карте
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Кликайте по карте для создания точек зоны</span>
              <div className="text-xs text-gray-500 mb-1">Точек: {draftPolygon.length} (нужно минимум 3)</div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setIsDrawing(false); setDraftPolygon([]); }}
                >
                  Отмена
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  disabled={draftPolygon.length < 3}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Завершить форму
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Map
        initialViewState={{
          longitude: 37.730,
          latitude: 55.825,
          zoom: 13
        }}
        mapStyle={mapStyle as any}
        onClick={handleMapClick}
        interactiveLayerIds={['satellite', 'tasks-fill']}
        cursor={isDrawing ? 'crosshair' : (currentUser?.role === 'inspector' ? 'pointer' : 'grab')}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        
        {tasksGeoJSON.features.length > 0 && (
          <Source id="tasks-source" type="geojson" data={tasksGeoJSON as any}>
            <Layer 
              id="tasks-fill" 
              type="fill" 
              paint={{
                'fill-color': ['get', 'color'],
                'fill-opacity': 0.4
              }} 
            />
            <Layer 
              id="tasks-line" 
              type="line" 
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 2,
                'line-dasharray': [2, 2]
              }} 
            />
            {/* Make it look like it's made from points */}
            <Layer
              id="tasks-points"
              type="circle"
              paint={{
                'circle-radius': 4,
                'circle-color': ['get', 'color'],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
              }}
              // to render circles at vertices, we'd ideally need a point source, but mapbox can sometimes render them if we use circle layer on a polygon. Actually mapbox doesn't render polygon vertices as circles. It renders the whole feature.
              // We'll leave the circle layer, it might render at the centroid or not at all.
            />
          </Source>
        )}

        {/* Since mapbox circle layer on polygon only renders one point, let's make a separate source for the vertices to satisfy "как будто из точек сделаны" */}
        <Source id="tasks-vertices-source" type="geojson" data={{
          type: 'FeatureCollection',
          features: tasks.flatMap(t => t.polygon.map(coord => ({
            type: 'Feature',
            properties: { color: t.color || '#ff0000' },
            geometry: { type: 'Point', coordinates: coord }
          })))
        } as any}>
          <Layer
            id="tasks-vertices"
            type="circle"
            paint={{
              'circle-radius': 5,
              'circle-color': ['get', 'color'],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }}
          />
        </Source>

        {draftGeoJSON && (
          <Source id="draft-source" type="geojson" data={draftGeoJSON as any}>
            {draftPolygon.length > 2 && (
              <Layer 
                id="draft-fill" 
                type="fill" 
                paint={{ 'fill-color': '#1890ff', 'fill-opacity': 0.4 }} 
              />
            )}
            <Layer 
              id="draft-line" 
              type="line" 
              paint={{ 'line-color': '#1890ff', 'line-width': 2, 'line-dasharray': [2, 2] }} 
            />
          </Source>
        )}

        {draftPolygon.length > 0 && (
          <Source id="draft-points-source" type="geojson" data={{
            type: 'FeatureCollection',
            features: draftPolygon.map(p => ({
              type: 'Feature', geometry: { type: 'Point', coordinates: p }
            }))
          }}>
            <Layer 
              id="draft-points" 
              type="circle" 
              paint={{
                'circle-radius': 5,
                'circle-color': '#1890ff',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }} 
            />
          </Source>
        )}
      </Map>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Завершить создание алерта/зоны</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input 
                value={taskTitle} 
                onChange={(e) => setTaskTitle(e.target.value)} 
                placeholder="Например: Убрать мусор"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание (опционально)</Label>
              <Input 
                value={taskDescription} 
                onChange={(e) => setTaskDescription(e.target.value)} 
                placeholder="Подробности..."
              />
            </div>
            <div className="text-xs text-gray-500">
              Полигон из {draftPolygon.length} точек
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateTask} disabled={!taskTitle}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

fs.writeFileSync('frontend/src/components/map/MapComponent.tsx', content);
console.log("Updated MapComponent");
