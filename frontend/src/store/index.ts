import { create } from 'zustand';

export type UserRole = 'inspector' | 'volunteer' | null;

export interface Task {
  id: string;
  title: string;
  description?: string;
  coordinates: [number, number]; // [longitude, latitude]
  status: 'open' | 'completed';
}

export interface Report {
  id: string;
  description: string;
}

interface AppState {
  currentUser: { role: UserRole; name: string } | null;
  tasks: Task[];
  reports: Report[];
  setCurrentUser: (role: UserRole, name: string) => void;
  logout: () => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  completeTask: (taskId: string) => void;
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Убрать незаконную свалку',
    description: 'В районе озера обнаружена свалка строительного мусора',
    coordinates: [37.712, 55.832], // Лосиный остров
    status: 'open',
  },
  {
    id: '2',
    title: 'Восстановление разметки тропы',
    description: 'Нужно обновить метки на деревьях вдоль экотропы',
    coordinates: [37.730, 55.825],
    status: 'open',
  },
  {
    id: '3',
    title: 'Проверка фотоловушки #4',
    description: 'Заменить аккумуляторы и скачать данные',
    coordinates: [37.750, 55.840],
    status: 'completed',
  },
];

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  tasks: initialTasks,
  reports: [],
  setCurrentUser: (role, name) => set({ currentUser: { role, name } }),
  logout: () => set({ currentUser: null }),
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: Date.now().toString(), status: 'open' }]
  })),
  completeTask: (taskId) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t)
  })),
}));
