'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

function DocumentsContent() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);

  useEffect(() => {
    (async () => { const d: any = await api.get('/clubs/my'); setClubs(d.clubs || []); if (d.clubs?.length > 0) setCurrentClubId(d.clubs[0].id); })();
  }, []);

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); };

  return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select'} />}>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📄 Documents</h1>
        <div className="card">
          <p className="text-gray-500 text-center py-8">Upload club documents (PDF, DOCX, TXT) to build the RAG knowledge base.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DocumentsPage() { return <AuthProvider><DocumentsContent /></AuthProvider>; }