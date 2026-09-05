"use client";

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, User } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const handleLogin = (role: 'inspector' | 'volunteer', name: string) => {
    setCurrentUser(role, name);
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ЭкоПлатформа ООПТ</CardTitle>
          <CardDescription>Выберите роль для входа в демо-режим</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full h-16 text-lg flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => handleLogin('inspector', 'Инспектор Иванов')}
          >
            <ShieldCheck className="w-6 h-6" />
            Войти как Инспектор ООПТ
          </Button>
          <Button 
            className="w-full h-16 text-lg flex items-center gap-3 bg-amber-600 hover:bg-amber-700"
            onClick={() => handleLogin('volunteer', 'Волонтер Анна')}
          >
            <User className="w-6 h-6" />
            Войти как Волонтер
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
