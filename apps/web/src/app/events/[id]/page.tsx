'use client';
import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';
import { useParams } from 'next/navigation';

const cfg = { apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro", authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com", projectId: "code-vidya-hack-day-ps-3-6b47d" };
const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string || '';
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [currentClubId, setCurrentClubId] = useState(null);
  const [club, setClub] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [risks, setRisks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [eventForm, setEventForm] = useState({ eventName: '', date: '', venue: '', description: '', status: 'PLANNING' });

  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { if (!u) { window.location.href = '/login'; return; } setUser(u); setAuthChecked(true); }); return () => unsub(); }, []);
  useEffect(() => { if (authChecked && user) loadClubs(); }, [authChecked, user]);
  async function loadClubs() {
    if (!user) return;
    try {
      const q = query(collection(db, 'clubMembers'), where('status', '==', 'ACTIVE'));
      const snapshot = await getDocs(q);
      const allMembers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const userMembers = allMembers.filter((x) => x.userId === user.uid || (x.email && x.email.toLowerCase() === (user.email || '').toLowerCase()));
      const rawClubs = await Promise.all(userMembers.map(async (d) => {
        const m = d; const c = await getDoc(doc(db, 'clubs', m.clubId));
        if (!c.exists()) return null;
        return { id: c.id, ...c.data(), membershipRole: m.role };
      }));
      const memberClubs = rawClubs.filter(Boolean);
      setClubs(memberClubs);
      if (memberClubs.length > 0) {
        const fc = memberClubs[0];
        setCurrentClubId(fc.id); setClub(fc);
        if (fc.membershipRole === 'OWNER') setRoleName('Owner');
        else if (fc.membershipRole === 'ADMIN') setRoleName('Admin');
        loadEventData(fc.id);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function loadEventData(clubId) {
    if (!eventId) { setLoading(false); return; }
    try {
      const evSnap = await getDoc(doc(db, 'events', eventId));
      if (evSnap.exists()) {
        const ev = { id: evSnap.id, ...evSnap.data() };
        setEvent(ev);
        setEventForm({ eventName: ev.eventName || '', date: ev.date || '', venue: ev.venue || '', description: ev.description || '', status: ev.status || 'PLANNING' });
      }
      const [tsSnap, mtSnap, rkSnap, mbSnap] = await Promise.all([
        getDocs(query(collection(db, 'tasks'), where('eventId', '==', eventId))),
        getDocs(query(collection(db, 'meetings'), where('clubId', '==', clubId), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'risks'), where('eventId', '==', eventId))),
        getDocs(query(collection(db, 'clubMembers'), where('clubId', '==', clubId), where('status', '==', 'ACTIVE')))
      ]);
      setTasks(tsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMeetings(mtSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRisks(rkSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMembers(mbSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function saveEvent() {
    if (!event || !currentClubId) return;
    try { await updateDoc(doc(db, 'events', eventId), { ...eventForm, updatedAt: new Date().toISOString() }); await addDoc(collection(db, 'activityLogs'), { clubId: currentClubId, userId: user?.uid, userName: user?.email, action: 'EVENT_EDITED', description: 'Event updated: ' + eventForm.eventName, createdAt: new Date().toISOString() }); setEvent({ ...event, ...eventForm }); setEditMode(false); } catch (e) { console.error(e); }
  }
  async function deleteEvent() { if (!confirm('Delete permanently?')) return; await deleteDoc(doc(db, 'events', eventId)); window.location.href = '/events'; }
  async function completeTask(taskId) { await updateDoc(doc(db, 'tasks', taskId), { status: 'COMPLETED', updatedAt: new Date().toISOString() }); await addDoc(collection(db, 'activityLogs'), { clubId: currentClubId, userId: user?.uid, userName: user?.email, action: 'TASK_COMPLETED', description: 'Task completed from event workspace', createdAt: new Date().toISOString() }); if (currentClubId) loadEventData(currentClubId); }
  const hl = async () => { await signOut(auth); window.location.href = '/login'; };
  const hc = (id) => { setCurrentClubId(id); setClub(clubs.find(x => x.id === id)); };

  if (!user) return React.createElement('div', {className: 'min-h-screen flex items-center justify-center'}, React.createElement('div', {className: 'skeleton w-8 h-8 rounded-full'}));
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const progress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  return React.createElement('div', {className: 'flex min-h-screen'},
    React.createElement(Sidebar, {clubs, currentClubId: currentClubId || '', userDisplayName: user?.email?.split('@')[0], clubRole: roleName, onClubChange: hc, onLogout: hl, clubName: club?.name}),
    React.createElement('main', {className: 'flex-1 bg-gray-50 overflow-y-auto p-6'},
      React.createElement('div', {className: 'max-w-6xl mx-auto'},

        loading ? React.createElement('div', {className: 'space-y-4'}, [1,2,3].map(i => React.createElement('div', {key: i, className: 'skeleton h-12 w-full'}))) : !event ? React.createElement('div', {className: 'empty-state'}, React.createElement('div', {className: 'empty-state-icon'}, '📅'), React.createElement('p', {className: 'empty-state-title'}, 'Event not found'), React.createElement('a', {href: '/events', className: 'btn btn-primary'}, 'Back to Events')) : React.createElement(React.Fragment, null,
          React.createElement('div', {className: 'card mb-6'},
            React.createElement('div', {className: 'flex items-start justify-between flex-wrap gap-4'},
              React.createElement('div', null,
                React.createElement('h1', {className: 'text-2xl font-bold'}, editMode ? 'Editing: ' + (event.eventName||'') : event.eventName || 'Untitled Event'),
                React.createElement('div', {className: 'flex items-center gap-3 mt-2 flex-wrap'},
                  React.createElement('span', {className: 'badge ' + (event.status === 'ACTIVE' ? 'badge-green' : event.status === 'PLANNING' ? 'badge-blue' : event.status === 'COMPLETED' ? 'badge-gray' : 'badge-red')}, event.status),
                  event.date ? React.createElement('span', {className: 'text-sm text-gray-500'}, '📅 ' + new Date(event.date).toLocaleDateString()) : null,
                  event.venue ? React.createElement('span', {className: 'text-sm text-gray-500'}, '📍 ' + event.venue) : null)
              ),
              React.createElement('div', {className: 'flex gap-2'},
                React.createElement('button', {className: 'btn btn-sm', onClick: () => { if (editMode) saveEvent(); setEditMode(!editMode); }}, editMode ? '💾 Save' : '✏️ Edit'),
                React.createElement('button', {className: 'btn btn-sm btn-danger', onClick: deleteEvent}, '🗑️ Delete')
              )
            ),
            editMode ? React.createElement('div', {className: 'mt-4 p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200'},
              React.createElement('input', {className: 'input', placeholder: 'Event name', value: eventForm.eventName, onChange: e => setEventForm({...eventForm, eventName: e.target.value})}),
              React.createElement('div', {className: 'flex gap-3'},
                React.createElement('input', {className: 'input flex-1', type: 'date', value: eventForm.date, onChange: e => setEventForm({...eventForm, date: e.target.value})}),
                React.createElement('input', {className: 'input flex-1', placeholder: 'Venue', value: eventForm.venue, onChange: e => setEventForm({...eventForm, venue: e.target.value})}),
                React.createElement('select', {className: 'select', value: eventForm.status, onChange: e => setEventForm({...eventForm, status: e.target.value})},
                  React.createElement('option', {value: 'PLANNING'}, 'Planning'), React.createElement('option', {value: 'ACTIVE'}, 'Active'), React.createElement('option', {value: 'COMPLETED'}, 'Completed'), React.createElement('option', {value: 'CANCELLED'}, 'Cancelled'))
              ),
              React.createElement('textarea', {className: 'textarea', placeholder: 'Description', value: eventForm.description, onChange: e => setEventForm({...eventForm, description: e.target.value})})
            ) : null
          ),
          React.createElement('div', {className: 'card mb-6'},
            React.createElement('div', {className: 'flex items-center justify-between mb-2'},
              React.createElement('span', {className: 'text-sm font-medium'}, 'Progress'),
              React.createElement('span', {className: 'text-sm font-bold text-indigo-600'}, progress + '%')
            ),
            React.createElement('div', {className: 'w-full bg-gray-200 rounded-full h-3 overflow-hidden'},
              React.createElement('div', {className: 'bg-indigo-600 h-3 rounded-full transition-all duration-500', style: {width: progress + '%'}})
            ),
            React.createElement('div', {className: 'flex gap-6 mt-2 text-xs text-gray-500'},
              React.createElement('span', null, '✅ ' + completedTasks + ' / ' + totalTasks + ' tasks'),
              React.createElement('span', null, '👥 ' + members.length + ' members'),
              React.createElement('span', null, '⚠️ ' + risks.length + ' risks')
            )
          ),
          React.createElement('div', {className: 'tabs mb-6'},
            ['overview', 'tasks', 'meetings', 'risks', 'members'].map(t =>
              React.createElement('button', {key: t, className: 'tab' + (tab === t ? ' active' : ''), onClick: () => setTab(t)},
                (t === 'overview' ? '📊 Overview' : t === 'tasks' ? '✅ Tasks (' + tasks.length + ')' : t === 'meetings' ? '📝 Meetings' : t === 'risks' ? '⚠️ Risks (' + risks.length + ')' : '👥 Members')
              )
            )
          ),

          tab === 'overview' ? React.createElement('div', null,
            event.description ? React.createElement('div', {className: 'card mb-4'},
              React.createElement('h3', {className: 'font-semibold mb-2'}, 'Description'),
              React.createElement('p', {className: 'text-sm text-gray-600'}, event.description)
            ) : null,
            React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-3 gap-4'},
              React.createElement('div', {className: 'card'}, React.createElement('p', {className: 'text-sm text-gray-500'}, 'Total Tasks'), React.createElement('p', {className: 'text-2xl font-bold'}, totalTasks)),
              React.createElement('div', {className: 'card'}, React.createElement('p', {className: 'text-sm text-gray-500'}, 'Members'), React.createElement('p', {className: 'text-2xl font-bold'}, members.length)),
              React.createElement('div', {className: 'card'}, React.createElement('p', {className: 'text-sm text-gray-500'}, 'Risks'), React.createElement('p', {className: 'text-2xl font-bold text-red-600'}, risks.length))
            ),
            tasks.length > 0 ? React.createElement('div', {className: 'card mt-4'},
              React.createElement('h3', {className: 'font-semibold mb-3'}, 'Recent Tasks'),
              tasks.slice(0, 5).map(t => React.createElement('div', {key: t.id, className: 'flex items-center justify-between py-2 border-b border-gray-100 last:border-0'},
                React.createElement('span', {className: 'text-sm'}, t.title),
                React.createElement('div', {className: 'flex items-center gap-2'},
                  React.createElement('span', {className: 'badge ' + (t.priority === 'CRITICAL' ? 'badge-red' : t.priority === 'HIGH' ? 'badge-yellow' : t.priority === 'MEDIUM' ? 'badge-blue' : 'badge-gray')}, t.priority),
                  React.createElement('span', {className: 'badge ' + (t.status === 'COMPLETED' ? 'badge-green' : t.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-gray')}, t.status))
              ))
            ) : null
          ) : null,
          tab === 'tasks' ? React.createElement('div', {className: 'card'},
            React.createElement('h3', {className: 'font-semibold mb-4'}, 'Event Tasks'),
            tasks.length === 0 ? React.createElement('p', {className: 'text-sm text-gray-400 py-4'}, 'No tasks for this event yet.')
              : React.createElement('div', {className: 'space-y-2'}, tasks.map(t =>
                  React.createElement('div', {key: t.id, className: 'flex items-center justify-between p-3 bg-gray-50 rounded-lg'},
                    React.createElement('div', {className: 'flex-1'},
                      React.createElement('p', {className: 'text-sm font-medium'}, t.title),
                      React.createElement('div', {className: 'flex items-center gap-3 mt-1'},
                        React.createElement('span', {className: 'badge ' + (t.priority === 'CRITICAL' ? 'badge-red' : t.priority === 'HIGH' ? 'badge-yellow' : 'badge-gray')}, t.priority),
                        React.createElement('span', {className: 'badge ' + (t.status === 'COMPLETED' ? 'badge-green' : t.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-gray')}, t.status),
                        t.assignedTo ? React.createElement('span', {className: 'text-xs text-gray-500'}, '👤 ' + t.assignedTo) : null,
                        t.deadline ? React.createElement('span', {className: 'text-xs text-gray-500'}, '📅 ' + t.deadline) : null
                      )
                    ),
                    t.status !== 'COMPLETED' ? React.createElement('button', {className: 'btn btn-sm btn-primary', onClick: () => completeTask(t.id)}, 'Mark Done') : null
                  )
              ))
          ) : null,

          tab === 'meetings' ? React.createElement('div', {className: 'card'},
            React.createElement('h3', {className: 'font-semibold mb-4'}, 'Related Meetings'),
            meetings.length === 0 ? React.createElement('p', {className: 'text-sm text-gray-400 py-4'}, 'No meetings found.')
              : React.createElement('div', {className: 'space-y-2'}, meetings.map(m =>
                  React.createElement('div', {key: m.id, className: 'p-3 bg-gray-50 rounded-lg'},
                    React.createElement('div', {className: 'flex items-center justify-between'},
                      React.createElement('p', {className: 'text-sm font-medium'}, m.title),
                      m.aiProcessed ? React.createElement('span', {className: 'badge badge-green'}, '✨ AI') : null
                    ),
                    m.transcript ? React.createElement('p', {className: 'text-xs text-gray-500 mt-1 line-clamp-2'}, m.transcript) : null
                  )
              ))
          ) : null,
          tab === 'risks' ? React.createElement('div', {className: 'card'},
            React.createElement('h3', {className: 'font-semibold mb-4'}, 'Event Risks'),
            risks.length === 0 ? React.createElement('div', {className: 'empty-state'}, React.createElement('div', {className: 'empty-state-icon'}, '✅'), React.createElement('p', {className: 'empty-state-title'}, 'No risks'))
              : React.createElement('div', {className: 'space-y-3'}, risks.map(r =>
                  React.createElement('div', {key: r.id, className: 'p-3 bg-red-50 border border-red-200 rounded-lg'},
                    React.createElement('div', {className: 'flex items-center gap-2 mb-1'},
                      React.createElement('span', {className: 'badge ' + (r.severity === 'CRITICAL' ? 'badge-red' : r.severity === 'HIGH' ? 'badge-yellow' : 'badge-blue')}, r.severity),
                      React.createElement('p', {className: 'text-sm font-medium'}, r.title)),
                    React.createElement('p', {className: 'text-xs text-gray-600'}, r.description),
                    r.recommendation ? React.createElement('p', {className: 'text-xs text-blue-600 mt-1'}, '💡 ' + r.recommendation) : null
                  )
              ))
          ) : null,
          tab === 'members' ? React.createElement('div', {className: 'card'},
            React.createElement('h3', {className: 'font-semibold mb-4'}, 'Club Members'),
            members.length === 0 ? React.createElement('p', {className: 'text-sm text-gray-400 py-4'}, 'No members.')
              : React.createElement('div', {className: 'grid grid-cols-2 md:grid-cols-3 gap-3'}, members.map(m =>
                  React.createElement('div', {key: m.id, className: 'flex items-center gap-2 p-2 bg-gray-50 rounded-lg'},
                    React.createElement('div', {className: 'w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600'}, (m.displayName||m.email||'?')[0].toUpperCase()),
                    React.createElement('div', null, React.createElement('p', {className: 'text-sm font-medium'}, m.displayName || m.email), React.createElement('p', {className: 'text-xs text-gray-400'}, m.role))
                  )
              ))
          ) : null
        )
      )
    )
  );
}
