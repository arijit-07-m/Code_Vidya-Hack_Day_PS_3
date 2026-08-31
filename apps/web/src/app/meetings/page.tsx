'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

function MeetingsContent() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const d: any = await api.get('/clubs/my');
      setClubs(d.clubs || []);
      if (d.clubs?.length > 0) { const id = d.clubs[0].id; setCurrentClubId(id); loadMeetings(id); }
    })();
  }, []);

  const loadMeetings = async (clubId: string) => {
    setLoading(true);
    try { const d: any = await api.get(`/meetings/clubs/${clubId}`); setMeetings(d.meetings || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); loadMeetings(id); };

  return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select'} />}>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📝 Meetings</h1>
        {loading ? <div className="skeleton h-32" /> : meetings.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><p>No meetings yet</p></div>
        ) : (
          <div className="space-y-3">
            {meetings.map((m: any) => (
              <div key={m.id} className="card">
                <h3 className="font-semibold">{m.title}</h3>
                <p className="text-sm text-gray-500">{m.date ? new Date(m.date).toLocaleDateString() : ''} · {m.participants?.length || 0} participants</p>
                {m.aiProcessed && <span className="badge badge-green mt-2">AI Processed</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function MeetingsPage() { return <AuthProvider><MeetingsContent /></AuthProvider>; }