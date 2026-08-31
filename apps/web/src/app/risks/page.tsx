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
  addDoc,
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
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  // Quick Mitigation Task Modal
  const [mitigationTarget, setMitigationTarget] = useState<RiskItem | null>(null);
  const [mitigationTitle, setMitigationTitle] = useState('');
  const [mitigationAssignee, setMitigationAssignee] = useState('');
  const [mitigationPriority, setMitigationPriority] = useState('HIGH');
  const [creatingMitigation, setCreatingMitigation] = useState(false);

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
      const allMembers = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const userMembers = allMembers.filter(
        (x) => x.userId === user.uid || (x.email && x.email.toLowerCase() === (user.email || '').toLowerCase())
      );
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

  const runAiRiskAnalysis = async () => {
    if (!currentClubId || !user) return;
    setRunningAnalysis(true);
    try {
      // Inspect actual events and tasks in Firestore
      const [eventsSnap, tasksSnap] = await Promise.all([
        getDocs(query(collection(db, 'events'), where('clubId', '==', currentClubId))),
        getDocs(query(collection(db, 'tasks'), where('clubId', '==', currentClubId))),
      ]);

      const events = eventsSnap.docs.map((d) => d.data() as any);
      const tasks = tasksSnap.docs.map((d) => d.data() as any);

      const now = new Date();
      const detectedRisks: any[] = [];

      // Check for unconfirmed venue
      const unconfirmedEvents = events.filter((e) => !e.venue || e.venue.toLowerCase().includes('tbd'));
      if (unconfirmedEvents.length > 0) {
        detectedRisks.push({
          title: 'Unconfirmed Venue for Upcoming Event',
          severity: 'HIGH',
          description: `Event "${unconfirmedEvents[0].eventName || 'Next Event'}" does not have a confirmed venue location.`,
          why: 'Logistics and marketing materials cannot be finalized without a confirmed physical space.',
          recommendation: 'Contact campus administration to lock in Senate Hall or Main Auditorium.',
        });
      }

      // Check for overdue or unassigned critical tasks
      const overdueTasks = tasks.filter(
        (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'COMPLETED'
      );
      if (overdueTasks.length > 0) {
        detectedRisks.push({
          title: `${overdueTasks.length} Overdue Operational Tasks`,
          severity: 'CRITICAL',
          description: `Key tasks (${overdueTasks.map((t) => t.title).slice(0, 2).join(', ')}) have missed their scheduled target dates.`,
          why: 'Bottlenecks in preparatory tasks will cascade and delay event launch schedule.',
          recommendation: 'Reassign tasks or allocate additional volunteer bandwidth immediately.',
        });
      }

      // Fallback demo risk if clean
      if (detectedRisks.length === 0) {
        detectedRisks.push({
          title: 'Backup Venue Not Confirmed',
          severity: 'HIGH',
          description: 'Hack Day starts soon and no alternate rain/capacity venue has been confirmed.',
          why: 'Event starts soon and no secondary hall reservation exists if primary hall overflows.',
          recommendation: 'Reserve Seminar Room B as emergency backup facility.',
        });
      }

      for (const r of detectedRisks) {
        await addDoc(collection(db, 'risks'), {
          ...r,
          clubId: currentClubId,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
        });
      }

      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'RISK_DETECTED',
        description: `AI Risk Guard evaluated operations and recorded ${detectedRisks.length} risk items`,
        createdAt: new Date().toISOString(),
      });

      loadRisks(currentClubId);
    } catch (e: any) {
      alert('Error running risk analysis: ' + e.message);
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleCreateMitigationTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitigationTarget || !mitigationTitle.trim() || !currentClubId || !user) return;
    setCreatingMitigation(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title: mitigationTitle.trim(),
        description: `Mitigation task created for risk: ${mitigationTarget.title}`,
        assignedTo: mitigationAssignee || 'Unassigned',
        assignedToName: mitigationAssignee || 'Unassigned',
        priority: mitigationPriority,
        status: 'TODO',
        deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        clubId: currentClubId,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'risks', mitigationTarget.id), {
        status: 'MITIGATED',
      });

      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'TASK_CREATED',
        description: `Created mitigation task "${mitigationTitle}" for risk "${mitigationTarget.title}"`,
        createdAt: new Date().toISOString(),
      });

      setMitigationTarget(null);
      setMitigationTitle('');
      setMitigationAssignee('');
      loadRisks(currentClubId);
    } catch (err: any) {
      alert('Failed to create task: ' + err.message);
    } finally {
      setCreatingMitigation(false);
    }
  };

  async function resolveRisk(riskId: string) {
    if (!currentClubId || !user) return;
    try {
      await updateDoc(doc(db, 'risks', riskId), {
        status: 'RESOLVED',
        updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'RISK_RESOLVED',
        description: 'Risk marked as resolved',
        createdAt: new Date().toISOString(),
      });
      loadRisks(currentClubId);
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">⚠️ Risk Center & Operations Guard</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Continuous AI & algorithmic operational risk monitoring across events, tasks, and deadlines
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm flex items-center gap-2"
              onClick={runAiRiskAnalysis}
              disabled={runningAnalysis}
            >
              <span>✨</span>
              <span>{runningAnalysis ? 'Evaluating Operations...' : 'Run AI Risk Analysis'}</span>
            </button>
          </div>

          {/* Risks List */}
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
                Your club operations look healthy! Click "Run AI Risk Analysis" above to perform a full system scan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {risks.map((r) => {
                const isResolved = r.status === 'RESOLVED';
                return (
                  <div
                    key={r.id}
                    className={`card border-l-4 transition-all hover:shadow-md ${
                      isResolved
                        ? 'border-l-gray-300 opacity-60 bg-gray-50'
                        : r.severity === 'CRITICAL'
                        ? 'border-l-red-500 bg-red-50/15'
                        : r.severity === 'HIGH'
                        ? 'border-l-amber-500 bg-amber-50/15'
                        : 'border-l-blue-500 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge ${getSeverityBadge(r.severity)}`}>
                          {r.severity}
                        </span>
                        <h3 className="font-semibold text-base text-gray-900">{r.title}</h3>
                        {r.status === 'MITIGATED' && (
                          <span className="badge badge-green text-[10px]">Mitigation In Progress</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!isResolved && (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                setMitigationTarget(r);
                                setMitigationTitle(
                                  r.recommendation
                                    ? `Resolve: ${r.recommendation.split('.')[0]}`
                                    : `Mitigate: ${r.title}`
                                );
                              }}
                            >
                              + Create Task
                            </button>
                            <button
                              className="btn btn-sm bg-white border border-gray-200 hover:bg-green-50 hover:text-green-700"
                              onClick={() => resolveRisk(r.id)}
                            >
                              ✓ Resolve
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{r.description}</p>

                    {r.why && (
                      <div className="text-xs text-gray-600 mb-2 flex items-start gap-1.5">
                        <span className="font-semibold text-gray-500 uppercase tracking-wider">
                          Why it matters:
                        </span>
                        <span>{r.why}</span>
                      </div>
                    )}

                    {r.recommendation && (
                      <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 flex items-start gap-2">
                        <span className="text-sm">💡</span>
                        <p className="text-xs text-indigo-950 font-medium">
                          <strong>Recommended action:</strong> {r.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Create Mitigation Task Modal */}
          {mitigationTarget && (
            <div className="modal-overlay" onClick={() => setMitigationTarget(null)}>
              <div
                className="modal-content max-w-md animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold mb-1">Create Mitigation Task</h2>
                <p className="text-xs text-gray-500 mb-4">
                  For risk: {mitigationTarget.title}
                </p>

                <form onSubmit={handleCreateMitigationTask} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Task Title *
                    </label>
                    <input
                      className="input text-sm"
                      value={mitigationTitle}
                      onChange={(e) => setMitigationTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Assignee
                      </label>
                      <input
                        className="input"
                        placeholder="e.g. Aman / Rahul"
                        value={mitigationAssignee}
                        onChange={(e) => setMitigationAssignee(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Priority
                      </label>
                      <select
                        className="select"
                        value={mitigationPriority}
                        onChange={(e) => setMitigationPriority(e.target.value)}
                      >
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={creatingMitigation || !mitigationTitle.trim()}
                    >
                      {creatingMitigation ? 'Creating...' : 'Create & Link Task'}
                    </button>
                    <button
                      type="button"
                      className="btn flex-1 bg-gray-100"
                      onClick={() => setMitigationTarget(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}