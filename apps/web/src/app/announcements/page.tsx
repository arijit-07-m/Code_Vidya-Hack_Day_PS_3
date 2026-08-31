'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

function AnnouncementsContent() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    (async () => { const d: any = await api.get('/clubs/my'); setClubs(d.clubs || []); if (d.clubs?.length > 0) setCurrentClubId(d.clubs[0].id); })();
  }, []);

  const createAnnouncement = async () => {
    try { await api.post('/announcements', { clubId: currentClubId, title, content }); setTitle(''); setContent(''); }
    catch (e) { console.error(e); }
  };

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); };

  return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select'} />}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📢 Announcements</h1>
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Create Announcement</h3>
          <div className="space-y-3">
            <input className="input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <textarea className="textarea" placeholder="Announcement content..." value={content} onChange={e => setContent(e.target.value)} rows={4} />
            <button className="btn btn-primary" onClick={createAnnouncement}>Create</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AnnouncementsPage() { return <AuthProvider><AnnouncementsContent /></AuthProvider>; }