import { create } from 'zustand';

export type UserRole = 'inspector' | 'volunteer' | null;

export interface Task {
  id: string;
  title: string;
  description?: string;
  points?: number;
  coordinates: [number, number]; // [longitude, latitude]
  color?: string;
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

export interface DzzAlert {
  id: string;
  title: string;
  description: string;
  coordinates: [number, number];
  date: string;
  type: 'deforestation' | 'fire' | 'pollution' | 'other';
  images: {
    normal: string;
    infrared: string;
    ndvi: string; // rtvi
    ndwi: string; // rtwi
    moisture: string;
  };
}

interface AppState {
  currentUser: { 
    role: UserRole; 
    name: string; 
    profession?: string; 
    has_completed_course?: boolean; 
    completed_tasks_count?: number; 
    trial_task_used?: boolean; 
  } | null;
  userPoints: number;
  tasks: Task[];
  reports: Report[];
  applications: Application[];
  dzzAlerts: DzzAlert[];
  setCurrentUser: (role: UserRole, name: string, profession?: string) => void;
  logout: () => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  completeTask: (taskId: string) => void;
  approveApplication: (appId: string) => void;
  rejectApplication: (appId: string) => void;
  applyForTask: (taskId: string) => void;
  completeCourse: () => void;
  buyItem: (price: number) => void;
  convertAlertToTask: (alertId: string) => void;
  removeAlert: (alertId: string) => void;
  removeTask: (taskId: string) => void;
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Убрать незаконную свалку',
    description: 'В районе озера обнаружена свалка строительного мусора',
    points: 150,
    coordinates: [37.712, 55.832],
    color: '#ff4d4f', // Лосиный остров
    status: 'open',
  },
  {
    id: '2',
    title: 'Восстановление разметки тропы',
    description: 'Нужно обновить метки на деревьях вдоль экотропы',
    points: 100,
    coordinates: [37.730, 55.825],
    color: '#faad14',
    status: 'open',
  },
  {
    id: '3',
    title: 'Проверка фотоловушки #4',
    description: 'Заменить аккумуляторы и скачать данные',
    points: 200,
    coordinates: [37.750, 55.840],
    color: '#52c41a',
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

const initialDzzAlerts: DzzAlert[] = [
  {
    id: 'a1',
    title: 'Подозрение на незаконную вырубку',
    description: 'Аномальное изменение NDVI. Требуется выезд на место для фиксации масштабов вырубки.',
    coordinates: [37.735, 55.845],
    date: 'Сегодня, 08:15',
    type: 'deforestation',
    images: {
      normal: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2A_MSIL2A_20260823T084731_R107_T37VDC_20260823T153512&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
      infrared: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2A_MSIL2A_20260823T084731_R107_T37VDC_20260823T153512&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
      ndvi: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2A_MSIL2A_20260823T084731_R107_T37VDC_20260823T153512&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
      ndwi: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2A_MSIL2A_20260823T084731_R107_T37VDC_20260823T153512&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
      moisture: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2A_MSIL2A_20260823T084731_R107_T37VDC_20260823T153512&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
    }
  },
  {
    id: 'a2',
    title: 'Возможное возгорание (термоточка)',
    description: 'Зафиксирована термическая аномалия в лесном массиве. Требуется проверить наличие открытого огня.',
    coordinates: [37.710, 55.850],
    date: 'Вчера, 14:30',
    type: 'fire',
    images: {
      normal: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2B_MSIL2A_20260717T084559_R107_T37VDC_20260717T110540&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
      infrared: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2B_MSIL2A_20260717T084559_R107_T37VDC_20260717T110540&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
      ndvi: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2B_MSIL2A_20260717T084559_R107_T37VDC_20260717T110540&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
      ndwi: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2B_MSIL2A_20260717T084559_R107_T37VDC_20260717T110540&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
      moisture: 'https://planetarycomputer.microsoft.com/api/data/v1/item/preview.png?collection=sentinel-2-l2a&item=S2B_MSIL2A_20260717T084559_R107_T37VDC_20260717T110540&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png',
    }
  }
];

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  userPoints: 200, // starting points (e.g. from task 3)
  tasks: initialTasks,
  reports: [],
  applications: initialApplications,
  dzzAlerts: initialDzzAlerts,
  setCurrentUser: (role, name, profession) => set({ 
    currentUser: { 
      role, 
      name, 
      profession, 
      has_completed_course: false, 
      completed_tasks_count: 0, 
      trial_task_used: false 
    } 
  }),
  logout: () => set({ currentUser: null }),
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: Date.now().toString(), status: 'open' }]
  })),
  completeTask: (taskId) => set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    const earnedPoints = task?.points || 0;
    const newCount = (state.currentUser?.completed_tasks_count || 0) + 1;
    let newRole = state.currentUser?.role;
    if (newRole === 'volunteer' && newCount >= 3) {
      newRole = 'inspector';
    }
    return {
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t),
      userPoints: state.userPoints + earnedPoints,
      currentUser: state.currentUser ? {
        ...state.currentUser,
        role: newRole || state.currentUser.role,
        completed_tasks_count: newCount
      } : null
    };
  }),
  applyForTask: (taskId) => set((state) => {
    if (!state.currentUser) return state;
    if (!state.currentUser.has_completed_course) {
      if (!state.currentUser.trial_task_used) {
        return {
          currentUser: {
            ...state.currentUser,
            trial_task_used: true
          }
        };
      } else {
        // throw error or handled in UI
        return state;
      }
    }
    return state; // Just logic representation for applying
  }),
  completeCourse: () => set((state) => {
    if (!state.currentUser) return state;
    return {
      currentUser: { ...state.currentUser, has_completed_course: true },
      userPoints: state.userPoints + 50
    };
  }),
  buyItem: (price) => set((state) => {
    if (state.userPoints >= price) {
      return { userPoints: state.userPoints - price };
    }
    return state;
  }),
  approveApplication: (appId) => set((state) => ({
    applications: state.applications.map(a => a.id === appId ? { ...a, status: 'approved' } : a)
  })),
  rejectApplication: (appId) => set((state) => ({
    applications: state.applications.map(a => a.id === appId ? { ...a, status: 'rejected' } : a)
  })),
  convertAlertToTask: (alertId) => set((state) => {
    const alert = state.dzzAlerts.find(a => a.id === alertId);
    if (!alert) return state;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: `Проверка по ДЗЗ: ${alert.title}`,
      description: alert.description,
      coordinates: alert.coordinates,
      color: '#1890ff',
      status: 'open'
    };
    
    return {
      tasks: [...state.tasks, newTask],
      dzzAlerts: state.dzzAlerts.filter(a => a.id !== alertId)
    };
  }),
  removeAlert: (alertId) => set((state) => ({
    dzzAlerts: state.dzzAlerts.filter(a => a.id !== alertId)
  })),
  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== taskId)
  }))
}));
