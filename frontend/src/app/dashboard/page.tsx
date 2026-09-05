"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import MapComponent from '@/components/map/MapComponent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LogOut, Layers, MapPin, CheckCircle2, Camera, Upload, Image as ImageIcon, Inbox, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, logout, tasks, completeTask, applications, approveApplication, rejectApplication, dzzAlerts, convertAlertToTask, removeTask } = useAppStore();
  const [layer, setLayer] = useState('rgb');
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState<string>('');
  const [inspectorTab, setInspectorTab] = useState<'tasks' | 'applications'>('tasks');

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const handleLayerChange = (val: string) => {
    if (val === 'infrared' || val === 'moisture') {
      setUpsellOpen(true);
      // Keep previous layer visually
    } else {
      setLayer(val);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-gray-50">
      {/* Sidebar for Inspector, Task List for Volunteer */}
      <div className="w-full md:w-96 bg-white border-r flex flex-col z-10 shadow-sm h-1/2 md:h-full overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0">
          <div>
            <h2 className="font-semibold text-gray-800">
              {currentUser.role === 'inspector' ? 'Панель Инспектора' : 'Задания Волонтера'}
            </h2>
            <p className="text-xs text-gray-500">{currentUser.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Выйти">
            <LogOut className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          {currentUser.role === 'inspector' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3 text-gray-700">
                  <Layers className="h-4 w-4" /> Слои карты
                </h3>
                <RadioGroup value={layer} onValueChange={handleLayerChange} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rgb" id="r1" />
                    <Label htmlFor="r1" className="cursor-pointer">OpenStreetMap</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="infrared" id="r2" />
                    <Label htmlFor="r2" className="cursor-pointer flex items-center gap-2">
                      Инфракрасный (NDVI) <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold">Pro</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moisture" id="r3" />
                    <Label htmlFor="r3" className="cursor-pointer flex items-center gap-2">
                      Анализ влажности <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold">Pro</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded text-balance">
                  💡 Кликните по карте в любой области леса, чтобы создать новое задание.
                </p>
              </div>



              <div className="pt-4 border-t space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${inspectorTab === 'tasks' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setInspectorTab('tasks')}
                  >
                    <MapPin className="h-3.5 w-3.5" /> Задания
                  </button>
                  <button 
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${inspectorTab === 'applications' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setInspectorTab('applications')}
                  >
                    <Inbox className="h-3.5 w-3.5" /> Заявки
                    {applications.filter(a => a.status === 'pending').length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full leading-tight py-0.5">
                        {applications.filter(a => a.status === 'pending').length}
                      </span>
                    )}
                  </button>
                </div>

                {inspectorTab === 'tasks' ? (
                  <div className="space-y-4">
                    {tasks.length === 0 && <p className="text-sm text-gray-500">Нет опубликованных заданий.</p>}
                    
                    {tasks.map(task => (
                      <Card key={task.id} className={task.status === 'completed' ? 'opacity-60 bg-gray-50' : ''}>
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-sm font-semibold flex items-start justify-between">
                            <span>{task.title}</span>
                            <div className="flex items-center">
                              {task.points && <span className="text-xs text-emerald-600 font-medium mr-2">+{task.points} б.</span>}
                              {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 ml-2" />}
                            </div>
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {task.status === 'open' ? 'В ожидании выполнения' : 'Выполнено'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 text-sm text-gray-600">
                          {task.description && <p className="mb-2">{task.description}</p>}
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => {
                                removeTask(task.id);
                                toast.success('Задание удалено');
                              }}
                            >
                              <X className="h-3 w-3 mr-1" /> Удалить
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.length === 0 && <p className="text-sm text-gray-500">Нет новых заявок.</p>}
                    
                    {applications.map(app => (
                      <Card key={app.id} className={app.status !== 'pending' ? 'opacity-60 bg-gray-50' : ''}>
                        <CardHeader className="p-3 pb-1">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm font-semibold flex flex-col">
                              <span>{app.volunteerName}</span>
                              <span className="text-xs text-gray-500 font-normal">{app.date}</span>
                            </CardTitle>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                              app.type === 'participation' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {app.type === 'participation' ? 'На участие' : 'Отчет о выполнении'}
                            </span>
                          </div>
                          <CardDescription className="text-xs font-medium text-gray-800 mt-1">
                            К заданию: «{app.taskTitle}»
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 text-sm text-gray-600">
                          {app.comment && (
                            <p className="bg-white p-2 rounded border text-xs italic mb-2">
                              &quot;{app.comment}&quot;
                            </p>
                          )}
                          
                          {app.photoUrl && (
                            <div 
                              className="mb-3 relative w-full h-24 rounded border overflow-hidden cursor-pointer group"
                              onClick={() => {
                                setSelectedPhotoUrl(app.photoUrl || null);
                                setSelectedPhotoFilter('');
                                setPhotoViewOpen(true);
                              }}
                            >
                              <img src={app.photoUrl} alt="Фото отчета" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <ImageIcon className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                              </div>
                            </div>
                          )}
                          {app.status === 'pending' ? (
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="default"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                onClick={() => {
                                  approveApplication(app.id);
                                  toast.success('Заявка одобрена');
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" /> Одобрить
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="w-full h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={() => {
                                  rejectApplication(app.id);
                                  toast.success('Заявка отклонена');
                                }}
                              >
                                <X className="h-3 w-3 mr-1" /> Отклонить
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs font-medium text-center">
                              {app.status === 'approved' ? (
                                <span className="text-emerald-600">✓ Одобрено</span>
                              ) : (
                                <span className="text-red-600">✗ Отклонено</span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentUser.role === 'volunteer' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-800">
                      Баланс ({currentUser.profession || 'Волонтер'})
                    </h3>
                    <p className="text-2xl font-bold text-emerald-600">{useAppStore(state => state.userPoints)} <span className="text-sm font-medium">баллов</span></p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white"
                      onClick={() => router.push('/store')}
                    >
                      Магазин поощрений
                    </Button>
                  </div>
                </div>

                {/* Progression UI */}
                <div className="bg-white rounded p-3 border text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Статус курса:</span>
                    {currentUser.has_completed_course ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Пройден</span>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-7 text-xs"
                        onClick={() => {
                          useAppStore.getState().completeCourse();
                          toast.success('Курс пройден! Начислено 50 баллов.');
                        }}
                      >
                        Пройти курс
                      </Button>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Выполнено заданий:</span>
                    <span className="font-medium">{currentUser.completed_tasks_count || 0} / 3</span>
                  </div>
                  {(!currentUser.has_completed_course && !currentUser.trial_task_used) && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      Вам доступно 1 пробное задание без прохождения курса.
                    </div>
                  )}
                  {(currentUser.completed_tasks_count || 0) >= 3 && (
                    <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
                      Вы можете создавать свои задания! (Права инспектора разблокированы)
                    </div>
                  )}
                </div>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${inspectorTab === 'tasks' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setInspectorTab('tasks')}
                >
                  <MapPin className="h-3.5 w-3.5" /> Доступные задания
                </button>
                <button 
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${inspectorTab === 'applications' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setInspectorTab('applications')}
                >
                  <Inbox className="h-3.5 w-3.5" /> История участия
                </button>
              </div>

              {inspectorTab === 'tasks' ? (
                <>
                  {tasks.filter(t => t.status === 'open').length === 0 && <p className="text-sm text-gray-500">Нет доступных заданий.</p>}
                  {tasks.filter(t => t.status === 'open').map(task => (
                    <Card key={task.id} className="hover:border-emerald-200 transition-colors">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base flex items-start justify-between">
                          <span>{task.title}</span>
                          {task.points && (
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                              +{task.points} баллов
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-sm text-gray-600">
                        {task.description}
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button 
                          className="w-full bg-emerald-600 hover:bg-emerald-700" 
                          size="sm"
                          onClick={() => {
                            if (!currentUser.has_completed_course) {
                              if (!currentUser.trial_task_used) {
                                useAppStore.getState().applyForTask(task.id);
                                toast.success('Вы использовали 1 пробное участие!');
                              } else {
                                toast.error('Сначала пройдите курс, чтобы выполнять задания!');
                                return;
                              }
                            }
                            setActiveTaskId(task.id);
                            setReportText('');
                            setPhotoAttached(false);
                            setReportOpen(true);
                          }}
                        >
                          Прикрепить отчет и завершить
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  {tasks.filter(t => t.status === 'completed').length === 0 && <p className="text-sm text-gray-500">История пуста.</p>}
                  {tasks.filter(t => t.status === 'completed').map(task => (
                    <Card key={task.id} className="opacity-70 bg-gray-50">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base flex items-start justify-between">
                          <span className="line-through text-gray-500">{task.title}</span>
                          {task.points && (
                            <span className="text-emerald-600 font-medium text-sm flex items-center gap-1">
                              +{task.points} <CheckCircle2 className="h-4 w-4" />
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-sm text-gray-500">
                        Выполнено
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-1/2 md:h-full min-h-[300px]">
        <MapComponent layer={layer} />
      </div>

      {/* Right Sidebar for DZZ Alerts (Inspector Only) */}
      {currentUser.role === 'inspector' && (
        <div className="w-full md:w-80 bg-white border-l flex flex-col z-10 shadow-sm h-1/3 md:h-full overflow-y-auto">
          <div className="p-4 border-b bg-gray-50 sticky top-0 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Camera className="h-4 w-4" /> Алерты ДЗЗ
            </h2>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-red-50/10">
            {dzzAlerts.length === 0 && <p className="text-sm text-gray-500">Нет новых алертов.</p>}
            
            {dzzAlerts.map(alert => (
              <Card key={alert.id} className="border-red-100 bg-red-50/30">
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold flex flex-col">
                      <span className="text-red-700 leading-tight">{alert.title}</span>
                      <span className="text-xs text-gray-500 font-normal mt-1">{alert.date}</span>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs font-medium text-gray-800 mt-1">
                    {alert.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-2 text-sm text-gray-600 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Обычный</span>
                      <div 
                        className="relative w-full h-16 rounded border overflow-hidden cursor-pointer group"
                        onClick={() => {
                          setSelectedPhotoUrl(alert.images.normal);
                          setSelectedPhotoFilter('');
                          setPhotoViewOpen(true);
                        }}
                      >
                        <img src={alert.images.normal} alt="Обычный спектр" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500">ИК (SWIR)</span>
                      <div 
                        className="relative w-full h-16 rounded border overflow-hidden cursor-pointer group"
                        onClick={() => {
                          setSelectedPhotoUrl(alert.images.infrared);
                          setSelectedPhotoFilter('sepia hue-rotate-[-50deg] saturate-200');
                          setPhotoViewOpen(true);
                        }}
                      >
                        <img src={alert.images.infrared} alt="Инфракрасный спектр" className="w-full h-full object-cover transition-transform group-hover:scale-105 sepia hue-rotate-[-50deg] saturate-200" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500">RTVI</span>
                      <div 
                        className="relative w-full h-16 rounded border overflow-hidden cursor-pointer group"
                        onClick={() => {
                          setSelectedPhotoUrl(alert.images.ndvi);
                          setSelectedPhotoFilter('sepia hue-rotate-[50deg] saturate-200 contrast-125');
                          setPhotoViewOpen(true);
                        }}
                      >
                        <img src={alert.images.ndvi} alt="RTVI спектр" className="w-full h-full object-cover transition-transform group-hover:scale-105 sepia hue-rotate-[50deg] saturate-200 contrast-125" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500">RTWI</span>
                      <div 
                        className="relative w-full h-16 rounded border overflow-hidden cursor-pointer group"
                        onClick={() => {
                          setSelectedPhotoUrl(alert.images.ndwi);
                          setSelectedPhotoFilter('sepia hue-rotate-[180deg] saturate-150 contrast-150');
                          setPhotoViewOpen(true);
                        }}
                      >
                        <img src={alert.images.ndwi} alt="RTWI спектр" className="w-full h-full object-cover transition-transform group-hover:scale-105 sepia hue-rotate-[180deg] saturate-150 contrast-150" />
                      </div>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Влажность (Moisture)</span>
                      <div 
                        className="relative w-full h-16 rounded border overflow-hidden cursor-pointer group"
                        onClick={() => {
                          setSelectedPhotoUrl(alert.images.moisture);
                          setSelectedPhotoFilter('sepia hue-rotate-[220deg] saturate-150 invert');
                          setPhotoViewOpen(true);
                        }}
                      >
                        <img src={alert.images.moisture} alt="Влажность" className="w-full h-full object-cover transition-transform group-hover:scale-105 sepia hue-rotate-[220deg] saturate-150 invert" />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="default"
                    className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs mt-2"
                    onClick={() => {
                      convertAlertToTask(alert.id);
                      toast.success('Алерт сконвертирован в задание для волонтеров');
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" /> Создать задание
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}


      {/* Upsell Dialog */}
      <Dialog open={upsellOpen} onOpenChange={setUpsellOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <span className="text-amber-500 text-2xl">🎓</span> Повышение квалификации
            </DialogTitle>
            <DialogDescription className="text-base pt-2 text-gray-600">
              Для работы с мультиспектральными слоями требуются специальные навыки. Пройдите курс повышения квалификации «Анализ ДЗЗ», чтобы открыть этот функционал.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-100 rounded-md p-4 text-sm text-amber-800">
            <strong>Программа курса:</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Основы дистанционного зондирования</li>
              <li>Расчет индексов (NDVI, NDWI)</li>
              <li>Анализ пожароопасности и вырубок</li>
            </ul>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setUpsellOpen(false)}>
              Узнать подробнее и записаться
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog for Volunteer */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-600" /> Отчет о выполнении
            </DialogTitle>
            <DialogDescription className="text-base pt-2 text-gray-600">
              Пожалуйста, прикрепите фото с места и оставьте комментарий (опционально), чтобы подтвердить выполнение задания.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${photoAttached ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:bg-gray-50 bg-white'}`}
              onClick={() => setPhotoAttached(true)}
            >
              {photoAttached ? (
                <>
                  <ImageIcon className="h-8 w-8 text-emerald-500 mb-2" />
                  <span className="text-sm font-medium text-emerald-700">Фото прикреплено (IMG_2026.jpg)</span>
                  <span className="text-xs text-emerald-600/70 mt-1">Нажмите, чтобы заменить</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Нажмите, чтобы загрузить фото</span>
                  <span className="text-xs text-gray-500 mt-1">JPG, PNG до 10 МБ</span>
                </>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-comment" className="text-sm font-medium">
                Комментарий
              </Label>
              <textarea 
                id="report-comment"
                className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 min-h-[80px]"
                placeholder="Что вы обнаружили на месте?"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
              disabled={!photoAttached}
              onClick={() => {
                if (activeTaskId) {
                  completeTask(activeTaskId);
                  const task = tasks.find(t => t.id === activeTaskId);
                  toast.success(`Задание «${task?.title || 'Без названия'}» выполнено! Отчет отправлен.`);
                  setReportOpen(false);
                }
              }}
            >
              Отправить отчет и завершить задание
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Dialog */}
      <Dialog open={photoViewOpen} onOpenChange={setPhotoViewOpen}>
        <DialogContent className="sm:max-w-3xl p-1 overflow-hidden bg-black/95 border-none">
          <DialogTitle className="sr-only">Просмотр фото</DialogTitle>
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {selectedPhotoUrl && (
              <img 
                src={selectedPhotoUrl} 
                alt="Увеличенное фото" 
                className={`max-w-full max-h-full object-contain ${selectedPhotoFilter}`}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full"
              onClick={() => setPhotoViewOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
