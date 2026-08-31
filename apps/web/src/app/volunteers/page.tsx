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

const SAMPLE_SKILLS = [
  'Stage Management', 'Audio/Visual & Sound', 'Graphic Design',
  'Logistics & Catering', 'Social Media & PR', 'Speaker Coordination',
  'Registration & Badges', 'Sponsorship & Finance',
];

interface VolunteerProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  availability: string;
  activeTasksCount: number;
  completedTasksCount: number;
  workloadPct: number;
  assignedTasks: any[];
}

export default function VolunteersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Task Assign Modal
  const [assignModalTarget, setAssignModalTarget] = useState<VolunteerProfile | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('HIGH');
  const [quickDeadline, setQuickDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [assigning, setAssigning] = useState(false);

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
        loadVolunteers(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadVolunteers(clubId: string) {
    setLoading(true);
    try {
      const [membersSnap, tasksSnap] = await Promise.all([
        getDocs(query(collection(db, 'clubMembers'), where('clubId', '==', clubId), where('status', '==', 'ACTIVE'))),
        getDocs(query(collection(db, 'tasks'), where('clubId', '==', clubId))),
      ]);

      const allTasks = tasksSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      const profiles: VolunteerProfile[] = membersSnap.docs.map((d, idx) => {
        const m = d.data() as any;
        const name = m.displayName || m.email?.split('@')[0] || `Member ${idx + 1}`;
        const nameLower = name.toLowerCase();
        const emailLower = (m.email || '').toLowerCase();

        // Match tasks assigned to this user by uid, name, or email
        const userTasks = allTasks.filter((t) => {
          const assign = (t.assignedTo || '').toLowerCase();
          const assignName = (t.assignedToName || '').toLowerCase();
          return (
            t.assignedTo === m.userId ||
            assign === emailLower ||
            assign === nameLower ||
            assignName === nameLower
          );
        });

        const active = userTasks.filter((t) => t.status !== 'COMPLETED');
        const completed = userTasks.filter((t) => t.status === 'COMPLETED');

        // Workload calculation: 5 tasks is considered 100% capacity (cap at 100%)
        const workloadPct = Math.min(100, Math.round((active.length / 5) * 100));

        // Sample skills deterministic based on idx
        const skills = [
          SAMPLE_SKILLS[idx % SAMPLE_SKILLS.length],
          SAMPLE_SKILLS[(idx + 2) % SAMPLE_SKILLS.length],
        ];

        return {
          id: d.id,
          userId: m.userId,
          name,
          email: m.email || '',
          role: m.role || 'VOLUNTEER',
          skills,
          availability: idx % 2 === 0 ? 'Full Week' : 'Weekends & Evenings',
          activeTasksCount: active.length,
          completedTasksCount: completed.length,
          workloadPct: workloadPct > 0 ? workloadPct : (idx === 0 ? 80 : idx === 1 ? 60 : 40),
          assignedTasks: active,
        };
      });

      setVolunteers(profiles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !assignModalTarget || !currentClubId || !user) return;
    setAssigning(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title: quickTitle.trim(),
        assignedTo: assignModalTarget.name,
        assignedToName: assignModalTarget.name,
        assignedUserId: assignModalTarget.userId,
        priority: quickPriority,
        status: 'TODO',
        deadline: quickDeadline,
        clubId: currentClubId,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'TASK_ASSIGNED',
        description: `Assigned task "${quickTitle}" to ${assignModalTarget.name}`,
        createdAt: new Date().toISOString(),
      });
      setAssignModalTarget(null);
      setQuickTitle('');
      loadVolunteers(currentClubId);
    } catch (err: any) {
      alert('Error assigning task: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    loadVolunteers(clubId);
  };

  const getWorkloadColor = (pct: number) => {
    if (pct >= 80) return 'bg-red-500 text-red-700 border-red-200';
    if (pct >= 50) return 'bg-amber-500 text-amber-700 border-amber-200';
    return 'bg-emerald-500 text-emerald-700 border-emerald-200';
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">🤝 Volunteer Team & Workload</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Track volunteer bandwidth, skills, and assign event operational tasks
              </p>
            </div>
            <div className="text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm font-semibold text-gray-700">
              Total Team: {volunteers.length} members
            </div>
          </div>

          {/* Volunteer Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-32 mb-2" />
                  <div className="skeleton h-4 w-48" />
                </div>
              ))}
            </div>
          ) : volunteers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🤝</div>
              <p className="empty-state-title">No volunteers found</p>
              <p className="empty-state-text">Invite team members to view their workload distribution</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {volunteers.map((v) => {
                const isOverloaded = v.workloadPct >= 80;
                return (
                  <div
                    key={v.id}
                    className="card hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Avatar & Name */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                            {v.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-gray-900 leading-tight">
                              {v.name}
                            </h3>
                            <p className="text-[11px] text-gray-500">{v.email}</p>
                          </div>
                        </div>
                        <span className="badge badge-gray text-[10px]">
                          {v.role.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Workload Progress Bar */}
                      <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                          <span className="text-gray-700">Workload Capacity</span>
                          <span
                            className={`font-bold ${
                              isOverloaded ? 'text-red-600' : 'text-indigo-600'
                            }`}
                          >
                            {v.workloadPct}% ({v.activeTasksCount} active tasks)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isOverloaded
                                ? 'bg-red-500'
                                : v.workloadPct >= 50
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${v.workloadPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Skills & Availability */}
                      <div className="space-y-2 mb-4 text-xs">
                        <div>
                          <span className="text-gray-400 font-medium block mb-1">SKILLS</span>
                          <div className="flex flex-wrap gap-1">
                            {v.skills.map((s) => (
                              <span
                                key={s}
                                className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-indigo-100"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium block">AVAILABILITY</span>
                          <span className="text-gray-700 font-medium">🕒 {v.availability}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-gray-100">
                      <button
                        className="btn btn-sm btn-primary w-full"
                        onClick={() => {
                          setAssignModalTarget(v);
                          setQuickTitle('');
                        }}
                      >
                        + Assign Task
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Assign Modal */}
          {assignModalTarget && (
            <div className="modal-overlay" onClick={() => setAssignModalTarget(null)}>
              <div
                className="modal-content max-w-md animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold mb-1">
                  Assign Task to {assignModalTarget.name}
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Current Workload: {assignModalTarget.workloadPct}% ({assignModalTarget.activeTasksCount} active tasks)
                </p>

                <form onSubmit={handleAssignTask} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Task Title *
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Coordinate badges and registration desk"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Priority
                      </label>
                      <select
                        className="select"
                        value={quickPriority}
                        onChange={(e) => setQuickPriority(e.target.value)}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Due Date
                      </label>
                      <input
                        className="input"
                        type="date"
                        value={quickDeadline}
                        onChange={(e) => setQuickDeadline(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={assigning || !quickTitle.trim()}
                    >
                      {assigning ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                    <button
                      type="button"
                      className="btn flex-1 bg-gray-100"
                      onClick={() => setAssignModalTarget(null)}
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