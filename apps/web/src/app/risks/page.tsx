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
  doc,
  getDoc,
  updateDoc,
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

interface RiskItem {
  id: string;
  clubId?: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  why?: string;
  recommendation?: string;
  status: 'OPEN' | 'MITIGATED' | 'RESOLVED';
  createdAt?: string;
}

export default function RisksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
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
        loadRisks(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadRisks(clubId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'risks'),
        where('clubId', '==', clubId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setRisks(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function resolveRisk(riskId: string) {
    try {
      await updateDoc(doc(db, 'risks', riskId), {
        status: 'RESOLVED',
        updatedAt: new Date().toISOString(),
      });
      if (currentClubId) loadRisks(currentClubId);
    } catch (e) {
      console.error(e);
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    loadRisks(clubId);
  };

  const getSeverityBadge = (s: string) =>
    s === 'CRITICAL'
      ? 'badge-red'
      : s === 'HIGH'
      ? 'badge-yellow'
      : s === 'MEDIUM'
      ? 'badge-blue'
      : 'badge-gray';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    );
  }

  const currentClub = clubs.find((c) => c.id === currentClubId);
  const openRisks = risks.filter((r) => r.status === 'OPEN' || !r.status);

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
              <h1 className="text-2xl font-bold">⚠️ Risk Center & Operations Guard</h1>
              <p className="text-sm text-gray-500">
                Continuous AI & algorithmic operational risk monitoring
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-48 mb-2" />
                  <div className="skeleton h-4 w-full" />
                </div>
              ))}
            </div>
          ) : risks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛡️</div>
              <p className="empty-state-title">No operational risks detected</p>
              <p className="empty-state-text">
                Your club operations and deadlines look healthy! Risks will appear here automatically when detected.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {risks.map((r) => (
                <div
                  key={r.id}
                  className={`card border-l-4 transition-shadow hover:shadow-md ${
                    r.severity === 'CRITICAL'
                      ? 'border-l-red-500 bg-red-50/10'
                      : r.severity === 'HIGH'
                      ? 'border-l-amber-500 bg-amber-50/10'
                      : 'border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${getSeverityBadge(r.severity)}`}>
                        {r.severity}
                      </span>
                      <h3 className="font-semibold text-base text-gray-900">{r.title}</h3>
                    </div>
                    {r.status !== 'RESOLVED' && (
                      <button
                        className="btn btn-sm bg-white border border-gray-200 hover:bg-green-50 hover:text-green-700"
                        onClick={() => resolveRisk(r.id)}
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{r.description}</p>
                  {r.why && (
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                      <span>📌</span>
                      <span>{r.why}</span>
                    </p>
                  )}
                  {r.recommendation && (
                    <div className="mt-2 p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-start gap-2">
                      <span className="text-sm">💡</span>
                      <p className="text-xs text-indigo-900 font-medium">
                        <strong>Recommendation:</strong> {r.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}