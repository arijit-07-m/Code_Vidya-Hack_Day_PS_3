'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

function RisksContent() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const d: any = await api.get('/clubs/my');
      setClubs(d.clubs || []);
      if (d.clubs?.length > 0) { const id = d.clubs[0].id; setCurrentClubId(id); loadRisks(id); }
    })();
  }, []);

  const loadRisks = async (clubId: string) => {
    try { const d: any = await api.get(`/tasks/clubs/${clubId}`); setRisks([]); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); loadRisks(id); };

  const severityClass = (s: string) => s === 'CRITICAL' ? 'badge-red' : s === 'HIGH' ? 'badge-yellow' : s === 'MEDIUM' ? 'badge-blue' : 'badge-gray';

  return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select'} />}>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">⚠️ Risks</h1>
        {loading ? <div className="skeleton h-32" /> : risks.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No risks detected</p>
            <p className="text-sm mt-1">Run AI risk analysis from the event page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {risks.map((r: any) => (
              <div key={r.id} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${severityClass(r.severity)}`}>{r.severity}</span>
                  <h3 className="font-semibold">{r.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{r.description}</p>
                {r.why && <p className="text-sm text-gray-500 mb-1">📌 {r.why}</p>}
                {r.recommendation && <p className="text-sm text-blue-600">💡 {r.recommendation}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function RisksPage() { return <AuthProvider><RisksContent /></AuthProvider>; }