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

interface DocumentItem {
  id: string;
  name: string;
  type?: string;
  sizeBytes?: number;
  createdAt: string;
}

export default function DocumentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mockDocName, setMockDocName] = useState('');

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
        loadDocs(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadDocs(clubId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'documents'),
        where('clubId', '==', clubId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setDocuments(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDocument() {
    if (!mockDocName.trim() || !user || !currentClubId) return;
    setUploading(true);
    try {
      await addDoc(collection(db, 'documents'), {
        clubId: currentClubId,
        name: mockDocName.trim(),
        type: 'DOCX',
        sizeBytes: 45200,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });
      setMockDocName('');
      loadDocs(currentClubId);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    loadDocs(clubId);
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
              <h1 className="text-2xl font-bold">📄 Club Documents & Assets</h1>
              <p className="text-sm text-gray-500">
                Upload and index documents for the AI RAG knowledge base
              </p>
            </div>
          </div>

          <div className="card mb-6 animate-fadeIn">
            <h3 className="font-semibold mb-3 text-base">Upload Document</h3>
            <div className="flex gap-3">
              <input
                className="input flex-1"
                placeholder="e.g. Club_Constitution_2026.pdf or Sponsorship_Deck.docx"
                value={mockDocName}
                onChange={(e) => setMockDocName(e.target.value)}
              />
              <button
                className="btn btn-primary"
                onClick={handleAddDocument}
                disabled={uploading || !mockDocName.trim()}
              >
                {uploading ? 'Indexing...' : 'Upload & Index'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Supported file types: PDF, DOCX, TXT, MD. Documents are chunked and embedded for AI retrieval.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-48" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <p className="empty-state-title">No documents uploaded yet</p>
              <p className="empty-state-text">
                Upload documents to power your club&apos;s AI Q&A knowledge base
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((d) => (
                <div key={d.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📑</span>
                    <h3 className="font-semibold text-sm text-gray-900 truncate flex-1">
                      {d.name}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span>{d.sizeBytes ? `${(d.sizeBytes / 1024).toFixed(0)} KB` : '45 KB'}</span>
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
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