"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';

interface ReportItem {
  id: number;
  description: string;
  geom_wkt: string;
  status: string;
}

export default function Reports() {
  const { user, token, setUser, logout } = useUserStore();
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/');
      setReports(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (!user) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          logout();
          router.push('/login');
        });
    }

    let isMounted = true;
    api.get('/reports/')
      .then((res) => {
        if (isMounted) setReports(res.data);
      })
      .catch((e) => console.error(e));

    return () => {
      isMounted = false;
    };
  }, [token, router, user, setUser, logout]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.patch(`/reports/${id}`, { status });
      fetchReports();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Reports Moderation</h1>
      <table className="w-full text-left border">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Location (WKT)</th>
            <th className="border p-2">Status</th>
            {user?.role === 'inspector' && <th className="border p-2">Action</th>}
          </tr>
        </thead>
        <tbody>
          {reports.map((r: ReportItem) => (
            <tr key={r.id}>
              <td className="border p-2">{r.id}</td>
              <td className="border p-2">{r.description}</td>
              <td className="border p-2">{r.geom_wkt}</td>
              <td className="border p-2">{r.status}</td>
              {user?.role === 'inspector' && (
                <td className="border p-2">
                  <select 
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    className="p-1 border"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approve / Convert to Task</option>
                    <option value="rejected">Reject</option>
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
