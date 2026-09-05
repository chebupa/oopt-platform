"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';

export default function Login() {
  const [email, setEmail] = useState('inspector@example.com');
  const [password, setPassword] = useState('password');
  const { setToken, setUser } = useUserStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const token = res.data.access_token;
      setToken(token);
      
      const meRes = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(meRes.data);
      
      router.push('/');
    } catch (e) {
      console.error(e);
      alert("Login failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-md rounded w-96">
        <h2 className="text-2xl mb-4 font-bold text-center">Login</h2>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input 
            type="email" 
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1">Password</label>
          <input 
            type="password" 
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
}
