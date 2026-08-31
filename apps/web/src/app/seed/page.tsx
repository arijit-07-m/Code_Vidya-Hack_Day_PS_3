'use client';
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
const cfg = { apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro", authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com", projectId: "code-vidya-hack-day-ps-3-6b47d" };
const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

export default function SeedPage() {
  const [user, su] = useState<any>(null);
  const [status, ss] = useState('Checking...');
  const [busy, sb] = useState(false);
  useEffect(() => { onAuthStateChanged(auth, u => { if (u) { su(u); ss('Ready'); } else { ss('Login first'); } }); }, []);

  async function go() {
    if (!user) return; sb(true); ss('Creating...');
    try {
      const iso = new Date().toISOString();
      const cid = (await addDoc(collection(db, 'clubs'), { name: 'Code Vidhya Club', description: 'Official coding club', category: 'Technical', ownerId: user.uid, createdAt: iso })).id;
      await addDoc(collection(db, 'clubMembers'), { clubId: cid, userId: user.uid, role: 'OWNER', status: 'ACTIVE', joinedAt: iso, displayName: user.email?.split('@')[0] || 'Owner', email: user.email });
      for (const p of [{ n: 'Priya Singh', r: 'ADMIN' }, { n: 'Aman Kumar', r: 'EVENT_HEAD' }, { n: 'Sneha Das', r: 'MEMBER' }, { n: 'Rohan Verma', r: 'VOLUNTEER' }]) {
        await addDoc(collection(db, 'clubMembers'), { clubId: cid, userId: 'm_' + Date.now(), role: p.r, status: 'ACTIVE', joinedAt: iso, displayName: p.n, email: p.n.toLowerCase().replace(' ', '.') + '@example.com' });
      }
      const eid = (await addDoc(collection(db, 'events'), { clubId: cid, eventName: 'Code Vidhya Hack Day', date: '2026-08-31', venue: 'Senate Hall', status: 'ACTIVE', description: '24-hour hackathon', createdBy: user.uid, createdAt: iso })).id;
      const dlT = new Date().toISOString().split('T')[0]; const dlTm = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      for (const t of [{ t: 'Arrange projector', a: 'Rahul', p: 'HIGH', s: 'IN_PROGRESS', d: dlTm }, { t: 'Prepare certificates', a: 'Priya Singh', p: 'HIGH', s: 'TODO', d: dlT }, { t: 'Contact speakers', a: 'Aman Kumar', p: 'HIGH', s: 'TODO', d: dlTm }, { t: 'Create Instagram post', a: 'Sneha Das', p: 'MEDIUM', s: 'TODO', d: dlTm }, { t: 'Confirm backup venue', a: '', p: 'CRITICAL', s: 'TODO', d: dlT }, { t: 'Setup registration desk', a: 'Rohan Verma', p: 'MEDIUM', s: 'COMPLETED', d: dlT }]) {
        await addDoc(collection(db, 'tasks'), { title: t.t, assignedTo: t.a, priority: t.p, deadline: t.d, status: t.s, clubId: cid, eventId: eid, description: '', createdBy: user.uid, createdAt: iso });
      }
      await addDoc(collection(db, 'risks'), { clubId: cid, title: 'Backup venue not confirmed', description: 'Backup venue not confirmed, event starts tomorrow', severity: 'CRITICAL', status: 'OPEN', eventId: eid, recommendation: 'Confirm alternate venue immediately', createdAt: iso });
      await addDoc(collection(db, 'risks'), { clubId: cid, title: 'Speaker confirmations pending', description: 'Not all speakers confirmed arrival', severity: 'HIGH', status: 'OPEN', eventId: eid, recommendation: 'Contact speakers today', createdAt: iso });
      await addDoc(collection(db, 'meetings'), { clubId: cid, title: 'Hack Day Planning Meeting', date: '2026-08-30', transcript: 'Rahul will arrange the projector before tomorrow. Priya will prepare the participant certificates by tonight. Aman needs to contact all speakers and confirm their arrival. Sneha will publish the Instagram announcement. We still have not confirmed the backup venue.', createdBy: user.uid, createdAt: iso });
      await addDoc(collection(db, 'activityLogs'), { clubId: cid, userId: user.uid, userName: user.email, action: 'SEEDED', description: 'Demo data created for Code Vidhya Club', createdAt: iso });
      ss('Done! Redirecting...'); setTimeout(() => { window.location.href = '/dashboard?clubId=' + cid; }, 2000);
    } catch (e: any) { ss('Error: ' + e.message); }
    sb(false);
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white"><div className="card max-w-md mx-4 p-6 text-center"><p className="text-lg font-semibold mb-4">Please log in first</p><a className="btn btn-primary" href="/login">Go to Login</a></div></div>;
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white"><div className="card max-w-lg mx-4 p-8 text-center"><div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-white font-bold text-2xl">CA</span></div><h1 className="text-2xl font-bold mb-2">ClubOps AI - Demo Seeder</h1><p className="text-gray-500 mb-6">Creates Code Vidhya Club with demo data: 4 members, 6 tasks, 2 risks, 1 event, 1 meeting with transcript, activity logs.</p><button className="btn btn-primary w-full mb-3" onClick={go} disabled={busy}>{busy ? 'Creating...' : 'Create Demo Data'}</button>{status && <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">{status}</div>}<p className="text-xs text-gray-400 mt-4">Requires Firebase Authentication enabled</p></div></div>;
}