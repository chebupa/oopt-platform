"use client";

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Gift, Plane, Shirt } from 'lucide-react';
import { useEffect } from 'react';

const ITEMS = [
  { id: 'trip_1', title: 'Поездка на Байкал (3 дня)', price: 500, type: 'trip', icon: Plane, desc: 'Эко-тур с проживанием на базе.' },
  { id: 'trip_2', title: 'Экскурсия в заповедник Столбы', price: 200, type: 'trip', icon: Plane, desc: 'Пеший маршрут с гидом (1 день).' },
  { id: 'merch_1', title: 'Фирменная толстовка ЭкоПлатформы', price: 150, type: 'merch', icon: Shirt, desc: 'Теплая худи из переработанных материалов.' },
  { id: 'merch_2', title: 'Термос', price: 80, type: 'merch', icon: Gift, desc: 'Металлический термос 1л.' },
];

export default function StorePage() {
  const router = useRouter();
  const { currentUser, userPoints, buyItem } = useAppStore();

  useEffect(() => {
    if (!currentUser) router.push('/login');
  }, [currentUser, router]);

  if (!currentUser) return null;

  const handleBuy = (price: number, title: string) => {
    if (userPoints < price) {
      toast.error('Недостаточно баллов!');
      return;
    }
    buyItem(price);
    toast.success(`Вы успешно приобрели: ${title}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-emerald-800">Магазин поощрений</h1>
          </div>
          <div className="bg-emerald-100 px-3 py-1.5 rounded-full text-emerald-800 font-semibold text-sm">
            {userPoints} баллов
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <p className="text-gray-600 mb-8">Обменивайте заработанные баллы за волонтерство на полезный мерч и уникальные поездки в национальные парки.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ITEMS.map(item => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <item.icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded text-sm">
                    {item.price} б.
                  </span>
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Image placeholder */}
                <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                  [Фото]
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700" 
                  disabled={userPoints < item.price}
                  onClick={() => handleBuy(item.price, item.title)}
                >
                  {userPoints >= item.price ? 'Купить' : 'Не хватает баллов'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
