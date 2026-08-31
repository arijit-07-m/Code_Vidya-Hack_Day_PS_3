'use client';
import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';
const cfg = { apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro", authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com", projectId: "code-vidya-hack-day-ps-3-6b47d" };
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
  try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return d; }
}
function fmtDateLong(d?: string) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; }
}
const stClass = (s: string) => s === 'ACTIVE' ? 'badge-green' : s === 'PLANNING' ? 'badge-blue' : s === 'COMPLETED' ? 'badge-gray' : 'badge-red';
const prClass = (p: string) => p === 'CRITICAL' ? 'badge-red' : p === 'HIGH' ? 'badge-yellow' : p === 'MEDIUM' ? 'badge-blue' : 'badge-gray';

export default function DashboardPage() {
  const [user, su] = useState<any>(null);
  const [checked, sc] = useState(false);
  const [clubs, scl] = useState<any[]>([]);
  const [cid, scid] = useState<string | null>(null);
  const [club, sclub] = useState<any>(null);
  const [rn, srn] = useState('');
  const [ld, sld] = useState(true);
  const [gr, sgr] = useState('Good');
  const [tasks, st] = useState<any[]>([]);
  const [events, se] = useState<any[]>([]);
  const [members, sm] = useState<any[]>([]);
  const [risks, sr] = useState<any[]>([]);
  const [act, sact] = useState<any[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    sgr(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
    const un = onAuthStateChanged(auth, (u: any) => { if (!u) { window.location.href = '/login'; return; } su(u); sc(true); });
    return () => un();
  }, []);
  useEffect(() => { if (checked) L(); }, [checked]);
  async function L() {
    try {
      const q = query(collection(db, 'clubMembers'), where('userId', '==', user.uid), where('status', '==', 'ACTIVE'));
      const sn = await getDocs(q);
      const mc = (await Promise.all(sn.docs.map(async (d: any) => {
        const m = d.data(); const c = await getDoc(doc(db, 'clubs', m.clubId));
        if (!c.exists()) return null; return { id: c.id, ...c.data(), membershipRole: m.role };
      }))).filter(Boolean);
      scl(mc);
      if (mc.length > 0) {
        const id = mc[0].id; scid(id); sclub(mc[0]);
        if (mc[0].membershipRole === 'OWNER') srn('Owner');
        else if (mc[0].membershipRole === 'ADMIN') srn('Admin');
        else if (mc[0].membershipRole === 'EVENT_HEAD') srn('Event Head');
        else if (mc[0].membershipRole === 'VOLUNTEER') srn('Volunteer');
        loadClubData(id);
      } else { sld(false); }
    } catch (e) { console.error(e); sld(false); }
  }
  async function loadClubData(id: string) {
    try {
      const [ts, es, ms, rs, ls] = await Promise.all([
        getDocs(query(collection(db, 'tasks'), where('clubId', '==', id))),
        getDocs(query(collection(db, 'events'), where('clubId', '==', id))),
        getDocs(query(collection(db, 'clubMembers'), where('clubId', '==', id), where('status', '==', 'ACTIVE'))),
        getDocs(query(collection(db, 'risks'), where('clubId', '==', id), where('status', '==', 'OPEN'))),
        getDocs(query(collection(db, 'activityLogs'), where('clubId', '==', id), orderBy('createdAt', 'desc'), limit(10))),
      ]);
      st(ts.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      se(es.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      sm(ms.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      sr(rs.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      sact(ls.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { sld(false); }
  }
  const hl = async () => { await signOut(auth); window.location.href = '/login'; };
  const hc = (id: string) => { scid(id); sclub(clubs.find((x: any) => x.id === id)); sld(true); loadClubData(id); };

  const now = new Date();
  const total = tasks.length;
  const doneT = tasks.filter((t: any) => t.status === 'COMPLETED').length;
  const pending = tasks.filter((t: any) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
  const urgent = tasks.filter((t: any) => t.priority === 'CRITICAL' && t.status !== 'COMPLETED').length;
  const highP = tasks.filter((t: any) => (t.priority === 'HIGH' || t.priority === 'CRITICAL') && t.status !== 'COMPLETED').length;
  const overdue = tasks.filter((t: any) => t.deadline && new Date(t.deadline) < now && t.status !== 'COMPLETED').length;
  const pct = total > 0 ? Math.round((doneT / total) * 100) : 0;
  const activeEvents = events.filter((e: any) => e.status === 'ACTIVE').length;
  const upcomingEvents = events.filter((e: any) => (e.status === 'PLANNING' || e.status === 'ACTIVE')).length;
  const openRisks = risks.length;
  const criticalRisks = risks.filter((r: any) => r.severity === 'CRITICAL').length;
  const highRisks = risks.filter((r: any) => r.severity === 'HIGH').length;
  const mediumRisks = risks.filter((r: any) => r.severity === 'MEDIUM').length;
  const todayTasks = tasks.filter((t: any) => {
    if (t.status === 'COMPLETED') return false;
    if (!t.deadline) return false;
    const dd = new Date(t.deadline); const t0 = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate()).getTime();
    const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return t0 <= n0 && (t.priority === 'HIGH' || t.priority === 'CRITICAL' || t0 === n0);
  });
  const overloaded = members.map((m: any) => {
    const cnt = tasks.filter((t: any) => t.assignedTo && (t.assignedTo === m.userId || t.assignedTo.toLowerCase() === (m.displayName || m.email || '').toLowerCase()) && t.status !== 'COMPLETED').length;
    return { m, cnt, pct: Math.min(100, Math.round((cnt / Math.max(1, members.length * 2)) * 100)) };
  }).filter((x: any) => x.cnt > 0).sort((a: any, b: any) => b.cnt - a.cnt);
  const aiInsights: string[] = [];
  if (urgent > 0) aiInsights.push('🔴 ' + urgent + ' urgent task' + (urgent > 1 ? 's are' : ' is') + ' due today');
  if (overdue > 0) aiInsights.push('🟠 ' + overdue + ' task' + (overdue > 1 ? 's are' : ' is') + ' past deadline');
  if (openRisks > 0) aiInsights.push('⚠️ ' + openRisks + ' open risk' + (openRisks > 1 ? 's including ' + criticalRisks + ' critical' : (criticalRisks > 0 ? ' — critical' : '')));
  if (overloaded.length > 0) aiInsights.push('👤 ' + overloaded[0].m.displayName + ' has ' + overloaded[0].cnt + ' active tasks');
  if (pending > 0 && urgent === 0) aiInsights.push('📋 ' + pending + ' tasks in progress');
  const aiTip = overloaded.length > 0 ? 'Reassign some tasks from ' + (overloaded[0].m.displayName || 'the busiest member') + ' to balance the workload.' : openRisks > 0 ? 'Review the risk center and resolve open risks.' : urgent > 0 ? 'Tackle urgent tasks first today.' : 'All clear. Keep up the great work!';

  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>;
  return (
    <div className="flex min-h-screen">
      <Sidebar clubs={clubs} currentClubId={cid || ''} userDisplayName={user?.email?.split('@')[0]} clubRole={rn} onClubChange={hc} onLogout={hl} clubName={club?.name} />
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {ld && !cid ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="card"><div className="skeleton h-4 w-24 mb-2" /><div className="skeleton h-8 w-16" /></div>)}</div>
          ) : !cid ? (
            <div className="text-center py-20"><div className="text-4xl mb-4">🎉</div><h2 className="text-2xl font-bold mb-2">Welcome to ClubOps AI!</h2><p className="text-gray-500 mb-6">Create your first club to get started</p><a href="/clubs/new" className="btn btn-primary btn-lg">Create Club</a></div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold">{gr}, {(user?.email?.split('@')[0]) || 'there'} 👋</h1>
                  <p className="text-gray-500 mt-1">{club?.name} · <span className="text-indigo-600 font-medium">{rn || 'Member'}</span></p>
                </div>
                <div className="flex gap-2">
                  <a href={'/events?clubId=' + cid} className="btn btn-primary btn-sm">+ New Event</a>
                  <a href={'/tasks?clubId=' + cid} className="btn btn-primary btn-sm">+ New Task</a>
                  <a href={'/ai-assistant?clubId=' + cid} className="btn btn-sm">✨ Ask AI</a>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card"><p className="text-sm text-gray-500 mb-1">Active Events</p><p className="text-2xl font-bold">{activeEvents}</p><p className="text-xs text-gray-400 mt-1">{upcomingEvents} upcoming</p></div>
                <div className="card"><p className="text-sm text-gray-500 mb-1">Open Tasks</p><p className="text-2xl font-bold">{pending}</p>{urgent > 0 && <span className="badge badge-red">{urgent} urgent</span>}<span className="badge badge-blue ml-1">{overdue} overdue</span></div>
                <div className="card"><p className="text-sm text-gray-500 mb-1">Risks</p><p className={"text-2xl font-bold " + (openRisks > 0 ? 'text-red-600' : 'text-green-600')}>{openRisks}</p>{criticalRisks > 0 && <span className="badge badge-red">{criticalRisks} critical</span>}</div>
                <div className="card"><p className="text-sm text-gray-500 mb-1">Members</p><p className="text-2xl font-bold">{members.length}</p><p className="text-xs text-gray-400 mt-1">in this club</p></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* AI Operations Brief */}
                <div className="card lg:col-span-2 border-t-4 border-t-indigo-500">
                  <div className="flex items-center gap-2 mb-2"><span className="text-lg">✨</span><h2 className="card-title">AI Operations Brief</h2></div>
                  <p className="text-sm text-gray-500 mb-3">Here&apos;s what needs your attention.</p>
                  {aiInsights.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4">No insights yet. Create events, tasks and meetings to let ClubOps AI identify important actions and risks.</div>
                  ) : (
                    <div className="space-y-2 mb-3">{aiInsights.slice(0, 4).map((s, i) => <div key={i} className="text-sm p-2 bg-gray-50 rounded-lg">{s}</div>)}</div>
                  )}
                  {aiInsights.length > 0 && <div className="text-sm p-3 bg-indigo-50 text-indigo-700 rounded-lg mb-4">💡 Recommendation: {aiTip}</div>}
                  <div className="flex gap-2 flex-wrap">
                    <a href={'/risks?clubId=' + cid} className="btn btn-sm">Review Risks</a>
                    <a href={'/tasks?clubId=' + cid} className="btn btn-sm">View Tasks</a>
                    <a href={'/ai-assistant?clubId=' + cid} className="btn btn-sm btn-primary">Ask AI</a>
                  </div>
                </div>
                {/* Volunteer Workload */}
                <div className="card">
                  <h2 className="card-title mb-3">Volunteer Workload</h2>
                  {overloaded.length === 0 ? <p className="text-sm text-gray-400">No workload data yet.</p> : overloaded.slice(0, 5).map((x: any) => (
                    <div key={x.m.id} className="mb-3">
                      <div className="flex justify-between text-sm mb-1"><span className="font-medium truncate">{x.m.displayName || x.m.email}</span><span className="text-gray-500">{x.pct}%</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={"h-full " + (x.pct > 80 ? 'bg-red-500' : x.pct > 50 ? 'bg-yellow-500' : 'bg-green-500')} style={{ width: x.pct + '%' }} /></div>
                    </div>
                  ))}
                  <a href={'/volunteers?clubId=' + cid} className="btn btn-sm mt-2 w-full">View Volunteers</a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Upcoming Events */}
                <div className="card lg:col-span-2">
                  <h2 className="card-title mb-3">Upcoming Events</h2>
                  {events.length === 0 ? <p className="text-sm text-gray-400 py-4">No events yet. Create your first event.</p> : events.slice(0, 3).map((e: any) => {
                    const evtTasks = tasks.filter((t: any) => t.eventId === e.id);
                    const evtDone = evtTasks.filter((t: any) => t.status === 'COMPLETED').length;
                    const evtPct = evtTasks.length > 0 ? Math.round((evtDone / evtTasks.length) * 100) : 0;
                    return (
                      <div key={e.id} className="border border-gray-100 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{e.eventName}</p><span className={"badge " + stClass(e.status)}>{e.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{e.date ? fmtDateLong(e.date) : 'Date TBD'} · {e.venue || 'Venue TBD'}</p>
                        {evtTasks.length > 0 && <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: evtPct + '%' }} /></div><span className="text-xs text-gray-500">{evtDone}/{evtTasks.length} tasks</span></div>}
                        <div className="flex gap-2 mt-2 text-xs text-gray-400">{evtTasks.length} tasks · {risks.length} risks</div>
                        <a href={'/events?clubId=' + cid + '&eventId=' + e.id} className="btn btn-sm mt-2">Open Event</a>
                      </div>
                    );
                  })}
                  <a href={'/events?clubId=' + cid} className="btn btn-sm mt-2">View All Events</a>
                </div>
                {/* Risk Overview */}
                <div className="card">
                  <h2 className="card-title mb-3">Risk Overview</h2>
                  {risks.length === 0 ? <p className="text-sm text-gray-400 py-4">✓ No active risks</p> : (
                    <div className="space-y-2">
                      {criticalRisks > 0 && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm">{criticalRisks} Critical</span></div>}
                      {highRisks > 0 && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500" /><span className="text-sm">{highRisks} High</span></div>}
                      {mediumRisks > 0 && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-sm">{mediumRisks} Medium</span></div>}
                      {risks.slice(0, 2).map((r: any) => <div key={r.id} className="text-xs text-gray-500 p-2 bg-gray-50 rounded">⚠️ {r.title}</div>)}
                    </div>
                  )}
                  <a href={'/risks?clubId=' + cid} className="btn btn-sm mt-3 w-full">View Risk Center</a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Today's Tasks */}
                <div className="card">
                  <h2 className="card-title mb-3">Today&apos;s Tasks</h2>
                  {todayTasks.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4">✓ You&apos;re all caught up. No pending tasks today.</div>
                  ) : todayTasks.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{t.title}</p><p className="text-xs text-gray-400">{t.assignedTo || 'Unassigned'} · due {fmtDate(t.deadline)}</p></div>
                      <div className="flex items-center gap-2 flex-shrink-0"><span className={"badge " + prClass(t.priority)}>{t.priority}</span><span className="badge">{t.status === 'TODO' ? 'To Do' : 'In Progress'}</span></div>
                    </div>
                  ))}
                  <a href={'/tasks?clubId=' + cid} className="btn btn-sm mt-2 w-full">View All Tasks</a>
                </div>
                {/* Recent Activity */}
                <div className="card">
                  <h2 className="card-title mb-3">Recent Activity</h2>
                  {act.length === 0 ? <p className="text-sm text-gray-400 py-4">No recent activity.</p> : act.slice(0, 6).map((a: any) => (
                    <div key={a.id} className="flex gap-3 p-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0"><p className="text-sm">{a.description}</p><p className="text-xs text-gray-400">{a.userName || 'System'} · {timeAgo(a.createdAt)}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-3"><h2 className="card-title">Task Completion</h2><span className="text-2xl font-bold text-indigo-600">{pct}%</span></div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all" style={{ width: pct + '%' }} /></div>
                  <p className="text-xs text-gray-400 mt-2">{doneT} of {total} tasks completed</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
