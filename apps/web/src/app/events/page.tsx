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

interface EventItem {
  id: string;
  eventName: string;
  date?: string;
  venue?: string;
  description?: string;
  format?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
}

export default function EventsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    eventName: '',
    date: '',
    venue: '',
    description: '',
    format: 'INTERNAL',
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

  async function createEvent() {
    if (!form.eventName.trim() || !user || !currentClubId) return;
    try {
      await addDoc(collection(db, 'events'), {
        ...form,
        clubId: currentClubId,
        status: 'PLANNING',
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
      setShowCreate(false);
      setForm({ eventName: '', date: '', venue: '', description: '', format: 'INTERNAL' });
      loadEvents(currentClubId);
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
    loadEvents(clubId);
  };

  const statusClass = (s: string) =>
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">📅 Club Events</h1>
              <p className="text-sm text-gray-500">Plan, track, and execute club events</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? 'Cancel' : '+ New Event'}
            </button>
          </div>

          {showCreate && (
            <div className="card mb-6 animate-fadeIn">
              <h3 className="font-semibold mb-4 text-base">New Event</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Event Title
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Code Vidhya Hack Day 2026"
                    value={form.eventName}
                    onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Event Date
                    </label>
                    <input
                      className="input"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Venue / Location
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Senate Hall / Main Auditorium"
                      value={form.venue}
                      onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Description
                  </label>
                  <textarea
                    className="textarea"
                    placeholder="Provide details and agenda for the event..."
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <button className="btn btn-primary" onClick={createEvent}>
                  Create Event
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-48 mb-2" />
                  <div className="skeleton h-4 w-32" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p className="empty-state-title">No events planned yet</p>
              <p className="empty-state-text">
                Create your first event to start organizing tasks and tracking operational risks
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="card hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h3 className="font-semibold text-base text-gray-900 leading-tight">
                        {e.eventName}
                      </h3>
                      <span className={`badge ${statusClass(e.status)}`}>{e.status}</span>
                    </div>
                    {e.date && (
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                        <span>📅</span>
                        <span>{new Date(e.date).toLocaleDateString()}</span>
                      </p>
                    )}
                    {e.venue && (
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{e.venue}</span>
                      </p>
                    )}
                    {e.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-2">{e.description}</p>
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