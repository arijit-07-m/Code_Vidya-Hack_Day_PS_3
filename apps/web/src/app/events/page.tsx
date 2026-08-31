'use client';
import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';
const cfg = { apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro", authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com", projectId: "code-vidya-hack-day-ps-3-6b47d" };
const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

export default function EventsPage() {
  const [user, su] = useState<any>(null);
  const [ck, sc] = useState(false);
  const [clubs, scl] = useState<any[]>([]);
  const [cid, scid] = useState<string|null>(null);
  const [ev, se] = useState<any[]>([]);
  const [ld, sld] = useState(true);
  const [sh, ssh] = useState(false);
  const [f, sf] = useState({ eventName: '', date: '', venue: '', description: '', format: 'INTERNAL' });

  useEffect(() => { const un = onAuthStateChanged(auth, u => { if (!u) { window.location.href = '/login'; return; } su(u); sc(true); }); return () => un(); }, []);
  useEffect(() => { if (ck) load(); }, [ck]);

  async function load() {
    const q = query(collection(db, 'clubMembers'), where('userId', '==', user.uid), where('status', '==', 'ACTIVE'));
    const sn = await getDocs(q);
    const mc = (await Promise.all(sn.docs.map(async d => { const m = d.data() as any; const c = await getDoc(doc(db, 'clubs', m.clubId)); if (!c.exists()) return null; return { id: c.id, ...c.data(), membershipRole: m.role }; }))).filter(Boolean);
    scl(mc);
    if (mc.length > 0) { scid(mc[0].id); loadEvents(mc[0].id); }
  }

  async function loadEvents(id: string) {
    sld(true);
    try { const sn = await getDocs(query(collection(db, 'events'), where('clubId', '==', id), orderBy('createdAt', 'desc'))); se(sn.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) {}
    finally { sld(false); }
  }

  async function cr() {
    const ref = await addDoc(collection(db, 'events'), { ...f, clubId: cid, status: 'PLANNING', createdBy: user.uid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await addDoc(collection(db, 'activityLogs'), { clubId: cid, userId: user.uid, userName: user.email, action: 'EVENT_CREATED', description: `Event "${f.eventName}" created`, createdAt: new Date().toISOString() });
    ssh(false); sf({ eventName: '', date: '', venue: '', description: '', format: 'INTERNAL' }); if (cid) loadEvents(cid);
  }

  const hl = async () => { await signOut(auth); window.location.href = '/login'; };
  const hc = (id: string) => { scid(id); loadEvents(id); };
  const statusClass = (s: string) => s === 'ACTIVE' ? 'badge-green' : s === 'PLANNING' ? 'badge-blue' : s === 'COMPLETED' ? 'badge-gray' : 'badge-red';

  return (
    <div className="flex min-h-screen">
      <Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} onClubChange={hc} onLogout={hl} clubName={clubs.find(c=>c.id===cid)?.name} />
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">📅 Events</h1>
            <button className="btn btn-primary" onClick={()=>ssh(!sh)}>{sh ? 'Cancel' : '+ New Event'}</button>
          </div>
          {sh && (
            <div className="card mb-6">
              <h3 className="font-semibold mb-4">New Event</h3>
              <div className="space-y-3">
                <input className="input" placeholder="Event name" value={f.eventName} onChange={e=>sf({...f,eventName:e.target.value})} />
                <input className="input" type="date" value={f.date} onChange={e=>sf({...f,date:e.target.value})} />
                <input className="input" placeholder="Venue" value={f.venue} onChange={e=>sf({...f,venue:e.target.value})} />
                <textarea className="textarea" placeholder="Description" value={f.description} onChange={e=>sf({...f,description:e.target.value})} />
                <button className="btn btn-primary" onClick={cr}>Create Event</button>
              </div>
            </div>
          )}
          {ld ? (
            <div className="grid grid-cols-2 gap-4">{[1,2].map(i=><div key={i} className="card"><div className="skeleton h-6 w-48 mb-2"/><div className="skeleton h-4 w-32"/></div>)}</div>
          ) : ev.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📅</div><p className="empty-state-title">No events yet</p><p className="empty-state-text">Create your first event</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ev.map(e => (
                <div key={e.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold">{e.eventName}</h3>
                    <span className={`badge ${statusClass(e.status)}`}>{e.status}</span>
                  </div>
                  {e.date && <p className="text-sm text-gray-500">📅 {new Date(e.date).toLocaleDateString()}</p>}
                  {e.venue && <p className="text-sm text-gray-500">📍 {e.venue}</p>}
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{e.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}