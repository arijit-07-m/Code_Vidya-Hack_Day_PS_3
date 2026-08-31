'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';

interface ClubInfo { id: string; name: string; description: string; membershipRole: string; }
interface ActivityItem { id: string; description: string; createdAt: string; userName: string; action: string; }

function DashboardContent() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [currentClub, setCurrentClub] = useState<ClubInfo | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => { loadClubs(); }, []);

  useEffect(() => {
    const cid = searchParams?.get('clubId');
    if (cid && clubs.length > 0) {
      setCurrentClubId(cid); setCurrentClub(clubs.find(c => c.id === cid) || null);
    }
  }, [searchParams, clubs]);

  useEffect(() => { if (currentClubId) loadDashboard(currentClubId); }, [currentClubId]);

  const loadClubs = async () => {
    try {
      const d: any = await api.get('/clubs/my');
      setClubs(d.clubs || []);
      if (d.clubs?.length > 0 && !currentClubId) {
        const id = searchParams?.get('clubId') || d.clubs[0].id;
        setCurrentClubId(id); setCurrentClub(d.clubs.find((c: any) => c.id === id) || null);
      }
    } catch (e) { console.error(e); }
  };

  const loadDashboard = async (clubId: string) => {
    setLoading(true);
    try {
      const d: any = await api.get(`/general/${clubId}/dashboard`);
      setOverview(d?.overview);
      const a: any = await api.get(`/general/${clubId}/activity?limit=10`);
      setActivity(a.logs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const hLogout = async () => { await logout(); router.push('/login'); };
  const hClubChange = (id: string) => {
    setCurrentClubId(id); setCurrentClub(clubs.find(c => c.id === id) || null);
    router.push(`/dashboard?clubId=${id}`);
  };
return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={currentClub?.name || 'Select Club'} />}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{greeting}, {profile?.displayName?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-gray-500 mt-1">{currentClub?.name}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="card"><div className="skeleton h-4 w-24 mb-2" /><div className="skeleton h-8 w-16" /></div>)}
          </div>
        ) : !currentClubId ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold mb-2">Welcome</h2>
            <p className="text-gray-500 mb-4">{clubs.length === 0 ? 'Create your first club' : 'Select a club'}</p>
            {clubs.length === 0 && <a href="/clubs/new" className="btn btn-primary">Create Club</a>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="card"><div className="text-sm text-gray-500 mb-1">Task Completion</div><div className="text-2xl font-bold">{overview?.completionPercent || 0}%</div><div className="text-xs text-gray-400 mt-1">{overview?.completedTasks || 0}/{overview?.totalTasks || 0}</div></div>
              <div className="card"><div className="text-sm text-gray-500 mb-1">Pending</div><div className="text-2xl font-bold">{overview?.pendingTasks || 0}</div><div className="flex gap-2 mt-1">{overview?.urgentTasks > 0 && <span className="badge badge-red">{overview.urgentTasks} urgent</span>}{overview?.overdueTasks > 0 && <span className="badge badge-yellow">{overview.overdueTasks} overdue</span>}</div></div>
              <div className="card"><div className="text-sm text-gray-500 mb-1">Open Risks</div><div className={`text-2xl font-bold ${overview?.openRisks > 0 ? 'text-red-600' : 'text-green-600'}`}>{overview?.openRisks || 0}</div></div>
              <div className="card"><div className="text-sm text-gray-500 mb-1">Members</div><div className="text-2xl font-bold">{overview?.volunteerCount || 0}</div><div className="text-xs text-gray-400 mt-1">{overview?.memberCount || 0} total</div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="card">
                <div className="card-header"><h2 className="card-title">⚠️ Alerts</h2></div>
                {overview?.urgentTasks > 0 || overview?.overdueTasks > 0 || overview?.openRisks > 0 ? (
                  <div className="space-y-2">
                    {overview?.urgentTasks > 0 && <div className="p-3 bg-red-50 rounded-lg text-sm">🔴 {overview.urgentTasks} urgent task{overview.urgentTasks > 1 ? 's' : ''}</div>}
                    {overview?.overdueTasks > 0 && <div className="p-3 bg-yellow-50 rounded-lg text-sm">🟡 {overview.overdueTasks} overdue</div>}
                    {overview?.openRisks > 0 && <div className="p-3 bg-orange-50 rounded-lg text-sm">⚠️ {overview.openRisks} risk{overview.openRisks > 1 ? 's' : ''}</div>}
                  </div>
                ) : <p className="text-sm text-gray-400">All clear ✅</p>}
              </div>
              <div className="card">
                <div className="card-header"><h2 className="card-title">📅 Events</h2><a href={`/events?clubId=${currentClubId}`} className="text-sm text-blue-600">View</a></div>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg text-sm"><span>Active</span><span className="font-semibold">{overview?.activeEvents || 0}</span></div>
                  <div className="flex justify-between p-3 bg-purple-50 rounded-lg text-sm"><span>Upcoming</span><span className="font-semibold">{overview?.upcomingEvents || 0}</span></div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2 className="card-title">📋 Activity</h2></div>
              {activity.length > 0 ? activity.slice(0, 5).map((i: ActivityItem) => (
                <div key={i.id} className="flex gap-3 p-2 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div><p className="text-sm">{i.description}</p><p className="text-xs text-gray-400">{i.userName} · {formatTime(i.createdAt)}</p></div>
                </div>
              )) : <p className="text-sm text-gray-400 py-4">No recent activity</p>}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return <AuthProvider><DashboardContent /></AuthProvider>;
}