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
import { useSearchParams } from 'next/navigation';

const cfg = {
  apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",
  authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",
  projectId: "code-vidya-hack-day-ps-3-6b47d",
};

const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

interface ClubEvent {
  id: string;
  eventName: string;
  description: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  date?: string; // backwards compatibility
  venue: string;
  eventOwner?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export default function EventsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const searchParams = useSearchParams();
  const urlClubId = searchParams.get('clubId');

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [selectedEventWorkspace, setSelectedEventWorkspace] = useState<ClubEvent | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'tasks' | 'volunteers' | 'meetings' | 'risks' | 'activity'>('overview');

  // Related Event Data for Workspace
  const [eventTasks, setEventTasks] = useState<any[]>([]);
  const [eventMeetings, setEventMeetings] = useState<any[]>([]);
  const [eventRisks, setEventRisks] = useState<any[]>([]);
  const [eventActivities, setEventActivities] = useState<any[]>([]);
  const [clubMembers, setClubMembers] = useState<any[]>([]);

  // Form State
  const [form, setForm] = useState({
    eventName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '09:00',

    endTime: '18:00',
    venue: '',
    eventOwner: '',
    status: 'PLANNING' as ClubEvent['status'],
  });

  // Quick Task in Workspace
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskAssignee, setQuickTaskAssignee] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState('HIGH');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = '/login';
        return;
      }
      setUser(u);
      setAuthChecked(true);
// Use URL clubId if provided
  useEffect(() => {
    if (urlClubId && clubs.length > 0) {
      const found = clubs.find((c: any) => c.id === urlClubId);
      if (found) {
        setCurrentClubId(urlClubId);
        loadEvents(urlClubId);
        loadClubMembers(urlClubId);
      }
    }
  }, [urlClubId, clubs]);

  // Load clubs on auth
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authChecked && user) {
      loadClubs();
    }
  }, [authChecked, user]);
  // Use URL clubId if provided
  useEffect(() => {
    if (urlClubId && clubs.length > 0) {
      const found = clubs.find(c => c.id === urlClubId);
      if (found) {
        setCurrentClubId(urlClubId);
        loadEvents(urlClubId);
        loadClubMembers(urlClubId);
      }
    }
  }, [urlClubId, clubs]);

  async function loadClubs() {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'clubMembers'),
        where('status', '==', 'ACTIVE')
      );
      const snapshot = await getDocs(q);
      const allMembers = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const userMembers = allMembers.filter(
        (x) => x.userId === user.uid || (x.email && x.email.toLowerCase() === (user.email || '').toLowerCase())
      );
      const rawClubs = await Promise.all(
        userMembers.map(async (d) => {
          const m = d;
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
        loadEvents(firstClubId);
        loadClubMembers(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadClubMembers(clubId: string) {
    try {
      const q = query(collection(db, 'clubMembers'), where('clubId', '==', clubId), where('status', '==', 'ACTIVE'));
      const sn = await getDocs(q);
      setClubMembers(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  }

  async function loadEvents(clubId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'events'),
        where('clubId', '==', clubId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkspaceData(eventId: string, clubId: string) {
    try {
      const [tsSnap, mtSnap, rkSnap, actSnap] = await Promise.all([
        getDocs(query(collection(db, 'tasks'), where('clubId', '==', clubId), where('eventId', '==', eventId))),
        getDocs(query(collection(db, 'meetings'), where('clubId', '==', clubId))),
        getDocs(query(collection(db, 'risks'), where('clubId', '==', clubId))),
        getDocs(query(collection(db, 'activityLogs'), where('clubId', '==', clubId), orderBy('createdAt', 'desc'))),
      ]);

      setEventTasks(tsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEventMeetings(mtSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((m: any) => m.eventId === eventId || !m.eventId));
      setEventRisks(rkSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r: any) => r.eventId === eventId || !r.eventId));
      setEventActivities(actSnap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 8));
    } catch (e) {
      console.error(e);
    }
  }

  const openWorkspace = (event: ClubEvent) => {
    setSelectedEventWorkspace(event);
    setWorkspaceTab('overview');
    if (currentClubId) {
      loadWorkspaceData(event.id, currentClubId);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eventName.trim() || !user || !currentClubId) return;

    try {
      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), {
          ...form,
          updatedAt: new Date().toISOString(),
        });
        await addDoc(collection(db, 'activityLogs'), {
          clubId: currentClubId,
          userId: user.uid,
          userName: user.email,
          action: 'EVENT_UPDATED',
          description: `Event "${form.eventName}" updated`,
          createdAt: new Date().toISOString(),
        });
        setEditingEvent(null);
      } else {
        await addDoc(collection(db, 'events'), {
          ...form,
          clubId: currentClubId,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await addDoc(collection(db, 'activityLogs'), {
          clubId: currentClubId,
          userId: user.uid,
          userName: user.email,
          action: 'EVENT_CREATED',
          description: `Event "${form.eventName}" created`,
          createdAt: new Date().toISOString(),
        });
      }

      setShowCreateModal(false);
      setForm({
        eventName: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '18:00',
        venue: '',
        eventOwner: '',
        status: 'PLANNING',
      });
      loadEvents(currentClubId);
    } catch (err: any) {
      alert('Error saving event: ' + err.message);
    }
  };

  const handleDeleteEvent = async (eventId: string, eName: string) => {
    if (!confirm(`Are you sure you want to delete "${eName}"?`)) return;
    if (!currentClubId || !user) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'EVENT_DELETED',
        description: `Event "${eName}" deleted`,
        createdAt: new Date().toISOString(),
      });
      if (selectedEventWorkspace?.id === eventId) {
        setSelectedEventWorkspace(null);
      }
      loadEvents(currentClubId);
    } catch (err: any) {
      alert('Error deleting event: ' + err.message);
    }
  };

  const addQuickTaskToEvent = async () => {
    if (!quickTaskTitle.trim() || !selectedEventWorkspace || !currentClubId || !user) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: quickTaskTitle.trim(),
        assignedTo: quickTaskAssignee || 'Unassigned',
        assignedToName: quickTaskAssignee || 'Unassigned',
        priority: quickTaskPriority,
        status: 'TODO',
        eventId: selectedEventWorkspace.id,
        clubId: currentClubId,
        deadline: selectedEventWorkspace.startDate || new Date().toISOString().split('T')[0],
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });
      setQuickTaskTitle('');
      setQuickTaskAssignee('');
      loadWorkspaceData(selectedEventWorkspace.id, currentClubId);
    } catch (e: any) {
      alert('Failed to add task: ' + e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    setSelectedEventWorkspace(null);
    loadEvents(clubId);
    loadClubMembers(clubId);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (s: string) =>
    s === 'ACTIVE'
      ? 'badge-green'
      : s === 'PLANNING'
      ? 'badge-blue'
      : s === 'COMPLETED'
      ? 'badge-gray'
      : 'badge-red';

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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">📅 Events & Workspaces</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage club events, assign logistical work, and track milestones
              </p>
            </div>
            <div className="flex gap-2">
              {selectedEventWorkspace && (
                <button
                  className="btn btn-sm bg-white border border-gray-200"
                  onClick={() => setSelectedEventWorkspace(null)}
                >
                  ← Back to All Events
                </button>
              )}
              <button
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                onClick={() => {
                  setEditingEvent(null);
                  setForm({
                    eventName: '',
                    description: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '18:00',
                    venue: '',
                    eventOwner: user.email?.split('@')[0] || '',
                    status: 'PLANNING',
                  });
                  setShowCreateModal(true);
                }}
              >
                <span>+</span>
                <span>Create Event</span>
              </button>
            </div>
          </div>

          {/* If Event Workspace is open */}
          {selectedEventWorkspace ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Event Overview Hero Banner */}
              <div className="card border-l-4 border-l-indigo-600 bg-white p-6">
                <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedEventWorkspace.eventName}
                      </h2>
                      <span className={`badge ${getStatusBadge(selectedEventWorkspace.status)}`}>
                        {selectedEventWorkspace.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 max-w-2xl">
                      {selectedEventWorkspace.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm bg-white border border-gray-200"
                      onClick={() => {
                        setEditingEvent(selectedEventWorkspace);
                        setForm({
                          eventName: selectedEventWorkspace.eventName,
                          description: selectedEventWorkspace.description || '',
                          startDate: selectedEventWorkspace.startDate || selectedEventWorkspace.date || '',
                          endDate: selectedEventWorkspace.endDate || '',
                          startTime: selectedEventWorkspace.startTime || '09:00',
                          endTime: selectedEventWorkspace.endTime || '18:00',
                          venue: selectedEventWorkspace.venue || '',
                          eventOwner: selectedEventWorkspace.eventOwner || '',
                          status: selectedEventWorkspace.status,
                        });
                        setShowCreateModal(true);
                      }}
                    >
                      Edit Event
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        handleDeleteEvent(selectedEventWorkspace.id, selectedEventWorkspace.eventName)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block">Dates</span>
                    <span className="font-semibold text-gray-800">
                      📅 {selectedEventWorkspace.startDate || selectedEventWorkspace.date || 'TBD'}
                      {selectedEventWorkspace.endDate ? ` – ${selectedEventWorkspace.endDate}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Time & Venue</span>
                    <span className="font-semibold text-gray-800">
                      📍 {selectedEventWorkspace.venue || 'TBD'} ({selectedEventWorkspace.startTime || '09:00'})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Event Owner</span>
                    <span className="font-semibold text-gray-800">
                      👑 {selectedEventWorkspace.eventOwner || 'Lead Organizer'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Progress</span>
                    <span className="font-semibold text-indigo-600">
                      {eventTasks.length > 0
                        ? `${Math.round(
                            (eventTasks.filter((t) => t.status === 'COMPLETED').length /
                              eventTasks.length) *
                              100
                          )}% Tasks Done`
                        : '0 tasks created'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="tabs">
                {(['overview', 'tasks', 'volunteers', 'meetings', 'risks', 'activity'] as const).map(
                  (t) => (
                    <button
                      key={t}
                      className={`tab ${workspaceTab === t ? 'active' : ''}`}
                      onClick={() => setWorkspaceTab(t)}
                    >
                      {t.toUpperCase()} {t === 'tasks' && `(${eventTasks.length})`}
                    </button>
                  )
                )}
              </div>

              {/* Tab Contents */}
              {workspaceTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card md:col-span-2">
                    <h3 className="font-semibold text-base mb-4">Event Milestones & Progress</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                          <span>Task Execution</span>
                          <span>
                            {eventTasks.filter((t) => t.status === 'COMPLETED').length} of{' '}
                            {eventTasks.length} Completed
                          </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all duration-500"
                            style={{
                              width: `${
                                eventTasks.length > 0
                                  ? Math.round(
                                      (eventTasks.filter((t) => t.status === 'COMPLETED').length /
                                        eventTasks.length) *
                                        100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                          Quick Add Task for this Event
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          <input
                            className="input flex-1 min-w-[200px]"
                            placeholder="Task title (e.g. Test audio system)"
                            value={quickTaskTitle}
                            onChange={(e) => setQuickTaskTitle(e.target.value)}
                          />
                          <input
                            className="input w-36"
                            placeholder="Assignee name"
                            value={quickTaskAssignee}
                            onChange={(e) => setQuickTaskAssignee(e.target.value)}
                          />
                          <select
                            className="select w-28"
                            value={quickTaskPriority}
                            onChange={(e) => setQuickTaskPriority(e.target.value)}
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={addQuickTaskToEvent}
                            disabled={!quickTaskTitle.trim()}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-semibold text-base mb-3">Event Health Summary</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Tasks</span>
                        <span className="font-bold text-gray-900">{eventTasks.length}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Risks Flagged</span>
                        <span className="font-bold text-red-600">{eventRisks.length}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Linked Meetings</span>
                        <span className="font-bold text-gray-900">{eventMeetings.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {workspaceTab === 'tasks' && (
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-base">Event Action Items ({eventTasks.length})</h3>
                  </div>
                  {eventTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No tasks assigned to this event yet. Use the quick add form on the Overview tab.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {eventTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`badge ${
                                t.status === 'COMPLETED' ? 'badge-green' : 'badge-blue'
                              }`}
                            >
                              {t.status}
                            </span>
                            <div>
                              <p
                                className={`text-sm font-semibold ${
                                  t.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'
                                }`}
                              >
                                {t.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                👤 {t.assignedToName || t.assignedTo || 'Unassigned'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`badge ${
                              t.priority === 'CRITICAL'
                                ? 'badge-red'
                                : t.priority === 'HIGH'
                                ? 'badge-yellow'
                                : 'badge-gray'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {workspaceTab === 'volunteers' && (
                <div className="card">
                  <h3 className="font-semibold text-base mb-4">Assigned Event Volunteers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clubMembers.slice(0, 6).map((m) => (
                      <div key={m.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {(m.displayName || m.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {m.displayName || m.email?.split('@')[0]}
                          </p>
                          <span className="badge badge-gray text-[10px] mt-0.5">{m.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workspaceTab === 'meetings' && (
                <div className="card">
                  <h3 className="font-semibold text-base mb-4">Event Briefing & Planning Meetings</h3>
                  {eventMeetings.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No meetings linked to this event.</p>
                  ) : (
                    <div className="space-y-3">
                      {eventMeetings.map((m) => (
                        <div key={m.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold text-sm text-gray-900">{m.title}</h4>
                            <span className="text-xs text-gray-400">{m.date}</span>
                          </div>
                          {m.transcript && (
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">{m.transcript}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {workspaceTab === 'risks' && (
                <div className="card">
                  <h3 className="font-semibold text-base mb-4">Event Risk Registry</h3>
                  {eventRisks.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">✓ No unresolved risks for this event.</p>
                  ) : (
                    <div className="space-y-3">
                      {eventRisks.map((r) => (
                        <div key={r.id} className="p-3 bg-red-50/50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-red">{r.severity || 'HIGH'}</span>
                            <h4 className="text-sm font-semibold text-red-900">{r.title}</h4>
                          </div>
                          <p className="text-xs text-red-700">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {workspaceTab === 'activity' && (
                <div className="card">
                  <h3 className="font-semibold text-base mb-4">Event Activity Log</h3>
                  <div className="space-y-2">
                    {eventActivities.map((a) => (
                      <div key={a.id} className="p-2 border-b border-gray-100 text-xs flex justify-between">
                        <span className="font-medium text-gray-800">{a.description}</span>
                        <span className="text-gray-400">{new Date(a.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Events Grid / List View */
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex gap-3 items-center flex-wrap">
                <input
                  className="input flex-1 min-w-[240px]"
                  placeholder="Search events by title, venue, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex gap-1.5 flex-wrap">
                  {['ALL', 'PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      className={`btn btn-sm ${
                        statusFilter === st ? 'btn-primary' : 'bg-white border border-gray-200'
                      }`}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card">
                      <div className="skeleton h-6 w-48 mb-2" />
                      <div className="skeleton h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <p className="empty-state-title">No events found</p>
                  <p className="empty-state-text">
                    Create a new event or adjust your search filter
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvents.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => openWorkspace(e)}
                      className="card hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-base text-gray-900 leading-tight">
                            {e.eventName}
                          </h3>
                          <span className={`badge ${getStatusBadge(e.status)}`}>{e.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                          <span>📅</span>
                          <span>
                            {e.startDate || e.date || 'TBD'}
                            {e.endDate ? ` – ${e.endDate}` : ''}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                          <span>📍</span>
                          <span>{e.venue || 'Venue TBD'}</span>
                        </p>
                        {e.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mt-2">{e.description}</p>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                        <span>Open Workspace →</span>
                        <span className="text-gray-400 font-normal">
                          👑 {e.eventOwner || 'Lead Organizer'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create / Edit Modal */}
          {showCreateModal && (
            <div
              className="modal-overlay"
              onClick={() => setShowCreateModal(false)}
            >
              <div
                className="modal-content max-w-lg animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold mb-4">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Event Name *
                    </label>
                    <input
                      className="input text-sm"
                      placeholder="e.g. Code Vidhya Hack Day"
                      value={form.eventName}
                      onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Start Date
                      </label>
                      <input
                        className="input"
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        End Date
                      </label>
                      <input
                        className="input"
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Start Time
                      </label>
                      <input
                        className="input"
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        End Time
                      </label>
                      <input
                        className="input"
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Venue / Room
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Senate Hall / Main Auditorium"
                      value={form.venue}
                      onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Event Owner
                      </label>
                      <input
                        className="input"
                        placeholder="e.g. Aman Kumar"
                        value={form.eventOwner}
                        onChange={(e) => setForm({ ...form, eventOwner: e.target.value })}
                      />
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
                        <option value="PLANNING">Planning</option>
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Description
                    </label>
                    <textarea
                      className="textarea"
                      placeholder="Event agenda, requirements, and notes..."
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="btn btn-primary flex-1">
                      {editingEvent ? 'Save Changes' : 'Create Event'}
                    </button>
                    <button
                      type="button"
                      className="btn flex-1 bg-gray-100"
                      onClick={() => setShowCreateModal(false)}
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