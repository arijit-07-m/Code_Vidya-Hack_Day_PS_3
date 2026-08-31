'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface EventData { id: string; eventName: string; date: string; venue: string; status: string; description: string; }
interface ClubInfo { id: string; name: string; membershipRole: string; }

function EventsContent() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState({ eventName: '', date: '', venue: '', description: '', format: 'INTERNAL' });

  useEffect(() => {
    const d: any = null; // placeholder
    (async () => {
      try {
        const d: any = await api.get('/clubs/my');
        setClubs(d.clubs || []);
        if (d.clubs?.length > 0) {
          const id = d.clubs[0].id;
          setCurrentClubId(id);
          loadEvents(id);
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  const loadEvents = async (clubId: string) => {
    setLoading(true);
    try {
      const d: any = await api.get(`/events/clubs/${clubId}`);
      setEvents(d.events || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const createEvent = async () => {
    try {
      await api.post('/events', { ...newEvent, clubId: currentClubId });
      setShowCreate(false);
      setNewEvent({ eventName: '', date: '', venue: '', description: '', format: 'INTERNAL' });
      if (currentClubId) loadEvents(currentClubId);
    } catch (e) { console.error(e); }
  };

  const hLogout = async () => { await logout(); };
  const hClubChange = (id: string) => { setCurrentClubId(id); loadEvents(id); };

  return (
    <DashboardLayout sidebar={<Sidebar clubs={clubs} currentClubId={currentClubId || ''} onClubChange={hClubChange} onLogout={hLogout} clubName={clubs.find(c => c.id === currentClubId)?.name || 'Select Club'} />}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">📅 Events</h1>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ New Event'}</button>
        </div>

        {showCreate && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">New Event</h3>
            <div className="space-y-3">
              <input className="input" placeholder="Event name" value={newEvent.eventName} onChange={e => setNewEvent({...newEvent, eventName: e.target.value})} />
              <input className="input" type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
              <input className="input" placeholder="Venue" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
              <textarea className="textarea" placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
              <button className="btn btn-primary" onClick={createEvent}>Create Event</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card"><div className="skeleton h-6 w-48 mb-2" /><div className="skeleton h-4 w-32" /></div>)}</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">No events yet</p>
            <p className="text-sm">Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event: EventData) => (
              <div key={event.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{event.eventName}</h3>
                  <span className={`badge ${
                    event.status === 'ACTIVE' ? 'badge-green' :
                    event.status === 'PLANNING' ? 'badge-blue' :
                    event.status === 'COMPLETED' ? 'badge-gray' : 'badge-red'
                  }`}>{event.status}</span>
                </div>
                {event.date && <p className="text-sm text-gray-500 mb-1">📅 {new Date(event.date).toLocaleDateString()}</p>}
                {event.venue && <p className="text-sm text-gray-500">📍 {event.venue}</p>}
                {event.description && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{event.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EventsPage() {
  return <AuthProvider><EventsContent /></AuthProvider>;
}