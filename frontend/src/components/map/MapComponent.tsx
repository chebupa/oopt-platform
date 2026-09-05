"use client";

import { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore } from '@/store';
import { MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function MapComponent({ layer }: { layer: string }) {
  const { tasks, currentUser, addTask } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskCoords, setNewTaskCoords] = useState<[number, number] | null>(null);
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
    if (currentUser?.role === 'inspector') {
      setNewTaskCoords([e.lngLat.lng, e.lngLat.lat]);
      setIsModalOpen(true);
    }
  }, [currentUser]);

  const handleCreateTask = () => {
    if (newTaskCoords && taskTitle) {
      addTask({
        title: taskTitle,
        description: taskDescription,
        coordinates: newTaskCoords
      });
      setIsModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setNewTaskCoords(null);
      toast.success('Задание успешно создано на карте');
    }
  };

  return (
    <>
      <Map
        initialViewState={{
          longitude: 37.730,
          latitude: 55.825,
          zoom: 13
        }}
        mapStyle={mapStyle as any}
        onClick={handleMapClick}
        interactiveLayerIds={['satellite']}
        cursor={currentUser?.role === 'inspector' ? 'crosshair' : 'grab'}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        
        {tasks.map(task => (
          <Marker
            key={task.id}
            longitude={task.coordinates[0]}
            latitude={task.coordinates[1]}
            anchor="bottom"
          >
            <div className={`cursor-pointer transform hover:scale-110 transition-transform ${task.status === 'open' ? 'text-red-500' : 'text-emerald-500'}`}>
              <MapPin size={32} fill="currentColor" className="text-white" />
            </div>
          </Marker>
        ))}
      </Map>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новое задание</DialogTitle>
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
                placeholder="Подробности задания..."
              />
            </div>
            {newTaskCoords && (
              <div className="text-xs text-gray-500">
                Координаты: {newTaskCoords[1].toFixed(5)}, {newTaskCoords[0].toFixed(5)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateTask} disabled={!taskTitle}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
