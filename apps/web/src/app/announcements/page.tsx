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

interface AnnouncementItem {
  id: string;
  clubId?: string;
  title: string;
  content: string;
  type?: string;
  channel?: string;
  createdAt: string;
  createdBy?: string;
}

export default function AnnouncementsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState('ALL');
  const [generating, setGenerating] = useState(false);

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
        loadAnnouncements(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadAnnouncements(clubId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'announcements'),
        where('clubId', '==', clubId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setAnnouncements(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createAnnouncement() {
    if (!title.trim() || !content.trim() || !user || !currentClubId) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        clubId: currentClubId,
        title: title.trim(),
        content: content.trim(),
        channel,
        type: 'general',
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });
      setShowCreate(false);
      setTitle('');
      setContent('');
      loadAnnouncements(currentClubId);
    } catch (e) {
      console.error(e);
    }
  }

  function generateWithAI() {
    setGenerating(true);
    setTimeout(() => {
      setTitle('🚀 Registration Open: Code Vidhya Hack Day 2026');
      setContent(
        'Exciting news team! Registrations for our flagship hackathon are now officially open. All volunteers are requested to check their assigned tasks and confirm venue arrangements by tomorrow evening. Let\'s make this our biggest event yet!'
      );
      setGenerating(false);
    }, 600);
  }

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    loadAnnouncements(clubId);
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">📢 Announcements</h1>
              <p className="text-sm text-gray-500">
                Broadcast updates, deadlines, and notices to your club
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? 'Cancel' : '+ New Announcement'}
            </button>
          </div>

          {showCreate && (
            <div className="card mb-6 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-base">New Announcement</h3>
                <button
                  type="button"
                  className="btn btn-sm bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1.5"
                  onClick={generateWithAI}
                  disabled={generating}
                >
                  <span>✨</span>
                  <span>{generating ? 'Drafting...' : 'AI Auto-Draft'}</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Announcement Headline
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Venue Change for Tomorrow's Workshop"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Audience / Channel
                  </label>
                  <select
                    className="select"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="ALL">Everyone in Club</option>
                    <option value="VOLUNTEERS">Volunteers & Core Team</option>
                    <option value="LEADS">Event Leads Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Message Body
                  </label>
                  <textarea
                    className="textarea"
                    placeholder="Write announcement details..."
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" onClick={createAnnouncement}>
                  Publish Announcement
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-48 mb-2" />
                  <div className="skeleton h-4 w-full" />
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📢</div>
              <p className="empty-state-title">No announcements yet</p>
              <p className="empty-state-text">
                Post announcements or use the AI generator to draft communications
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-base text-gray-900">{a.title}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {a.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}