'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

function CreateClubForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [facultyCoordinator, setFacultyCoordinator] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data: any = await api.post('/clubs', { name, description, category, facultyCoordinator });
      if (data.club?.id) {
        router.push(`/dashboard?clubId=${data.club.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="card w-full max-w-lg mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Create a New Club</h1>
          <p className="text-sm text-gray-500 mt-1">You will automatically become the owner</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Club Name *</label>
            <input className="input" placeholder="e.g., Coding Club" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="textarea" placeholder="What is this club about?" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input className="input" placeholder="e.g., Technical, Cultural, Sports" value={category} onChange={e => setCategory(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Faculty Coordinator</label>
            <input className="input" placeholder="Faculty name" value={facultyCoordinator} onChange={e => setFacultyCoordinator(e.target.value)} />
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Club'}
          </button>
          <a href="/dashboard" className="block text-center text-sm text-gray-500 hover:text-gray-700">Cancel</a>
        </form>
      </div>
    </div>
  );
}

export default function CreateClubPage() {
  return <AuthProvider><CreateClubForm /></AuthProvider>;
}