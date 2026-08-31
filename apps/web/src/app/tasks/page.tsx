'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
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

interface TaskItem {
  id: string;
  clubId?: string;
  title: string;
  assignedTo?: string;
  assignedToName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  deadline?: string;
  createdAt?: string;
  createdBy?: string;
}

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    title: '',
    assignedTo: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    deadline: '',
  });

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
        loadTasks(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadTasks(clubId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'tasks'),
        where('clubId', '==', clubId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createTask() {
    if (!form.title.trim() || !user || !currentClubId) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        ...form,
        clubId: currentClubId,
        status: 'TODO',
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });
      setShowCreate(false);
      setForm({ title: '', assignedTo: '', priority: 'MEDIUM', deadline: '' });
      loadTasks(currentClubId);
    } catch (e) {
      console.error(e);
    }
  }

  async function updateStatus(taskId: string, newStatus: TaskItem['status']) {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      if (currentClubId) loadTasks(currentClubId);
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
    loadTasks(clubId);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'todo') return t.status === 'TODO';
    if (filter === 'completed') return t.status === 'COMPLETED';
    if (filter === 'in_progress') return t.status === 'IN_PROGRESS';
    if (filter === 'critical') return t.priority === 'CRITICAL';
    if (filter === 'overdue')
      return t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED';
    return true;
  });

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">✅ Tasks</h1>
              <p className="text-sm text-gray-500">Track and manage club action items</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? 'Cancel' : '+ New Task'}
            </button>
          </div>

          {showCreate && (
            <div className="card mb-6 animate-fadeIn">
              <h3 className="font-semibold mb-4 text-base">New Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Task Title
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Confirm speaker travel arrangements"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Assignee
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Rahul Sharma"
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Deadline
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Priority
                  </label>
                  <select
                    className="select"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value as any })
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" onClick={createTask}>
                Create Task
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'todo', 'in_progress', 'completed', 'critical', 'overdue'].map((k) => (
              <button
                key={k}
                className={`btn btn-sm ${filter === k ? 'btn-primary' : 'bg-white border border-gray-200'}`}
                onClick={() => setFilter(k)}
              >
                {k.replace('_', ' ').replace(/^./, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-48" />
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <p className="empty-state-title">No tasks found</p>
              <p className="empty-state-text">Create a task or import from meeting notes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className="card flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`badge ${
                          t.status === 'COMPLETED'
                            ? 'badge-green'
                            : t.status === 'IN_PROGRESS'
                            ? 'badge-blue'
                            : 'badge-gray'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`badge ${
                          t.priority === 'CRITICAL'
                            ? 'badge-red'
                            : t.priority === 'HIGH'
                            ? 'badge-yellow'
                            : t.priority === 'MEDIUM'
                            ? 'badge-blue'
                            : 'badge-gray'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span
                        className={`font-medium text-sm ${
                          t.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-3">
                      <span>👤 {t.assignedToName || t.assignedTo || 'Unassigned'}</span>
                      {t.deadline && (
                        <span>📅 Due {new Date(t.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {t.status !== 'COMPLETED' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => updateStatus(t.id, 'COMPLETED')}
                      >
                        Done
                      </button>
                    )}
                    {t.status === 'TODO' && (
                      <button
                        className="btn btn-sm bg-white border border-gray-200"
                        onClick={() => updateStatus(t.id, 'IN_PROGRESS')}
                      >
                        Start
                      </button>
                    )}
                    {t.status === 'COMPLETED' && (
                      <button
                        className="btn btn-sm bg-white border border-gray-200"
                        onClick={() => updateStatus(t.id, 'TODO')}
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}