"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import MapComponent, { Task } from '@/components/MapComponent';

export default function Home() {
  const { user, token, setUser, logout } = useUserStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wmsLayer, setWmsLayer] = useState('');
  const [showCoursePrompt, setShowCoursePrompt] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks/');
      setTasks(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    let isMounted = true;

    if (!useUserStore.getState().user) {
      api.get('/auth/me')
        .then((res) => {
          if (isMounted) setUser(res.data);
        })
        .catch(() => {
          logout();
          router.push('/login');
        });
    }

    api.get('/tasks/')
      .then((res) => {
        if (isMounted) setTasks(res.data);
      })
      .catch((e) => console.error(e));

    return () => {
      isMounted = false;
    };
  }, [token, router, logout, setUser]);

  const handleMapClick = useCallback(async (lng: number, lat: number) => {
    if (user?.role !== 'inspector') return;
    
    const title = prompt("Enter task title:");
    const description = prompt("Enter task description:");
    if (!title || !description) return;

    try {
      await api.post('/tasks/', {
        title,
        description,
        geom_wkt: `POINT(${lng} ${lat})`
      });
      fetchTasks();
    } catch (e) {
      console.error(e);
      alert("Failed to create task");
    }
  }, [user?.role]);

  const handleLayerChange = async (layer: string) => {
    if (!layer || layer === 'NONE') {
      setWmsLayer('');
      setShowCoursePrompt(false);
      return;
    }

    if (layer === 'MOISTURE' || layer === 'NDVI') {
      setShowCoursePrompt(true);
    } else {
      setShowCoursePrompt(false);
    }

    try {
      const res = await api.post('/copernicus/wms-url', {
        bbox: "{bbox-epsg-3857}",
        layer: layer
      });
      setWmsLayer(res.data.url);
    } catch (e) {
      console.error(e);
    }
  };

  if (!token) return null;

  return (
    <main className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white p-4 shadow-md flex flex-col">
        <h1 className="text-xl font-bold mb-4">OOPT Platform</h1>
        <div className="mb-4 text-sm text-gray-600">
          Role: <span className="font-semibold">{user?.role || 'Loading...'}</span>
        </div>
        
        {user?.role === 'inspector' && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Map Layers</h2>
            <select 
              className="w-full p-2 border rounded"
              onChange={(e) => handleLayerChange(e.target.value)}
              defaultValue="NONE"
            >
              <option value="NONE">None (Basemap only)</option>
              <option value="TRUE_COLOR">True Color</option>
              <option value="NDVI">NDVI</option>
              <option value="MOISTURE">Moisture Index</option>
            </select>
            
            {showCoursePrompt && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                Научитесь находить скрытые угрозы:{' '}
                <a href="#" className="font-bold underline">Пройти курс по анализу ДЗЗ</a>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <h2 className="font-semibold mb-2">Tasks ({tasks.length})</h2>
          <ul className="space-y-2">
            {tasks.map((t: Task) => (
              <li key={t.id} className="p-2 border rounded text-sm">
                <div className="font-bold">{t.title}</div>
                <div className="text-gray-500 text-xs">Status: {t.status}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="flex-1 relative w-full h-full min-h-0">
        <MapComponent 
          tasks={tasks}
          wmsLayerUrl={wmsLayer}
          onMapClick={handleMapClick}
        />
      </div>
    </main>
  );
}
