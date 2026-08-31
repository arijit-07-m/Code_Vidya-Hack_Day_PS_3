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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '@/components/Sidebar';

const cfg = {
  apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",
  authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",
  projectId: "code-vidya-hack-day-ps-3-6b47d",
};

const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

interface AnalyticsOverview {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  activeEvents: number;
  memberCount: number;
  openRisks: number;
  completionPercent: number;
  chartData: { name: string; value: number }[];
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
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
        where('userId', '==', user.uid), where('status', '==', 'ACTIVE')
      );
      const snapshot = await getDocs(q);
      const allMembers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const userMembers = allMembers.filter((x) => x.userId === user.uid || (x.email && x.email.toLowerCase() === (user.email || '').toLowerCase()));
      const rawClubs = await Promise.all(
        userMembers.map(async (d) => {
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
        loadAnalytics(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadAnalytics(clubId: string) {
    setLoading(true);
    try {
      const [tsSnap, evSnap, mbSnap, rkSnap] = await Promise.all([
        getDocs(query(collection(db, 'tasks'), where('clubId', '==', clubId))),
        getDocs(query(collection(db, 'events'), where('clubId', '==', clubId))),
        getDocs(
          query(
            collection(db, 'clubMembers'),
            where('clubId', '==', clubId),
            where('userId', '==', user.uid), where('status', '==', 'ACTIVE')
          )
        ),
        getDocs(
          query(
            collection(db, 'risks'),
            where('clubId', '==', clubId),
            where('status', '==', 'OPEN')
          )
        ),
      ]);

      const tasks = tsSnap.docs.map((d) => d.data());
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
      const pending = tasks.filter(
        (t) => t.status === 'TODO' || t.status === 'IN_PROGRESS'
      ).length;
      const blocked = tasks.filter((t) => t.status === 'BLOCKED').length;

      setOverview({
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        activeEvents: evSnap.docs.filter((d) => d.data().status === 'ACTIVE' || d.data().status === 'PLANNING').length,
        memberCount: mbSnap.docs.length,
        openRisks: rkSnap.docs.length,
        completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        chartData: [
          { name: 'Completed', value: completed },
          { name: 'In Progress', value: tasks.filter((t) => t.status === 'IN_PROGRESS').length },
          { name: 'Todo', value: tasks.filter((t) => t.status === 'TODO').length },
          { name: 'Blocked', value: blocked },
        ],
      });
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
    loadAnalytics(clubId);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    );
  }

  const currentClub = clubs.find((c) => c.id === currentClubId);

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold">📊 Club Operations Analytics</h1>
            <p className="text-sm text-gray-500">
              Live efficiency, task velocity, and health metrics
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-4 w-24 mb-2" />
                  <div className="skeleton h-8 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Completion Rate
                  </p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {overview?.completionPercent || 0}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {overview?.completedTasks || 0} of {overview?.totalTasks || 0} tasks done
                  </p>
                </div>

                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Active Events
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {overview?.activeEvents || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">In planning / scheduled</p>
                </div>

                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Total Members
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {overview?.memberCount || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Active team roster</p>
                </div>

                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Open Risks
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {overview?.openRisks || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Operational alerts</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-semibold text-base mb-4">Task Status Breakdown</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overview?.chartData || []}>
                        <XAxis dataKey="name" fontSize={12} stroke="#64748b" />
                        <YAxis fontSize={12} stroke="#64748b" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card flex flex-col justify-between">
                  <h3 className="font-semibold text-base mb-4">Execution Progress</h3>
                  <div className="space-y-4 my-auto">
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span>Overall Progress</span>
                        <span>{overview?.completionPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${overview?.completionPercent || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-700 font-medium">Completed</p>
                        <p className="text-xl font-bold text-green-800">
                          {overview?.completedTasks || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700 font-medium">Remaining</p>
                        <p className="text-xl font-bold text-blue-800">
                          {overview?.pendingTasks || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}