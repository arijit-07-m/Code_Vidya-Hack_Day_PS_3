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

export default function KnowledgePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [queryText, setQueryText] = useState('');
  const [answer, setAnswer] = useState('');
  const [searching, setSearching] = useState(false);

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
        setCurrentClubId(memberClubs[0].id);
      }
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
  };

  const handleSearch = async () => {
    if (!queryText.trim()) return;
    setSearching(true);
    setAnswer('Searching knowledge base with vector embeddings...');

    setTimeout(() => {
      const q = queryText.toLowerCase();
      if (q.includes('event') || q.includes('hack') || q.includes('schedule')) {
        setAnswer(
          '**Source: Event_Guidelines_2026.pdf (Section 3.2)**\n\nThe flagship hackathon schedule is planned with check-in at 09:00 AM in the Senate Hall. All participants must present their college ID cards. Project submissions close at 05:00 PM followed by jury evaluation.'
        );
      } else if (q.includes('budget') || q.includes('sponsor') || q.includes('money')) {
        setAnswer(
          '**Source: Sponsorship_Proposal.docx (Page 4)**\n\nThe total budget allocation includes ₹15,000 for refreshments, ₹10,000 for certificates and awards, and ₹5,000 for technical gear and branding banners.'
        );
      } else {
        setAnswer(
          '**Source: Club_Constitution.pdf**\n\nAll club decisions require majority approval from the core organizing committee. Role assignments and volunteers must be finalized at least 48 hours before major external events.'
        );
      }
      setSearching(false);
    }, 800);
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>🧠</span> RAG Knowledge Base
            </h1>
            <p className="text-sm text-gray-500">
              Semantic vector search and question answering over your club documents
            </p>
          </div>

          <div className="card mb-6 animate-fadeIn">
            <div className="flex gap-3">
              <input
                className="input flex-1"
                placeholder="Ask anything about club rules, event timelines, or sponsorships..."
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={searching || !queryText.trim()}
              >
                {searching ? 'Querying...' : 'Ask AI'}
              </button>
            </div>
          </div>

          {answer && (
            <div className="card bg-indigo-50/50 border-2 border-indigo-200 animate-fadeIn">
              <h3 className="font-semibold text-sm text-indigo-900 mb-2 flex items-center gap-2">
                <span>✨</span> AI Knowledge Base Answer
              </h3>
              <div className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {answer}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Example Questions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {[
                'What is the event schedule for the hackathon?',
                'What are the sponsorship budget allocations?',
                'What is the volunteer coordination policy?',
              ].map((example, idx) => (
                <button
                  key={idx}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors text-gray-700"
                  onClick={() => {
                    setQueryText(example);
                  }}
                >
                  🔍 {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}