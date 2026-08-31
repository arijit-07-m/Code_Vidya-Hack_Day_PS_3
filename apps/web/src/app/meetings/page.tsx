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

interface ActionItem {
  task: string;
  name: string;
  deadline?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  selected: boolean;
}

interface RiskFinding {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface AnalysisResult {
  items: ActionItem[];
  risks: RiskFinding[];
}

interface MeetingItem {
  id: string;
  title: string;
  date?: string;
  transcript?: string;
  aiProcessed?: boolean;
  createdAt?: string;
}

function analyzeMeetingNotes(notes: string): AnalysisResult {
  const items: ActionItem[] = [];
  const sentences = notes.split(/[.\n]+/);

  sentences.forEach((raw) => {
    const text = raw.trim();
    if (!text) return;

    // Pattern 1: [Name] will [action]
    // Pattern 2: [Name] needs to [action]
    // Pattern 3: [Name] is handling [action]
    // Pattern 4: [Name] to [action]
    const match = text.match(/^([A-Za-z]+)\s+(?:will|needs to|is handling|to|shall)\s+(.+)/i);
    if (match) {
      const name = match[1].trim();
      const rawTask = match[2].trim();

      let deadline: string | null = null;
      let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';

      if (rawTask.match(/tomorrow|by tomorrow/i)) {
        deadline = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        priority = 'HIGH';
      } else if (rawTask.match(/tonight|today|asap|immediately|urgent/i)) {
        deadline = new Date().toISOString().split('T')[0];
        priority = 'HIGH';
      } else if (rawTask.match(/next week/i)) {
        deadline = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      }

      if (rawTask.match(/critical|must|backup|emergency|essential/i)) {
        priority = 'CRITICAL';
      }

      // Clean up task text
      const cleanTask = rawTask
        .replace(/\s+before\s+(tomorrow|tonight|today)/i, '')
        .replace(/\s+by\s+(tomorrow|tonight|today)/i, '');

      items.push({
        task: cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        deadline,
        priority,
        selected: true,
      });
    }
  });

  const risks: RiskFinding[] = [];
  if (notes.match(/not\s+confirmed|backup\s+venue|unconfirmed|delay|pending/i)) {
    risks.push({
      title: 'Unconfirmed Venue / Logistics',
      description: 'Key dependencies or backup venues have not yet been confirmed.',
      severity: 'HIGH',
    });
  }

  if (notes.match(/overloaded|busy|stressed|too many tasks|handling registration/i)) {
    risks.push({
      title: 'Volunteer Workload Concentration',
      description: 'Multiple critical duties assigned to single individual without backup.',
      severity: 'MEDIUM',
    });
  }

  return { items, risks };
}

export default function MeetingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    transcript: '',
  });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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
        loadMeetings(firstClubId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadMeetings(clubId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'meetings'),
        where('clubId', '==', clubId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setMeetings(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createMeeting() {
    if (!form.title.trim() || !user || !currentClubId) return;
    try {
      await addDoc(collection(db, 'meetings'), {
        ...form,
        clubId: currentClubId,
        participants: [],
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        aiProcessed: false,
      });
      setShowCreate(false);
      setForm({ title: '', date: new Date().toISOString().split('T')[0], transcript: '' });
      loadMeetings(currentClubId);
    } catch (e) {
      console.error(e);
    }
  }

  function runAnalysis() {
    if (!form.transcript.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalysis(analyzeMeetingNotes(form.transcript));
      setAnalyzing(false);
    }, 600);
  }

  async function approveAnalysis() {
    if (!analysis || !currentClubId || !user) return;
    try {
      const selectedItems = analysis.items.filter((i) => i.selected);

      for (const item of selectedItems) {
        await addDoc(collection(db, 'tasks'), {
          title: item.task,
          assignedTo: item.name,
          assignedToName: item.name,
          deadline: item.deadline || '',
          priority: item.priority,
          status: 'TODO',
          clubId: currentClubId,
          description: `Extracted from meeting: ${form.title || 'Team Meeting'}`,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        });
      }

      for (const risk of analysis.risks) {
        await addDoc(collection(db, 'risks'), {
          title: risk.title,
          description: risk.description,
          severity: risk.severity,
          status: 'OPEN',
          clubId: currentClubId,
          recommendation: 'Review task distribution and finalize pending contracts/confirmations.',
          createdAt: new Date().toISOString(),
        });
      }

      // Record activity log
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'MEETING_ANALYZED',
        description: `Approved and generated ${selectedItems.length} tasks from "${form.title || 'Meeting Notes'}"`,
        createdAt: new Date().toISOString(),
      });

      setAnalysis(null);
      setShowCreate(false);
      setForm({ title: '', date: new Date().toISOString().split('T')[0], transcript: '' });
      loadMeetings(currentClubId);
    } catch (e: any) {
      alert('Failed to save extracted tasks: ' + e.message);
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    loadMeetings(clubId);
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
              <h1 className="text-2xl font-bold">📝 Meetings & AI Analysis</h1>
              <p className="text-sm text-gray-500">
                Turn meeting notes and voice transcripts into actionable tasks
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? 'Cancel' : '+ New Meeting'}
            </button>
          </div>

          {showCreate && (
            <div className="card mb-6 animate-fadeIn">
              <h3 className="font-semibold mb-4 text-base">New Meeting & AI Extraction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Meeting Title
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Hackathon Core Sync"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Date
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Transcript / Meeting Notes
                    </label>
                    <button
                      type="button"
                      className="text-xs text-indigo-600 font-medium hover:underline"
                      onClick={() =>
                        setForm({
                          ...form,
                          transcript:
                            'Rahul will arrange the projector before tomorrow. Priya will prepare the participant certificates by tonight. Aman needs to contact all speakers and confirm their arrival. Sneha will publish the Instagram announcement. We still have not confirmed the backup venue. Rahul is also handling registration.',
                        })
                      }
                    >
                      Fill Demo Notes
                    </button>
                  </div>
                  <textarea
                    className="textarea"
                    placeholder="Paste raw notes or speech-to-text transcript..."
                    rows={5}
                    value={form.transcript}
                    onChange={(e) => setForm({ ...form, transcript: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    className="btn btn-primary flex items-center gap-2"
                    onClick={runAnalysis}
                    disabled={analyzing || !form.transcript.trim()}
                  >
                    <span>✨</span>
                    <span>{analyzing ? 'Analyzing with AI...' : 'Analyze Notes with AI'}</span>
                  </button>
                  <button className="btn bg-white border border-gray-200" onClick={createMeeting}>
                    Save Without AI
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Review Card (Human-in-the-loop) */}
          {analysis && (
            <div className="card mb-6 border-2 border-indigo-500 bg-indigo-50/20 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <span>✨</span> AI Extraction Review
                  </h3>
                  <p className="text-xs text-gray-500">
                    Review and confirm extracted action items before tasks are generated
                  </p>
                </div>
                <span className="badge badge-blue">
                  {analysis.items.filter((x) => x.selected).length} Tasks Ready
                </span>
              </div>

              {/* Action Items List */}
              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Extracted Action Items ({analysis.items.length})
                </h4>
                {analysis.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      item.selected ? 'bg-white border-indigo-200 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => {
                          const updated = [...analysis.items];
                          updated[idx].selected = !updated[idx].selected;
                          setAnalysis({ ...analysis, items: updated });
                        }}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{item.task}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>👤 {item.name}</span>
                          {item.deadline && <span>📅 Due {item.deadline}</span>}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        item.priority === 'CRITICAL'
                          ? 'badge-red'
                          : item.priority === 'HIGH'
                          ? 'badge-yellow'
                          : 'badge-blue'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detected Risks */}
              {analysis.risks.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600">
                    Detected Operational Risks ({analysis.risks.length})
                  </h4>
                  {analysis.risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                    >
                      <span className="text-lg">⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-red-900">{risk.title}</p>
                        <p className="text-xs text-red-700">{risk.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button className="btn btn-primary" onClick={approveAnalysis}>
                  Approve & Create Selected Tasks (
                  {analysis.items.filter((x) => x.selected).length})
                </button>
                <button
                  className="btn bg-white border border-gray-200"
                  onClick={() => setAnalysis(null)}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Existing Meetings List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-48" />
                </div>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p className="empty-state-title">No meetings recorded yet</p>
              <p className="empty-state-text">
                Create a new meeting and paste notes or voice transcripts to test AI task extraction
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((m) => (
                <div key={m.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-base text-gray-900">{m.title}</h3>
                    <div className="flex items-center gap-2">
                      {m.aiProcessed && (
                        <span className="badge badge-green flex items-center gap-1">
                          <span>✨</span> AI Processed
                        </span>
                      )}
                      {m.date && (
                        <span className="text-xs text-gray-400">
                          {new Date(m.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {m.transcript && (
                    <p className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2 font-mono text-xs">
                      {m.transcript}
                    </p>
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
