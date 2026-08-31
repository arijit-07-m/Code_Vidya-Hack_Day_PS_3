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

interface MemberItem {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  status: string;
  displayName?: string;
  email?: string;
  joinedAt?: string;
}

export default function VolunteersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = '/login';
        return;
      }
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authChecked && user) {
      loadClubs();
    }
  }, [authChecked, user]);

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
        const firstClubId = memberClubs[0].id;
        setCurrentClubId(firstClubId);
        loadMembers(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadMembers(clubId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'clubMembers'),
        where('clubId', '==', clubId),
        where('status', '==', 'ACTIVE')
      );
      const snapshot = await getDocs(q);
      setMembers(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
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

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    loadMembers(clubId);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    );
  }

  const currentClub = clubs.find((c) => c.id === currentClubId);
  const volunteers = members.filter((m) => m.role === 'VOLUNTEER' || m.role === 'MEMBER');

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clubs={clubs}
        currentClubId={currentClubId || ''}
        userDisplayName={user?.email?.split('@')[0]}
        onClubChange={handleClubChange}
        onLogout={handleLogout}
        clubName={currentClub?.name}
      />
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">🤝 Volunteers & Team</h1>
              <p className="text-sm text-gray-500">Coordinate and support club volunteers</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-12 w-12 rounded-full mb-2" />
                  <div className="skeleton h-4 w-24" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p className="empty-state-title">No members or volunteers found</p>
              <p className="empty-state-text">Invite team members to your club from Members page</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m) => {
                const initial = (m.displayName || m.email || '?')[0].toUpperCase();
                return (
                  <div key={m.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-base">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {m.displayName || m.email?.split('@')[0] || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{m.email || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span
                        className={`badge ${
                          m.role === 'OWNER'
                            ? 'badge-red'
                            : m.role === 'ADMIN'
                            ? 'badge-blue'
                            : m.role === 'EVENT_HEAD'
                            ? 'badge-yellow'
                            : 'badge-gray'
                        }`}
                      >
                        {m.role || 'Volunteer'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}