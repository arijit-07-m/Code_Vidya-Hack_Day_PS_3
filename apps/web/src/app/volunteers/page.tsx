'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

function VolunteersContent() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const d: any = await api.get('/clubs/my');
      setClubs(d.clubs || []);
      if (d.clubs?.length > 0) { const id = d.clubs[0].id; setCurrentClubId(id); loadMembers(id); }
    })();
  }, []);

  const loadMembers = async (clubId: string) => {
    try { const d: any = await api.get(`/members/${clubId}/members`); setMembers(d.members || []); }
    catch (e) { console.error(e); }
  };

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); loadMembers(id); };

  return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select'} />}>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">👥 Volunteers & Members</h1>
        {members.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><p>No members yet. Invite members from Settings.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m: any) => (
              <div key={m.id} className="card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {(m.displayName || m.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{m.displayName || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </div>
                </div>
                <span className="badge badge-blue">{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function VolunteersPage() { return <AuthProvider><VolunteersContent /></AuthProvider>; }