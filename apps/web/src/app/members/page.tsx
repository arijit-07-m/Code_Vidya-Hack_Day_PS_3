'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';

const cfg = {
  apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",
  authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",
  projectId: "code-vidya-hack-day-ps-3-6b47d",
};

const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

interface MemberData {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  status: string;
  displayName?: string;
  email?: string;
  joinedAt?: string;
}

export default function MembersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [roleName, setRoleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = '/login';
        return;
      }
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authChecked && user) {
      loadClubs();
    }
  }, [authChecked, user]);

  async function loadClubs() {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'clubMembers'),
        where('userId', '==', user.uid),
        where('status', '==', 'ACTIVE')
      );
      const snapshot = await getDocs(q);
      const rawClubs = await Promise.all(
        snapshot.docs.map(async (d) => {
          const m = d.data() as any;
          const c = await getDoc(doc(db, 'clubs', m.clubId));
          if (!c.exists()) return null;
          return { id: c.id, ...c.data(), membershipRole: m.role };
        })
      );
      const memberClubs: any[] = rawClubs.filter((x): x is any => Boolean(x));

      setClubs(memberClubs);
      if (memberClubs.length > 0 && memberClubs[0]) {
        const firstClub = memberClubs[0];
        setCurrentClubId(firstClub.id);
        setClub(firstClub);
        if (firstClub.membershipRole === 'OWNER') setRoleName('Owner');
        loadMembers(firstClub.id);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function loadMembers(clubId: string) {
    try {
      const ms = await getDocs(
        query(
          collection(db, 'clubMembers'),
          where('clubId', '==', clubId),
          where('status', '==', 'ACTIVE')
        )
      );
      setMembers(ms.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user || !currentClubId) {
      setInviteMsg('Please enter a valid email address.');
      return;
    }
    setInviting(true);
    setInviteMsg('');
    try {
      const uid = 'member_' + Date.now();
      await addDoc(collection(db, 'clubMembers'), {
        clubId: currentClubId,
        userId: uid,
        role: inviteRole,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
        displayName: inviteEmail.split('@')[0],
        email: inviteEmail.trim(),
      });
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'MEMBER_ADDED',
        description: `${inviteEmail} added as ${inviteRole}`,
        createdAt: new Date().toISOString(),
      });
      setInviteMsg('✅ Member added successfully!');
      setInviteEmail('');
      loadMembers(currentClubId);
    } catch (e: any) {
      setInviteMsg('Error: ' + e.message);
    } finally {
      setInviting(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'clubMembers', memberId), { role: newRole });
      if (currentClubId) loadMembers(currentClubId);
    } catch (e) {
      console.error(e);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await updateDoc(doc(db, 'clubMembers', memberId), { status: 'REMOVED' });
      if (currentClubId) loadMembers(currentClubId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (clubId: string) => {
    setCurrentClubId(clubId);
    setClub(clubs.find((x) => x.id === clubId));
    loadMembers(clubId);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clubs={clubs}
        currentClubId={currentClubId || ''}
        userDisplayName={user?.email?.split('@')[0]}
        clubRole={roleName}
        onClubChange={handleClubChange}
        onLogout={handleLogout}
        clubName={club?.name}
      />
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">👥 Members & Roster</h1>

          <div className="card mb-6 animate-fadeIn">
            <h3 className="font-semibold mb-4 text-base">Invite / Add Member</h3>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Email or Username
                </label>
                <input
                  className="input"
                  placeholder="e.g. rahul@college.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Role
                </label>
                <select
                  className="select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="EVENT_HEAD">Event Head</option>
                  <option value="MEMBER">Member</option>
                  <option value="VOLUNTEER">Volunteer</option>
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleInvite}
                disabled={inviting}
              >
                {inviting ? 'Adding...' : 'Add Member'}
              </button>
            </div>
            {inviteMsg && <p className="text-xs text-gray-600 mt-2 font-medium">{inviteMsg}</p>}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="skeleton h-6 w-48" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p className="empty-state-title">No members in this club</p>
              <p className="empty-state-text">Invite your team above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="card flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                      {(m.displayName || m.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {m.displayName || m.email?.split('@')[0] || 'Unknown Member'}
                      </p>
                      <p className="text-xs text-gray-500">{m.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${
                        m.role === 'OWNER'
                          ? 'badge-red'
                          : m.role === 'ADMIN'
                          ? 'badge-blue'
                          : m.role === 'EVENT_HEAD'
                          ? 'badge-yellow'
                          : 'badge-gray'
                      }`}
                    >
                      {m.role || 'Member'}
                    </span>
                    <button
                      className="btn btn-sm bg-white border border-gray-200"
                      onClick={() => setSelectedMember(m)}
                    >
                      Manage
                    </button>
                    {m.role !== 'OWNER' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeMember(m.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Manage Role Dialog */}
          {selectedMember && (
            <div
              className="modal-overlay"
              onClick={() => setSelectedMember(null)}
            >
              <div
                className="modal-content animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold mb-2">Manage Member Access</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedMember.displayName || selectedMember.email || 'Member'}
                </p>
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Club Role
                  </label>
                  <select
                    className="select"
                    value={selectedMember.role || 'MEMBER'}
                    onChange={async (e) => {
                      await updateMemberRole(selectedMember.id, e.target.value);
                      setSelectedMember(null);
                    }}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="EVENT_HEAD">Event Head</option>
                    <option value="MEMBER">Member</option>
                    <option value="VOLUNTEER">Volunteer</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Updating role adjusts the member&apos;s permissions for this club.
                </p>
                <button
                  className="btn w-full bg-gray-100"
                  onClick={() => setSelectedMember(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
