'use client';

import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, query, collection, where, getDocs, orderBy, limit } from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';

const cfg = { apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro", authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com", projectId: "code-vidya-hack-day-ps-3-6b47d" };
const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [clubId, setClubId] = useState<string | null>(null);
  const [club, setClub] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [roleName, setRoleName] = useState('');
  const [perms, setPerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
    const unsub = onAuthStateChanged(auth, u => { if (!u) { window.location.href = '/login'; return; } setUser(u); setChecked(true); });
    return () => unsub();
  }, []);

  useEffect(() => { if (checked) loadData(); }, [checked]);

  const loadData = async () => {
    try {
      const q = query(collection(db, 'clubMembers'), where('userId', '==', user.uid), where('status', '==', 'ACTIVE'));
      const snap = await getDocs(q);
      const myClubs = (await Promise.all(snap.docs.map(async d => {
        const m = d.data() as any;
        const c = await getDoc(doc(db, 'clubs', m.clubId));
        if (!c.exists()) return null;
        return { id: c.id, ...c.data(), membershipRole: m.role };
      }))).filter(Boolean);
      setClubs(myClubs);
      if (myClubs.length > 0) {
        const id = myClubs[0].id;
        setClubId(id);
const loadDashboard = async (id: string, c: any) => {
    try {
      if (c.membershipRole === 'OWNER') setRoleName('Owner');
      else if (c.membershipRole === 'ADMIN') setRoleName('Admin');
      const [tasksSnap, eventsSnap, membersSnap, risksSnap, logsSnap] = await Promise.all([
        getDocs(query(collection(db, 'tasks'), where('clubId', '==', id))),
        getDocs(query(collection(db, 'events'), where('clubId', '==', id))),
        getDocs(query(collection(db, 'clubMembers'), where('clubId', '==', id), where('status', '==', 'ACTIVE'))),
        getDocs(query(collection(db, 'risks'), where('clubId', '==', id), where('status', '==', 'OPEN'))),
        getDocs(query(collection(db, 'activityLogs'), where('clubId', '==', id), orderBy('createdAt', 'desc'), limit(10))),
      ]);
      const tasks = tasksSnap.docs.map(d => d.data() as any);
      const events = eventsSnap.docs.map(d => d.data() as any);
      const now = new Date();
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'COMPLETED').length;
      const pending = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
      const urgent = tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'COMPLETED').length;
      const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'COMPLETED').length;
      setOverview({
        totalTasks: total, completedTasks: completed, pendingTasks: pending,
        urgentTasks: urgent, overdueTasks: overdue,
        activeEvents: events.filter(e => e.status === 'ACTIVE').length,
        upcomingEvents: events.filter(e => e.status === 'PLANNING').length,
        completionPercent: total > 0 ? Math.round(completed / total * 100) : 0,
        memberCount: membersSnap.docs.length,
        openRisks: risksSnap.docs.length,
      });
      setActivity(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const hLogout = async () => { await signOut(auth); window.location.href = '/login'; };
  const hClubChange = async (id: string) => {
    setClubId(id);
    const c = clubs.find(x => x.id === id);
    setClub(c);
    await loadDashboard(id, c);
  };

  if (!checked || !user) return <div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar clubs={clubs} currentClubId={clubId || ''} userDisplayName={user?.email?.split('@')[0]} userEmail={user?.email} clubRole={roleName} userPermissions={perms} onClubChange={hClubChange} onLogout={hLogout} clubName={club?.name} />
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="card"><div className="skeleton h-4 w-24 mb-2" /><div className="skeleton h-8 w-16" /></div>)}</div>
          ) : !clubId ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2">Welcome to ClubOps AI!</h2>
                <p className="text-gray-500 mb-6">Create your first club to get started</p>
                <a href="/clubs/new" className="btn btn-primary btn-lg">Create Club</a>
              </div>
            </div>
          ) : (<>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">{greeting}, {user?.email?.split('@')[0] || 'there'} 👋</h1>
                <p className="text-gray-500 mt-1">{club?.name} · <span className="text-indigo-600 font-medium">{roleName}</span></p>
              </div>
              <div className="flex gap-2">
                <a href={`/events?clubId=${clubId}`} className="btn btn-primary btn-sm">+ Event</a>
                <a href={`/tasks?clubId=${clubId}`} className="btn btn-sm">+ Task</a>
              </div>
            </div>
        setClub(myClubs[0]);
        await loadDashboard(id, myClubs[0]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card"><p className="text-sm text-gray-500 mb-1">Active Events</p><p className="text-2xl font-bold">{overview?.activeEvents || 0}</p></div>
              <div className="card"><p className="text-sm text-gray-500 mb-1">Open Tasks</p><p className="text-2xl font-bold">{overview?.pendingTasks || 0}</p>
                <div className="flex gap-1 mt-1">{overview?.urgentTasks > 0 && <span className="badge badge-red">{overview.urgentTasks} urgent</span>}{overview?.overdueTasks > 0 && <span className="badge badge-yellow">{overview.overdueTasks} overdue</span>}</div></div>
              <div className="card"><p className="text-sm text-gray-500 mb-1">Risks</p><p className={`text-2xl font-bold ${overview?.openRisks > 0 ? 'text-red-600' : 'text-green-600'}`}>{overview?.openRisks || 0}</p></div>
              <div className="card"><p className="text-sm text-gray-500 mb-1">Members</p><p className="text-2xl font-bold">{overview?.memberCount || 0}</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="card">
                <div className="card-header"><h2 className="card-title">Task Progress</h2></div>
                <div className="flex items-end gap-2 mb-3"><span className="text-3xl font-bold">{overview?.completionPercent || 0}%</span><span className="text-sm text-gray-500 mb-1">complete</span></div>
                <div className="progress-bar"><div className={`progress-bar-fill ${(overview?.completionPercent||0)>70?'green':(overview?.completionPercent||0)>40?'yellow':'red'}`} style={{width:`${overview?.completionPercent||0}%`}}/></div>
                <div className="flex justify-between text-sm text-gray-500 mt-2"><span>{overview?.completedTasks||0} done</span><span>{overview?.totalTasks||0} total</span></div>
              </div>
              <div className="card">
                <div className="card-header"><h2 className="card-title">Quick Actions</h2></div>
                <div className="grid grid-cols-2 gap-3">
                  <a href={`/events?clubId=${clubId}`} className="btn btn-ghost btn-lg justify-start gap-3"><span>📅</span>Events</a>
                  <a href={`/tasks?clubId=${clubId}`} className="btn btn-ghost btn-lg justify-start gap-3"><span>✅</span>Tasks</a>
                  <a href={`/meetings?clubId=${clubId}`} className="btn btn-ghost btn-lg justify-start gap-3"><span>📝</span>Meetings</a>
                  <a href={`/ai-assistant?clubId=${clubId}`} className="btn btn-ghost btn-lg justify-start gap-3"><span>✨</span>AI</a>
                </div>
              </div>
            </div>

            {(overview?.urgentTasks>0||overview?.openRisks>0||overview?.overdueTasks>0)&&(
              <div className="card bg-indigo-50 border-indigo-200 mb-6">
                <div className="flex items-center gap-2 mb-3"><span className="text-lg">✨</span><h2 className="card-title">AI Operations Brief</h2></div>
                <div className="space-y-2">
                  {overview?.urgentTasks>0&&<p className="text-sm">🔴 {overview.urgentTasks} urgent task{overview.urgentTasks>1?'s':''} need attention</p>}
                  {overview?.overdueTasks>0&&<p className="text-sm">🟡 {overview.overdueTasks} overdue task{overview.overdueTasks>1?'s':''}</p>}
                  {overview?.openRisks>0&&<p className="text-sm">⚠️ {overview.openRisks} unresolved risk{overview.openRisks>1?'s':''}</p>}
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header"><h2 className="card-title">Recent Activity</h2></div>
              {activity.length===0?(<p className="text-sm text-gray-400 py-4">No activity yet</p>):(
                <div className="space-y-1">{activity.slice(0,5).map((a:any)=>(
                  <div key={a.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                    <div><p className="text-sm">{a.description}</p><p className="text-xs text-gray-400">{a.userName||'System'} · {timeAgo(a.createdAt)}</p></div>
                  </div>
                ))}</div>
              )}
            </div>
          </>)}
        </div>
      </main>
    </div>
  );
}

function timeAgo(d:string){const n=new Date();const m=Math.floor((n.getTime()-new Date(d).getTime())/60000);if(m<1)return'Just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return new Date(d).toLocaleDateString();}