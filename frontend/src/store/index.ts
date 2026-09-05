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

export interface Application {
  id: string;
  taskId: string;
  taskTitle: string;
  volunteerName: string;
  type: 'participation' | 'completion';
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  comment?: string;
  photoUrl?: string;
}

interface AppState {
  currentUser: { role: UserRole; name: string } | null;
  tasks: Task[];
  reports: Report[];
  applications: Application[];
  setCurrentUser: (role: UserRole, name: string) => void;
  logout: () => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  completeTask: (taskId: string) => void;
  approveApplication: (appId: string) => void;
  rejectApplication: (appId: string) => void;
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

const initialApplications: Application[] = [
  {
    id: '101',
    taskId: '1',
    taskTitle: 'Убрать незаконную свалку',
    volunteerName: 'Иван Петров',
    type: 'participation',
    status: 'pending',
    date: 'Сегодня, 10:30',
    comment: 'Готов взять с собой инвентарь (мешки, перчатки).'
  },
  {
    id: '102',
    taskId: '3',
    taskTitle: 'Проверка фотоловушки #4',
    volunteerName: 'Анна Смирнова',
    type: 'completion',
    status: 'pending',
    date: 'Вчера, 18:45',
    comment: 'Фотоловушка проверена, батареи заменены, снимки скачаны.',
    photoUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=600&auto=format&fit=crop'
  }
];

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  tasks: initialTasks,
  reports: [],
  applications: initialApplications,
  setCurrentUser: (role, name) => set({ currentUser: { role, name } }),
  logout: () => set({ currentUser: null }),
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: Date.now().toString(), status: 'open' }]
  })),
  completeTask: (taskId) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t)
  })),
  approveApplication: (appId) => set((state) => ({
    applications: state.applications.map(a => a.id === appId ? { ...a, status: 'approved' } : a)
  })),
  rejectApplication: (appId) => set((state) => ({
    applications: state.applications.map(a => a.id === appId ? { ...a, status: 'rejected' } : a)
  })),
}));
