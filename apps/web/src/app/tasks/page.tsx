'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { getPriorityColor, getStatusColor, formatDate } from '@/lib/utils';

interface TaskData { id: string; title: string; status: string; priority: string; deadline?: string; assignedTo: string; assignedToName?: string; eventId?: string; }
interface ClubInfo { id: string; name: string; membershipRole: string; }

function TasksContent() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', deadline: '' });

  useEffect(() => {
    (async () => {
      try {
        const d: any = await api.get('/clubs/my');
        setClubs(d.clubs || []);
        if (d.clubs?.length > 0) {
          const id = d.clubs[0].id;
          setCurrentClubId(id);
          loadTasks(id);
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  const loadTasks = async (clubId: string) => {
    setLoading(true);
    try {
      const d: any = await api.get(`/tasks/clubs/${clubId}`);
      setTasks(d.tasks || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createTask = async () => {
    try {
      await api.post('/tasks', { ...newTask, clubId: currentClubId });
      setShowCreate(false);
      setNewTask({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', deadline: '' });
      if (currentClubId) loadTasks(currentClubId);
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (taskId: string, status: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status, clubId: currentClubId });
      if (currentClubId) loadTasks(currentClubId);
    } catch (e) { console.error(e); }
return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select Club'} />}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">✅ Tasks</h1>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ New Task'}</button>
        </div>

        {showCreate && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">New Task</h3>
            <div className="space-y-3">
              <input className="input" placeholder="Task title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              <input className="input" placeholder="Assignee UID" value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})} />
              <input className="input" type="date" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
              <select className="input" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
              </select>
              <button className="btn btn-primary" onClick={createTask}>Create Task</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          {['all','todo','in_progress','completed','critical','overdue'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : ''}`} onClick={() => setFilter(f)}>
              {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card"><div className="skeleton h-6 w-48" /></div>)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><p>No tasks found</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task: TaskData) => (
              <div key={task.id} className="card flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${getStatusColor(task.status)}`}>{task.status}</span>
                    <span className={`badge ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                    <span className="text-sm font-medium">{task.title}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {task.assignedToName || task.assignedTo} {task.deadline ? `· Due ${formatDate(task.deadline)}` : ''}
                    {task.deadline && new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' ? ' ⚠️ Overdue' : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  {task.status !== 'COMPLETED' ? (
                    <button className="btn btn-sm btn-primary" onClick={() => updateStatus(task.id, 'COMPLETED')}>Done</button>
                  ) : null}
                  {task.status === 'TODO' && (
                    <button className="btn btn-sm" onClick={() => updateStatus(task.id, 'IN_PROGRESS')}>Start</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function TasksPage() {
  return <AuthProvider><TasksContent /></AuthProvider>;
}
  };

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); loadTasks(id); };

  const filtered = tasks.filter(t => {
    if (filter === 'todo') return t.status === 'TODO';
    if (filter === 'in_progress') return t.status === 'IN_PROGRESS';
    if (filter === 'completed') return t.status === 'COMPLETED';
    if (filter === 'critical') return t.priority === 'CRITICAL';
    if (filter === 'overdue') return t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED';
    return true;
  });