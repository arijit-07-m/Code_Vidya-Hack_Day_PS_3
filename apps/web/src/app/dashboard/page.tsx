'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';

const cfg = {
  apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",
  authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",
  projectId: "code-vidya-hack-day-ps-3-6b47d",
};

const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

function timeAgo(iso: string) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function fmtDate(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

function fmtDateLong(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

const stClass = (s: string) =>
  s === 'ACTIVE'
    ? 'badge-green'
    : s === 'PLANNING'
    ? 'badge-blue'
    : s === 'COMPLETED'
    ? 'badge-gray'
    : 'badge-red';

const prClass = (p: string) =>
  p === 'CRITICAL'
    ? 'badge-red'
    : p === 'HIGH'
    ? 'badge-yellow'
    : p === 'MEDIUM'
    ? 'badge-blue'
    : 'badge-gray';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [club, setClub] = useState<any>(null);
  const [roleName, setRoleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good day');
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = '/login';
        return;
      }
      setUser(u);
      setChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (checked && user) {
      loadClubs();
    }
  }, [checked, user]);

  async function loadClubs() {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'clubMembers'),
        where('userId', '==', user.uid),
        where('status', '==', 'ACTIVE')
      );
      const snapshot = await getDocs(q);
      const rawClubs = await Promise.all(
        snapshot.docs.map(async (d) => {
          const m = d.data() as any;
          const c = await getDoc(doc(db, 'clubs', m.clubId));
          if (!c.exists()) return null;
          return { id: c.id, ...c.data(), membershipRole: m.role };
        })
      );
      const memberClubs: any[] = rawClubs.filter((x): x is any => Boolean(x));

      setClubs(memberClubs);
      if (memberClubs.length > 0 && memberClubs[0]) {
        const firstClub = memberClubs[0];
        setCurrentClubId(firstClub.id);
        setClub(firstClub);
        if (firstClub.membershipRole === 'OWNER') setRoleName('Owner');
        else if (firstClub.membershipRole === 'ADMIN') setRoleName('Admin');
        else if (firstClub.membershipRole === 'EVENT_HEAD') setRoleName('Event Head');
        else if (firstClub.membershipRole === 'VOLUNTEER') setRoleName('Volunteer');
        else setRoleName('Member');

        loadClubData(firstClub.id);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadClubData(id: string) {
    try {
      const [ts, es, ms, rs, ls] = await Promise.all([
        getDocs(query(collection(db, 'tasks'), where('clubId', '==', id))),
        getDocs(query(collection(db, 'events'), where('clubId', '==', id))),
        getDocs(
          query(
            collection(db, 'clubMembers'),
            where('clubId', '==', id),
            where('status', '==', 'ACTIVE')
          )
        ),
        getDocs(
          query(
            collection(db, 'risks'),
            where('clubId', '==', id),
            where('status', '==', 'OPEN')
          )
        ),
        getDocs(
          query(
            collection(db, 'activityLogs'),
            where('clubId', '==', id),
            orderBy('createdAt', 'desc'),
            limit(10)
          )
        ),
      ]);

      setTasks(ts.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEvents(es.docs.map((d) => ({ id: d.id, ...d.data() })));
      setMembers(ms.docs.map((d) => ({ id: d.id, ...d.data() })));
      setRisks(rs.docs.map((d) => ({ id: d.id, ...d.data() })));
      setActivities(ls.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (id: string) => {
    setCurrentClubId(id);
    setClub(clubs.find((x) => x.id === id));
    setLoading(true);
    loadClubData(id);
  };

  const now = new Date();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
  const urgentTasks = tasks.filter((t) => t.priority === 'CRITICAL' && t.status !== 'COMPLETED').length;
  const overdueTasks = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'COMPLETED'
  ).length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeEvents = events.filter((e) => e.status === 'ACTIVE' || e.status === 'PLANNING').length;
  const openRisks = risks.length;
  const criticalRisks = risks.filter((r) => r.severity === 'CRITICAL').length;
  const highRisks = risks.filter((r) => r.severity === 'HIGH').length;

  const todayTasks = tasks.filter((t) => {
    if (t.status === 'COMPLETED') return false;
    if (!t.deadline) return false;
    const dd = new Date(t.deadline);
    const t0 = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate()).getTime();
    const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return t0 <= n0 && (t.priority === 'HIGH' || t.priority === 'CRITICAL' || t0 === n0);
  });

  const overloaded = members
    .map((m) => {
      const cnt = tasks.filter(
        (t) =>
          t.assignedTo &&
          (t.assignedTo === m.userId ||
            t.assignedTo.toLowerCase() === (m.displayName || m.email || '').toLowerCase()) &&
          t.status !== 'COMPLETED'
      ).length;
      return {
        m,
        cnt,
        pct: Math.min(100, Math.round((cnt / Math.max(1, members.length * 2)) * 100)),
      };
    })
    .filter((x) => x.cnt > 0)
    .sort((a, b) => b.cnt - a.cnt);

  const aiInsights: string[] = [];
  if (urgentTasks > 0)
    aiInsights.push(`🔴 ${urgentTasks} urgent task${urgentTasks > 1 ? 's are' : ' is'} due`);
  if (overdueTasks > 0)
    aiInsights.push(`⚠️ ${overdueTasks} task${overdueTasks > 1 ? 's are' : ' is'} past deadline`);
  if (openRisks > 0)
    aiInsights.push(
      `🚨 ${openRisks} open risk${openRisks > 1 ? 's' : ''}${criticalRisks > 0 ? ` (${criticalRisks} critical)` : ''}`
    );
  if (overloaded.length > 0)
    aiInsights.push(
      `👤 ${overloaded[0].m.displayName || overloaded[0].m.email} has ${overloaded[0].cnt} active tasks`
    );
  if (pendingTasks > 0 && urgentTasks === 0)
    aiInsights.push(`📋 ${pendingTasks} operational tasks in progress`);

  const aiTip =
    overloaded.length > 0
      ? `Reassign some tasks from ${overloaded[0].m.displayName || 'the busiest member'} to balance team workload.`
      : openRisks > 0
      ? 'Review the risk center to address flagged logistical items.'
      : urgentTasks > 0
      ? 'Tackle critical priority items first today.'
      : 'All systems green! Operations are running smoothly.';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clubs={clubs}
        currentClubId={currentClubId || ''}
        userDisplayName={user?.email?.split('@')[0]}
        clubRole={roleName}
        onClubChange={handleClubChange}
        onLogout={handleLogout}
        clubName={club?.name}
      />
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {loading && !currentClubId ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-4 w-24 mb-2" />
                  <div className="skeleton h-8 w-16" />
                </div>
              ))}
            </div>
          ) : !currentClubId ? (
            <div className="text-center py-20 card max-w-lg mx-auto">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to ClubOps AI!</h2>
              <p className="text-gray-500 mb-6">Create or join a club workspace to get started</p>
              <a href="/clubs/new" className="btn btn-primary btn-lg">
                Create Club Workspace
              </a>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold">
                    {greeting}, {user?.email?.split('@')[0] || 'Member'} 👋
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {club?.name} · <span className="text-indigo-600 font-semibold">{roleName || 'Member'}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`/events?clubId=${currentClubId}`} className="btn btn-primary btn-sm">
                    + New Event
                  </a>
                  <a href={`/tasks?clubId=${currentClubId}`} className="btn btn-primary btn-sm">
                    + New Task
                  </a>
                  <a href={`/ai-assistant?clubId=${currentClubId}`} className="btn btn-sm bg-white border border-gray-200">
                    ✨ Ask AI
                  </a>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Active Events
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{activeEvents}</p>
                  <p className="text-xs text-gray-400 mt-1">{events.length} total events</p>
                </div>
                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Open Tasks
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{pendingTasks}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {urgentTasks > 0 && <span className="badge badge-red">{urgentTasks} urgent</span>}
                    {overdueTasks > 0 && <span className="badge badge-blue">{overdueTasks} overdue</span>}
                  </div>
                </div>
                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Operational Risks
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      openRisks > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {openRisks}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {criticalRisks > 0 ? `${criticalRisks} critical priority` : 'Healthy status'}
                  </p>
                </div>
                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Team Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-xs text-gray-400 mt-1">in this workspace</p>
                </div>
              </div>

              {/* AI Brief & Workload */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="card lg:col-span-2 border-t-4 border-t-indigo-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✨</span>
                    <h2 className="card-title">AI Operations Brief</h2>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Live algorithmic and AI operational analysis</p>
                  {aiInsights.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4">
                      No critical alerts. Add tasks, meetings, and events to activate continuous operations tracking.
                    </div>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {aiInsights.slice(0, 4).map((s, i) => (
                        <div key={i} className="text-xs p-2.5 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-800">
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs p-3 bg-indigo-50 text-indigo-800 rounded-lg mb-4 font-medium border border-indigo-100">
                    💡 <strong>Recommendation:</strong> {aiTip}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a href={`/risks?clubId=${currentClubId}`} className="btn btn-sm bg-white border border-gray-200">
                      Review Risks
                    </a>
                    <a href={`/tasks?clubId=${currentClubId}`} className="btn btn-sm bg-white border border-gray-200">
                      View Tasks
                    </a>
                    <a href={`/ai-assistant?clubId=${currentClubId}`} className="btn btn-sm btn-primary">
                      Open AI Assistant
                    </a>
                  </div>
                </div>

                <div className="card">
                  <h2 className="card-title mb-3">Volunteer Workload</h2>
                  {overloaded.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No active task assignments.</p>
                  ) : (
                    overloaded.slice(0, 5).map((x) => (
                      <div key={x.m.id} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-800 truncate">
                            {x.m.displayName || x.m.email}
                          </span>
                          <span className="text-gray-500">{x.cnt} tasks</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              x.cnt >= 4 ? 'bg-red-500' : x.cnt >= 2 ? 'bg-indigo-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${x.pct}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                  <a href={`/volunteers?clubId=${currentClubId}`} className="btn btn-sm mt-2 w-full bg-white border border-gray-200">
                    Manage Volunteers
                  </a>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="card lg:col-span-2">
                  <h2 className="card-title mb-3">Upcoming Events</h2>
                  {events.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No upcoming events. Create your first event to get started.</p>
                  ) : events.slice(0, 3).map((e) => {
                    const evtTasks = tasks.filter((t) => t.eventId === e.id);
                    const evtDone = evtTasks.filter((t) => t.status === 'COMPLETED').length;
                    const evtPct = evtTasks.length > 0 ? Math.round((evtDone / evtTasks.length) * 100) : 0;
                    return (
                      <div key={e.id} className="border border-gray-100 rounded-lg p-3 mb-2 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-gray-900">{e.eventName}</p>
                          <span className={"badge " + stClass(e.status)}>{e.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{e.date ? fmtDateLong(e.date) : 'Date TBD'} {(e.venue ? '· ' + e.venue : '')}</p>
                        {evtTasks.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: evtPct + '%' }} />
                            </div>
                            <span className="text-xs text-gray-500">{evtDone}/{evtTasks.length}</span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2 text-xs text-gray-400">
                          <span>{evtTasks.length} tasks</span>
                          <span>{risks.filter(r => r.eventId === e.id).length} risks</span>
                        </div>
                        <a href={'/events?clubId=' + currentClubId + '&eventId=' + e.id} className="btn btn-sm mt-2">Open Event</a>
                      </div>
                    );
                  })}
                  {events.length > 3 && <p className="text-xs text-gray-400 mt-2">+{events.length - 3} more events</p>}
                  <a href={'/events?clubId=' + currentClubId} className="btn btn-sm mt-3 w-full bg-white border border-gray-200">View All Events</a>
                </div>
                <div className="card">
                  <h2 className="card-title mb-3">Risk Overview</h2>
                  {risks.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">✓ No active operational risks</p>
                  ) : (
                    <div className="space-y-2">
                      {criticalRisks > 0 && <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-sm font-medium">{criticalRisks} Critical</span></div>}
                      {highRisks > 0 && <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /><span className="text-sm font-medium">{highRisks} High</span></div>}
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /><span className="text-sm font-medium">{risks.filter(r => r.severity === 'MEDIUM' || r.severity === 'LOW').length} Other</span></div>
                      {risks.slice(0, 2).map((r) => (
                        <div key={r.id} className="text-xs text-gray-600 p-2 bg-gray-50 rounded-lg border border-gray-100">⚠️ {r.title}</div>
                      ))}
                    </div>
                  )}
                  <a href={'/risks?' + (currentClubId ? 'clubId=' + currentClubId : '')} className="btn btn-sm mt-3 w-full bg-white border border-gray-200">View Risk Center</a>
                </div>
              </div>

              {/* Today's Tasks & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="card">
                  <h2 className="card-title mb-3">Today&apos;s Critical Tasks</h2>
                  {todayTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">
                      ✓ No pending urgent tasks due today.
                    </p>
                  ) : (
                    todayTasks.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-semibold text-gray-900 truncate">{t.title}</p>
                          <p className="text-[11px] text-gray-400">
                            👤 {t.assignedToName || t.assignedTo || 'Unassigned'} · Due {fmtDate(t.deadline)}
                          </p>
                        </div>
                        <span className={`badge ${prClass(t.priority)} text-[10px]`}>
                          {t.priority}
                        </span>
                      </div>
                    ))
                  )}
                  <a href={`/tasks?clubId=${currentClubId}`} className="btn btn-sm mt-3 w-full bg-white border border-gray-200">
                    View All Tasks ({tasks.length})
                  </a>
                </div>

                <div className="card">
                  <h2 className="card-title mb-3">Live Activity Stream</h2>
                  {activities.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No recent activity.</p>
                  ) : (
                    activities.slice(0, 6).map((a) => (
                      <div key={a.id} className="flex gap-3 p-2 text-xs">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-medium">{a.description}</p>
                          <p className="text-gray-400 text-[10px]">
                            {a.userName || 'User'} · {timeAgo(a.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="card mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="card-title">Club Task Velocity</h2>
                  <span className="text-xl font-bold text-indigo-600">{completionPercent}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {completedTasks} of {totalTasks} total tasks completed
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
