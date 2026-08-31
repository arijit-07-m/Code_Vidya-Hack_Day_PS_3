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

interface Message {
  from: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

interface PendingAction {
  action: 'create' | 'complete';
  data: any;
}

export default function AIAssistantPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [club, setClub] = useState<any>(null);
  const [command, setCommand] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingAction | null>(null);
  const [executing, setExecuting] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [roleName, setRoleName] = useState('');

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
        const firstClub = memberClubs[0];
        setCurrentClubId(firstClub.id);
        setClub(firstClub);
        if (firstClub.membershipRole === 'OWNER') setRoleName('Owner');
        loadClubData(firstClub.id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadClubData(clubId: string) {
    try {
      const [tsSnap, evSnap, mbSnap, rkSnap] = await Promise.all([
        getDocs(query(collection(db, 'tasks'), where('clubId', '==', clubId))),
        getDocs(query(collection(db, 'events'), where('clubId', '==', clubId))),
        getDocs(
          query(
            collection(db, 'clubMembers'),
            where('clubId', '==', clubId),
            where('userId', '==', user.uid), where('status', '==', 'ACTIVE')
          )
        ),
        getDocs(query(collection(db, 'risks'), where('clubId', '==', clubId))),
      ]);

      setTasks(tsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEvents(evSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setMembers(mbSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setRisks(rkSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  }

  function processNaturalLanguage(cmd: string) {
    const c = cmd.toLowerCase().trim();
    const now = new Date();

    const urgent = tasks.filter(
      (t) => (t.priority === 'HIGH' || t.priority === 'CRITICAL') && t.status !== 'COMPLETED'
    );
    const overdue = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'COMPLETED'
    );
    const openRisks = risks.filter((r) => r.status === 'OPEN' || !r.status);

    // Intent: Urgent / Attention
    if (
      c.includes('urgent') ||
      c.includes('attention') ||
      c.includes('what needs') ||
      c.includes('whats happening')
    ) {
      let resp = '📊 **Club Operations Status**:\n\n';
      if (urgent.length > 0) {
        resp += `🔴 **${urgent.length} Urgent Tasks**:\n` +
          urgent.slice(0, 5).map((t) => `• ${t.title} (${t.priority}) — Assigned: ${t.assignedTo || 'Unassigned'}`).join('\n') + '\n\n';
      }
      if (overdue.length > 0) {
        resp += `⚠️ **${overdue.length} Overdue Tasks**:\n` +
          overdue.slice(0, 3).map((t) => `• ${t.title} (Due: ${t.deadline})`).join('\n') + '\n\n';
      }
      if (openRisks.length > 0) {
        resp += `🚨 **${openRisks.length} Unresolved Risks** detected.\n`;
      }
      if (urgent.length === 0 && overdue.length === 0 && openRisks.length === 0) {
        resp = '✅ All clear! No urgent bottlenecks or overdue tasks found.';
      }
      return { response: resp };
    }

    // Intent: Workload / Overloaded
    if (c.includes('overloaded') || c.includes('workload') || c.includes('who is busy')) {
      const counts = members.map((m) => {
        const count = tasks.filter(
          (t) =>
            (t.assignedTo === m.userId ||
              (t.assignedTo || '').toLowerCase() === (m.displayName || '').toLowerCase()) &&
            t.status !== 'COMPLETED'
        ).length;
        return { name: m.displayName || m.email || 'Team Member', count };
      }).sort((a, b) => b.count - a.count);

      if (counts.length === 0) return { response: 'No workload data available.' };

      let resp = '👥 **Team Workload Distribution**:\n\n';
      counts.slice(0, 8).forEach((item) => {
        resp += `• ${item.name}: **${item.count} active tasks** ${item.count >= 3 ? '🔴 (Heavy)' : '🟢'}\n`;
      });
      return { response: resp };
    }

    // Intent: Risks
    if (c.includes('risk') || c.includes('show risk') || c.includes('what risks')) {
      if (openRisks.length === 0) {
        return { response: '✅ No active risks detected in the club operations.' };
      }
      let resp = `⚠️ **${openRisks.length} Active Operational Risks**:\n\n`;
      openRisks.slice(0, 5).forEach((r) => {
        resp += `• [${r.severity || 'HIGH'}] **${r.title}**: ${r.description || 'Action required'}\n`;
      });
      return { response: resp };
    }

    // Intent: List tasks
    if (c.includes('list task') || c.includes('all tasks') || c.includes('show tasks')) {
      const active = tasks.filter((t) => t.status !== 'COMPLETED');
      if (active.length === 0) return { response: '✅ No pending tasks! Everything is completed.' };
      let resp = `📋 **Pending Tasks (${active.length})**:\n\n`;
      active.slice(0, 8).forEach((t) => {
        resp += `• [${t.priority}] **${t.title}** — ${t.assignedToName || t.assignedTo || 'Unassigned'}\n`;
      });
      return { response: resp };
    }

    // Intent: Create task pattern
    // e.g. "Create a high priority task for Rahul to arrange projector by tomorrow"
    const taskMatch = c.match(
      /create\s+(?:a\s+)?(?:(high|critical|medium|low)\s+priority\s+)?task\s+for\s+(.+?)\s+to\s+(.+?)(?:\s+by\s+(today|tomorrow|tonight|\S+))?$/i
    );
    if (taskMatch) {
      const priority = (taskMatch[1] ? taskMatch[1].toUpperCase() : 'HIGH') as any;
      const assignee = taskMatch[2].trim();
      const title = taskMatch[3].trim();
      const rawDeadline = taskMatch[4];

      let deadline = new Date().toISOString().split('T')[0];
      if (rawDeadline === 'tomorrow') {
        deadline = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      } else if (rawDeadline && rawDeadline !== 'today' && rawDeadline !== 'tonight') {
        deadline = rawDeadline;
      }

      return {
        response: `I've prepared this task for you:\n\n• **Title**: ${title}\n• **Assignee**: ${assignee}\n• **Priority**: ${priority}\n• **Deadline**: ${deadline}\n\nPlease click **Confirm Action** to save it to your club database.`,
        action: {
          action: 'create' as const,
          data: { title, assignedTo: assignee, assignedToName: assignee, priority, deadline },
        },
      };
    }

    // Intent: Mark done
    const markMatch = c.match(/mark\s+(.+?)\s+(?:as\s+)?(?:completed|done)/i);
    if (markMatch) {
      const queryTitle = markMatch[1].trim().toLowerCase();
      const match = tasks.find((t) => (t.title || '').toLowerCase().includes(queryTitle));
      if (!match) {
        return { response: `I couldn't find a task matching "${queryTitle}".` };
      }
      return {
        response: `Found task: **${match.title}** (${match.status})\n\nMark this task as **COMPLETED**?`,
        action: {
          action: 'complete' as const,
          data: { taskId: match.id, title: match.title },
        },
      };
    }

    return {
      response:
        "I can help manage your club! Try asking:\n\n• *Create a high priority task for Rahul to arrange the projector by tomorrow*\n• *What are my urgent tasks?*\n• *Who is overloaded?*\n• *Show active operational risks*\n• *List all pending tasks*\n• *Mark projector as done*",
    };
  }

  function handleSend() {
    if (!command.trim()) return;
    const userMsg: Message = { from: 'user', text: command };
    const result = processNaturalLanguage(command);
    const aiMsg: Message = { from: 'ai', text: result.response };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    if (result.action) {
      setPendingConfirmation(result.action);
    }
    setCommand('');
  }

  async function executePendingAction() {
    if (!pendingConfirmation || !currentClubId || !user) return;
    setExecuting(true);
    try {
      if (pendingConfirmation.action === 'create') {
        await addDoc(collection(db, 'tasks'), {
          ...pendingConfirmation.data,
          clubId: currentClubId,
          status: 'TODO',
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        });
        await addDoc(collection(db, 'activityLogs'), {
          clubId: currentClubId,
          userId: user.uid,
          userName: user.email,
          action: 'AI_CREATED_TASK',
          description: `AI created task: "${pendingConfirmation.data.title}"`,
          createdAt: new Date().toISOString(),
        });
        setMessages((prev) => [
          ...prev,
          { from: 'ai', text: `✅ Successfully created task: **${pendingConfirmation.data.title}**!` },
        ]);
      } else if (pendingConfirmation.action === 'complete') {
        await updateDoc(doc(db, 'tasks', pendingConfirmation.data.taskId), {
          status: 'COMPLETED',
          updatedAt: new Date().toISOString(),
        });
        setMessages((prev) => [
          ...prev,
          { from: 'ai', text: `✅ Task marked as **COMPLETED**!` },
        ]);
      }
      setPendingConfirmation(null);
      loadClubData(currentClubId);
    } catch (e: any) {
      setMessages((prev) => [...prev, { from: 'ai', text: `❌ Error: ${e.message}` }]);
    } finally {
      setExecuting(false);
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    setClub(clubs.find((x) => x.id === clubId));
    loadClubData(clubId);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clubs={clubs}
        currentClubId={currentClubId || ''}
        userDisplayName={user?.email?.split('@')[0]}
        clubRole={roleName}
        onClubChange={handleClubChange}
        onLogout={handleLogout}
        clubName={club?.name}
      />
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>✨</span> AI Assistant
            </h1>
            <p className="text-sm text-gray-500">
              Natural language intelligence and real-time operations commands
            </p>
          </div>

          {/* Chat Stream */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-[420px] max-h-[500px] overflow-y-auto mb-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-3">
                  🤖
                </div>
                <h3 className="font-semibold text-gray-700 text-base">ClubOps AI Agent Ready</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Ask questions about your club or dictate tasks using natural language.
                </p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    m.from === 'ai' ? 'bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl' : 'p-3'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                      m.from === 'ai' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {m.from === 'ai' ? '🤖' : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      {m.from === 'ai' ? 'ClubOps AI' : 'You'}
                    </p>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {m.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pending Action Confirmation Modal */}
          {pendingConfirmation && (
            <div className="mb-4 p-4 bg-indigo-50 border-2 border-indigo-500 rounded-xl flex items-center justify-between animate-fadeIn">
              <div>
                <p className="font-semibold text-sm text-indigo-900">
                  Ready to execute action: {pendingConfirmation.action.toUpperCase()}
                </p>
                <p className="text-xs text-indigo-700">
                  {pendingConfirmation.data.title}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={executePendingAction}
                  disabled={executing}
                >
                  {executing ? 'Executing...' : 'Confirm Action'}
                </button>
                <button
                  className="btn btn-sm bg-white border border-gray-200"
                  onClick={() => setPendingConfirmation(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Command Input Box */}
          <div className="card flex gap-3 items-center">
            <input
              className="input flex-1"
              placeholder="e.g. Create a task for Aman to confirm the backup venue by tonight..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              className="btn btn-primary px-6"
              onClick={handleSend}
              disabled={!command.trim()}
            >
              Send
            </button>
          </div>

          {/* Suggested Quick Commands */}
          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Suggested Commands
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'Create a high priority task for Rahul to arrange projector by tomorrow',
                'What are urgent tasks?',
                'Who is overloaded?',
                'Show active operational risks',
                'List all pending tasks',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  className="text-left text-xs p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors text-gray-700"
                  onClick={() => setCommand(suggestion)}
                >
                  💬 {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
