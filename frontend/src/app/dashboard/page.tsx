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
  const { currentUser, logout, tasks, completeTask, applications, approveApplication, rejectApplication } = useAppStore();
  const [layer, setLayer] = useState('rgb');
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

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
                  <Layers className="h-4 w-4" /> Слои спутника
                </h3>
                <RadioGroup value={layer} onValueChange={handleLayerChange} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rgb" id="r1" />
                    <Label htmlFor="r1" className="cursor-pointer">True Color (RGB)</Label>
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
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3 text-gray-700">
                  <Inbox className="h-4 w-4" /> Заявки волонтеров
                </h3>
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
                          "{app.comment}"
                        </p>
                      )}
                      
                      {app.photoUrl && (
                        <div 
                          className="mb-3 relative w-full h-24 rounded border overflow-hidden cursor-pointer group"
                          onClick={() => {
                            setSelectedPhotoUrl(app.photoUrl || null);
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
            </div>
          )}

          {currentUser.role === 'volunteer' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium mb-2">Открытые задания</h3>
              {tasks.length === 0 && <p className="text-sm text-gray-500">Нет заданий.</p>}
              {tasks.map(task => (
                <Card key={task.id} className={task.status === 'completed' ? 'opacity-60 bg-gray-50' : ''}>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-start justify-between">
                      {task.title}
                      {task.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {task.status === 'open' ? 'В ожидании' : 'Выполнено'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-gray-600">
                    {task.description}
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    {task.status === 'open' ? (
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700" 
                        size="sm"
                        onClick={() => {
                          setActiveTaskId(task.id);
                          setReportText('');
                          setPhotoAttached(false);
                          setReportOpen(true);
                        }}
                      >
                        Прикрепить отчет и завершить
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" size="sm" disabled>
                        Завершено
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-1/2 md:h-full">
        <MapComponent layer={layer} />
      </div>

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
                className="max-w-full max-h-full object-contain"
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
