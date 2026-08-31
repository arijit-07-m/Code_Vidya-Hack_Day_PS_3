'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

function SettingsContent() {
  const { logout, profile } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  useEffect(() => {
    (async () => { const d: any = await api.get('/clubs/my'); setClubs(d.clubs || []); if (d.clubs?.length > 0) { const id = d.clubs[0].id; setCurrentClubId(id); loadMembers(id); } })();
  }, []);

  const loadMembers = async (clubId: string) => {
    try { const d: any = await api.get(`/members/${clubId}/members`); setMembers(d.members || []); }
    catch (e) { console.error(e); }
  };

  const inviteMember = async () => {
    try { await api.post(`/members/${currentClubId}/members/invite`, { email: inviteEmail, role: inviteRole }); setInviteEmail(''); if (currentClubId) loadMembers(currentClubId); }
    catch (e: any) { alert(e.message); }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/members/${currentClubId}/members/${memberId}`); if (currentClubId) loadMembers(currentClubId); }
    catch (e: any) { alert(e.message); }
  };

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); loadMembers(id); };

  return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select'} />}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Invite Member</h3>
          <div className="flex gap-3">
            <input className="input flex-1" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            <select className="input w-36" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="MEMBER">Member</option><option value="VOLUNTEER">Volunteer</option><option value="EVENT_HEAD">Event Head</option><option value="ADMIN">Admin</option>
            </select>
            <button className="btn btn-primary" onClick={inviteMember}>Invite</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">Members</h2></div>
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium">{m.displayName || m.email || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{m.email} · {m.role}</p>
              </div>
              <div className="flex gap-2">
                <span className={`badge ${m.role === 'OWNER' ? 'badge-red' : m.role === 'ADMIN' ? 'badge-blue' : 'badge-gray'}`}>{m.role}</span>
                {m.role !== 'OWNER' && <button className="btn btn-sm btn-danger" onClick={() => removeMember(m.id)}>Remove</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SettingsPage() { return <AuthProvider><SettingsContent /></AuthProvider>; }