'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

function AnalyticsContent() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const d: any = await api.get('/clubs/my');
      setClubs(d.clubs || []);
      if (d.clubs?.length > 0) { const id = d.clubs[0].id; setCurrentClubId(id); loadDashboard(id); }
    })();
  }, []);

  const loadDashboard = async (clubId: string) => {
    try { const d: any = await api.get(`/general/${clubId}/dashboard`); setOverview(d?.overview); }
    catch (e) { console.error(e); }
  };

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); loadDashboard(id); };

  const completionPercent = overview?.completionPercent || 0;

  return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select'} />}>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📈 Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4">Task Completion</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">{completionPercent}%</span>
              <span className="text-sm text-gray-500 mb-1">complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>{overview?.completedTasks || 0} completed</span>
              <span>{overview?.pendingTasks || 0} pending</span>
              <span>{overview?.totalTasks || 0} total</span>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Task Status Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span>✅ Completed</span><span className="font-semibold text-green-600">{overview?.completedTasks || 0}</span></div>
              <div className="flex justify-between"><span>⏳ In Progress</span><span className="font-semibold text-blue-600">{overview?.pendingTasks || 0}</span></div>
              <div className="flex justify-between"><span>🔴 Blocked</span><span className="font-semibold text-red-600">{overview?.blockedTasks || 0}</span></div>
              <div className="flex justify-between"><span>⚠️ Overdue</span><span className="font-semibold text-yellow-600">{overview?.overdueTasks || 0}</span></div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Events</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span>🟢 Active</span><span>{overview?.activeEvents || 0}</span></div>
              <div className="flex justify-between"><span>🔵 Upcoming</span><span>{overview?.upcomingEvents || 0}</span></div>
              <div className="flex justify-between"><span>⚪ Completed</span><span>{overview?.completedEvents || 0}</span></div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Club Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span>👥 Members</span><span>{overview?.memberCount || 0}</span></div>
              <div className="flex justify-between"><span>🙋 Volunteers</span><span>{overview?.volunteerCount || 0}</span></div>
              <div className="flex justify-between"><span>⚠️ Open Risks</span><span className={overview?.openRisks > 0 ? 'text-red-600 font-semibold' : ''}>{overview?.openRisks || 0}</span></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AnalyticsPage() { return <AuthProvider><AnalyticsContent /></AuthProvider>; }