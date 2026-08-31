'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

function AIContent() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const d: any = await api.get('/clubs/my');
      setClubs(d.clubs || []);
      if (d.clubs?.length > 0) setCurrentClubId(d.clubs[0].id);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!command.trim()) return;
    setLoading(true);
    setResponse('Processing...');
    // Simulated AI response for demo
    setTimeout(() => {
      setResponse(`🤖 I understood your request: "${command}"\n\nIn production, this would be processed by the AI Agent which would:\n1. Detect the intent\n2. Select the appropriate tool\n3. Validate permissions\n4. Execute the action\n5. Return the result`);
      setLoading(false);
    }, 1500);
  };

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); };

  return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select'} />}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">🤖 AI Assistant</h1>
        <p className="text-gray-500 mb-6">Natural language commands for your club operations</p>

        <div className="card mb-6">
          <textarea className="textarea mb-3" placeholder='e.g., "Create a high priority task for Rahul to arrange 5 microphones by tomorrow"' value={command} onChange={e => setCommand(e.target.value)} rows={3} />
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !command.trim()}>
            {loading ? 'Processing...' : 'Send Command'}
          </button>
        </div>

        {response && (
          <div className="card bg-blue-50 border-blue-200">
            <pre className="text-sm whitespace-pre-wrap">{response}</pre>
          </div>
        )}

        <div className="card mt-6">
          <h3 className="font-semibold mb-3">💡 Example Commands</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>"Create a task for Rahul to arrange the projector"</li>
            <li>"Mark the projector task as completed"</li>
            <li>"What are today's urgent tasks?"</li>
            <li>"Who is overloaded?"</li>
            <li>"What risks exist for Hack Day?"</li>
            <li>"Show me everything due tomorrow"</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AIPage() { return <AuthProvider><AIContent /></AuthProvider>; }