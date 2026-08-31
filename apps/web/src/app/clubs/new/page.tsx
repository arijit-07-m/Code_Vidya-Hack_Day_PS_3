'use client';

import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';

const cfg = { apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro", authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com", projectId: "code-vidya-hack-day-ps-3-6b47d" };
const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

export default function CreateClubPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (!u) { window.location.href = '/login'; return; } setUser(u); setChecking(false); });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const clubRef = await addDoc(collection(db, 'clubs'), {
        name, description: description || '', category: category || '',
        ownerId: user.uid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'clubMembers'), {
        clubId: clubRef.id, userId: user.uid, role: 'OWNER', status: 'ACTIVE',
        joinedAt: new Date().toISOString(), email: user.email,
      });
      await addDoc(collection(db, 'activityLogs'), {
        clubId: clubRef.id, userId: user.uid, userName: user.email || 'Unknown',
        action: 'CLUB_CREATED', description: `Club "${name}" was created`,
        createdAt: new Date().toISOString(),
      });
      window.location.href = `/dashboard?clubId=${clubRef.id}`;
    } catch (err: any) {
      setError(err.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="card w-full max-w-lg mx-4">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4"><span className="text-white font-bold text-xl">CA</span></div>
          <h1 className="text-2xl font-bold">Create a New Club</h1>
          <p className="text-sm text-gray-500 mt-1">You will automatically become the <strong>Owner</strong></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Club Name *</label><input className="input" placeholder="e.g., Coding Club" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea className="textarea" placeholder="What is this club about?" value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1">Category</label><input className="input" placeholder="e.g., Technical, Cultural, Sports" value={category} onChange={e => setCategory(e.target.value)} /></div>
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Club'}</button>
          <a href="/dashboard" className="block text-center text-sm text-gray-500 hover:underline">Cancel</a>
        </form>
      </div>
    </div>
  );
}