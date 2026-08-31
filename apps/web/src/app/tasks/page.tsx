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
  deleteDoc,
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
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  deadline?: string;
  eventId?: string;
  eventName?: string;
  createdAt?: string;
  createdBy?: string;
}

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [filter, setFilter] = useState<'all' | 'my_tasks' | 'overdue' | 'high_priority' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Editing
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'MEDIUM' as TaskItem['priority'],
    status: 'TODO' as TaskItem['status'],
    deadline: new Date().toISOString().split('T')[0],
    eventId: '',
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
        loadEvents(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadEvents(clubId: string) {
    try {
      const q = query(collection(db, 'events'), where('clubId', '==', clubId));
      const sn = await getDocs(q);
      setEvents(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
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

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !user || !currentClubId) return;

    try {
      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), {
          ...form,
          assignedToName: form.assignedTo,
          updatedAt: new Date().toISOString(),
        });
        await addDoc(collection(db, 'activityLogs'), {
          clubId: currentClubId,
          userId: user.uid,
          userName: user.email,
          action: 'TASK_UPDATED',
          description: `Task "${form.title}" updated`,
          createdAt: new Date().toISOString(),
        });
        setEditingTask(null);
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...form,
          assignedToName: form.assignedTo,
          clubId: currentClubId,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await addDoc(collection(db, 'activityLogs'), {
          clubId: currentClubId,
          userId: user.uid,
          userName: user.email,
          action: 'TASK_CREATED',
          description: `Task "${form.title}" created`,
          createdAt: new Date().toISOString(),
        });
      }

      setShowModal(false);
      setForm({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'MEDIUM',
        status: 'TODO',
        deadline: new Date().toISOString().split('T')[0],
        eventId: '',
      });
      loadTasks(currentClubId);
    } catch (err: any) {
      alert('Error saving task: ' + err.message);
    }
  };

  const updateStatus = async (taskId: string, newStatus: TaskItem['status'], taskTitle: string) => {
    if (!currentClubId || !user) return;
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      if (newStatus === 'COMPLETED') {
        await addDoc(collection(db, 'activityLogs'), {
          clubId: currentClubId,
          userId: user.uid,
          userName: user.email,
          action: 'TASK_COMPLETED',
          description: `Task "${taskTitle}" marked as completed`,
          createdAt: new Date().toISOString(),
        });
      }
      loadTasks(currentClubId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Delete task "${title}"?`)) return;
    if (!currentClubId || !user) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'TASK_DELETED',
        description: `Task "${title}" deleted`,
        createdAt: new Date().toISOString(),
      });
      loadTasks(currentClubId);
    } catch (e: any) {
      alert('Failed to delete task: ' + e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    loadTasks(clubId);
    loadEvents(clubId);
  };

  const now = new Date();
  const userEmailName = user?.email?.split('@')[0].toLowerCase() || '';

  const filteredTasks = tasks.filter((t) => {
    // Search
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Filters
    if (filter === 'my_tasks') {
      const assign = (t.assignedTo || '').toLowerCase();
      const assignName = (t.assignedToName || '').toLowerCase();
      return (
        t.assignedTo === user?.uid ||
        assign === user?.email?.toLowerCase() ||
        assign === userEmailName ||
        assignName === userEmailName
      );
    }
    if (filter === 'overdue') {
      return t.deadline && new Date(t.deadline) < now && t.status !== 'COMPLETED';
    }
    if (filter === 'high_priority') {
      return t.priority === 'HIGH' || t.priority === 'CRITICAL';
    }
    if (filter === 'completed') {
      return t.status === 'COMPLETED';
    }
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">✓ Task Management</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Centralized action items, assignments, deadlines, and execution progress
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={() => {
                setEditingTask(null);
                setForm({
                  title: '',
                  description: '',
                  assignedTo: '',
                  priority: 'MEDIUM',
                  status: 'TODO',
                  deadline: new Date().toISOString().split('T')[0],
                  eventId: '',
                });
                setShowModal(true);
              }}
            >
              <span>+</span>
              <span>Create Task</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex gap-3 items-center mb-6 flex-wrap">
            <input
              className="input flex-1 min-w-[240px]"
              placeholder="Search tasks by title, owner, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: 'all', label: 'All' },
                { key: 'my_tasks', label: 'My Tasks' },
                { key: 'overdue', label: 'Overdue' },
                { key: 'high_priority', label: 'High Priority' },
                { key: 'completed', label: 'Completed' },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`btn btn-sm ${
                    filter === item.key ? 'btn-primary' : 'bg-white border border-gray-200'
                  }`}
                  onClick={() => setFilter(item.key as any)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Task List */}
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
              <div className="empty-state-icon">✓</div>
              <p className="empty-state-title">No tasks found</p>
              <p className="empty-state-text">
                {filter === 'my_tasks'
                  ? 'No tasks currently assigned to you.'
                  : 'Create your first task or import action items from meeting transcripts.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => {
                const linkedEvent = events.find((e) => e.id === t.eventId);
                const isCompleted = t.status === 'COMPLETED';

                return (
                  <div
                    key={t.id}
                    className={`card flex items-center justify-between hover:shadow-md transition-all ${
                      isCompleted ? 'bg-gray-50/70 border-gray-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`badge ${
                            isCompleted
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
                        {linkedEvent && (
                          <span className="badge badge-gray text-[11px]">
                            📅 {linkedEvent.eventName}
                          </span>
                        )}
                        <span
                          className={`font-semibold text-sm ${
                            isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mb-1">{t.description}</p>
                      )}
                      <div className="text-xs text-gray-500 flex items-center gap-4 flex-wrap">
                        <span>👤 {t.assignedToName || t.assignedTo || 'Unassigned'}</span>
                        {t.deadline && (
                          <span>📅 Due {new Date(t.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {t.status !== 'COMPLETED' ? (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => updateStatus(t.id, 'COMPLETED', t.title)}
                        >
                          ✓ Done
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm bg-white border border-gray-200"
                          onClick={() => updateStatus(t.id, 'TODO', t.title)}
                        >
                          Reopen
                        </button>
                      )}
                      {t.status === 'TODO' && (
                        <button
                          className="btn btn-sm bg-white border border-gray-200"
                          onClick={() => updateStatus(t.id, 'IN_PROGRESS', t.title)}
                        >
                          Start
                        </button>
                      )}
                      <button
                        className="btn btn-sm bg-white border border-gray-200"
                        onClick={() => {
                          setEditingTask(t);
                          setForm({
                            title: t.title,
                            description: t.description || '',
                            assignedTo: t.assignedTo || '',
                            priority: t.priority,
                            status: t.status,
                            deadline: t.deadline || new Date().toISOString().split('T')[0],
                            eventId: t.eventId || '',
                          });
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        title="Delete Task"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create / Edit Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div
                className="modal-content max-w-lg animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold mb-4">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h2>
                <form onSubmit={handleSaveTask} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Task Title *
                    </label>
                    <input
                      className="input text-sm"
                      placeholder="e.g. Confirm backup projector with IT dept"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Link to Event (Optional)
                    </label>
                    <select
                      className="select"
                      value={form.eventId}
                      onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                    >
                      <option value="">No linked event (General Task)</option>
                      {events.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                          {evt.eventName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Assignee / Owner
                      </label>
                      <input
                        className="input"
                        placeholder="e.g. Rahul / Priya / Aman"
                        value={form.assignedTo}
                        onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Due Date
                      </label>
                      <input
                        className="input"
                        type="date"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
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
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Status
                      </label>
                      <select
                        className="select"
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value as any })
                        }
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Description & Notes
                    </label>
                    <textarea
                      className="textarea"
                      placeholder="Context, contact info, subtasks..."
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="btn btn-primary flex-1">
                      {editingTask ? 'Save Task' : 'Create Task'}
                    </button>
                    <button
                      type="button"
                      className="btn flex-1 bg-gray-100"
                      onClick={() => setShowModal(false)}
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