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
import { PERMISSION_GROUPS } from '@/lib/permissions/groups';
import type { Permission } from '@/lib/permissions/types';

const cfg = {
  apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",
  authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",
  projectId: "code-vidya-hack-day-ps-3-6b47d",
};

const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    'VIEW_CLUB', 'EDIT_CLUB',
    'VIEW_MEMBERS', 'INVITE_MEMBERS', 'REMOVE_MEMBERS', 'MANAGE_MEMBER_ROLES', 'MANAGE_MEMBER_PERMISSIONS',
    'VIEW_EVENTS', 'CREATE_EVENTS', 'EDIT_EVENTS', 'DELETE_EVENTS', 'MANAGE_EVENTS',
    'VIEW_TASKS', 'CREATE_TASKS', 'EDIT_TASKS', 'DELETE_TASKS', 'ASSIGN_TASKS', 'MANAGE_TASKS',
    'VIEW_VOLUNTEERS', 'MANAGE_VOLUNTEERS', 'ASSIGN_VOLUNTEERS',
    'VIEW_MEETINGS', 'CREATE_MEETINGS', 'EDIT_MEETINGS', 'DELETE_MEETINGS', 'MANAGE_MEETINGS',
    'VIEW_DOCUMENTS', 'UPLOAD_DOCUMENTS', 'DELETE_DOCUMENTS', 'MANAGE_DOCUMENTS',
    'VIEW_RISKS', 'CREATE_RISKS', 'MANAGE_RISKS', 'RESOLVE_RISKS',
    'VIEW_ANNOUNCEMENTS', 'CREATE_ANNOUNCEMENTS', 'EDIT_ANNOUNCEMENTS', 'PUBLISH_ANNOUNCEMENTS', 'DELETE_ANNOUNCEMENTS',
    'USE_AI', 'ANALYZE_MEETINGS', 'USE_AI_ACTIONS', 'RUN_RISK_ANALYSIS', 'MANAGE_KNOWLEDGE_BASE',
    'VIEW_ANALYTICS', 'MANAGE_CLUB_SETTINGS', 'MANAGE_ROLES', 'TRANSFER_OWNERSHIP',
  ],
  ADMIN: [
    'VIEW_CLUB', 'EDIT_CLUB',
    'VIEW_MEMBERS', 'INVITE_MEMBERS', 'REMOVE_MEMBERS', 'MANAGE_MEMBER_ROLES', 'MANAGE_MEMBER_PERMISSIONS',
    'VIEW_EVENTS', 'CREATE_EVENTS', 'EDIT_EVENTS', 'DELETE_EVENTS', 'MANAGE_EVENTS',
    'VIEW_TASKS', 'CREATE_TASKS', 'EDIT_TASKS', 'DELETE_TASKS', 'ASSIGN_TASKS', 'MANAGE_TASKS',
    'VIEW_VOLUNTEERS', 'MANAGE_VOLUNTEERS', 'ASSIGN_VOLUNTEERS',
    'VIEW_MEETINGS', 'CREATE_MEETINGS', 'EDIT_MEETINGS', 'DELETE_MEETINGS', 'MANAGE_MEETINGS',
    'VIEW_DOCUMENTS', 'UPLOAD_DOCUMENTS', 'DELETE_DOCUMENTS', 'MANAGE_DOCUMENTS',
    'VIEW_RISKS', 'CREATE_RISKS', 'MANAGE_RISKS', 'RESOLVE_RISKS',
    'VIEW_ANNOUNCEMENTS', 'CREATE_ANNOUNCEMENTS', 'EDIT_ANNOUNCEMENTS', 'PUBLISH_ANNOUNCEMENTS', 'DELETE_ANNOUNCEMENTS',
    'USE_AI', 'ANALYZE_MEETINGS', 'USE_AI_ACTIONS', 'RUN_RISK_ANALYSIS', 'MANAGE_KNOWLEDGE_BASE',
    'VIEW_ANALYTICS', 'MANAGE_CLUB_SETTINGS', 'MANAGE_ROLES',
  ],
  EVENT_MANAGER: [
    'VIEW_EVENTS', 'CREATE_EVENTS', 'EDIT_EVENTS', 'MANAGE_EVENTS',
    'VIEW_TASKS', 'CREATE_TASKS', 'EDIT_TASKS', 'ASSIGN_TASKS', 'MANAGE_TASKS',
    'VIEW_VOLUNTEERS', 'MANAGE_VOLUNTEERS', 'ASSIGN_VOLUNTEERS',
    'VIEW_MEETINGS', 'CREATE_MEETINGS', 'VIEW_DOCUMENTS', 'USE_AI', 'USE_AI_ACTIONS',
  ],
  CONTENT_MANAGER: [
    'VIEW_ANNOUNCEMENTS', 'CREATE_ANNOUNCEMENTS', 'EDIT_ANNOUNCEMENTS', 'PUBLISH_ANNOUNCEMENTS',
    'VIEW_DOCUMENTS', 'UPLOAD_DOCUMENTS', 'MANAGE_DOCUMENTS',
    'VIEW_EVENTS', 'VIEW_TASKS', 'USE_AI',
  ],
  VOLUNTEER_COORDINATOR: [
    'VIEW_VOLUNTEERS', 'MANAGE_VOLUNTEERS', 'ASSIGN_VOLUNTEERS',
    'VIEW_TASKS', 'CREATE_TASKS', 'ASSIGN_TASKS',
    'VIEW_MEMBERS', 'VIEW_EVENTS', 'USE_AI',
  ],
  MEETING_MANAGER: [
    'VIEW_MEETINGS', 'CREATE_MEETINGS', 'EDIT_MEETINGS', 'MANAGE_MEETINGS', 'ANALYZE_MEETINGS',
    'VIEW_TASKS', 'CREATE_TASKS', 'USE_AI',
  ],
  MEMBER: [
    'VIEW_CLUB', 'VIEW_EVENTS', 'VIEW_TASKS', 'VIEW_MEMBERS',
    'VIEW_MEETINGS', 'VIEW_DOCUMENTS', 'VIEW_ANNOUNCEMENTS', 'USE_AI',
  ],
  VOLUNTEER: [
    'VIEW_TASKS', 'VIEW_EVENTS', 'USE_AI',
  ],
};

interface MemberData {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  status: string;
  displayName?: string;
  email?: string;
  customPermissions?: string[];
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

  // Invite member form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviting, setInviting] = useState(false);

  // Manage Access Modal
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [editingRole, setEditingRole] = useState('');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);

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
      const name = inviteName.trim() || inviteEmail.split('@')[0];
      await addDoc(collection(db, 'clubMembers'), {
        clubId: currentClubId,
        userId: uid,
        role: inviteRole,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
        displayName: name,
        email: inviteEmail.trim(),
        customPermissions: [],
      });
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'MEMBER_ADDED',
        description: `${name} (${inviteEmail}) added as ${inviteRole.replace('_', ' ')}`,
        createdAt: new Date().toISOString(),
      });
      setInviteMsg('✅ Member added successfully!');
      setInviteEmail('');
      setInviteName('');
      loadMembers(currentClubId);
    } catch (e: any) {
      setInviteMsg('Error: ' + e.message);
    } finally {
      setInviting(false);
    }
  };

  const openManageAccess = (member: MemberData) => {
    setSelectedMember(member);
    setEditingRole(member.role || 'MEMBER');
    setCustomPermissions(member.customPermissions || []);
  };

  const toggleCustomPermission = (p: string) => {
    if (customPermissions.includes(p)) {
      setCustomPermissions((prev) => prev.filter((x) => x !== p));
    } else {
      setCustomPermissions((prev) => [...prev, p]);
    }
  };

  const handleSaveAccess = async () => {
    if (!selectedMember || !currentClubId || !user) return;
    setSavingAccess(true);
    try {
      await updateDoc(doc(db, 'clubMembers', selectedMember.id), {
        role: editingRole,
        customPermissions,
        updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'PERMISSION_CHANGED',
        description: `Updated access permissions for ${selectedMember.displayName || selectedMember.email}`,
        createdAt: new Date().toISOString(),
      });
      setSelectedMember(null);
      loadMembers(currentClubId);
    } catch (e: any) {
      alert('Error updating member access: ' + e.message);
    } finally {
      setSavingAccess(false);
    }
  };

  const removeMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this club?`)) return;
    if (!currentClubId || !user) return;
    try {
      await updateDoc(doc(db, 'clubMembers', memberId), { status: 'REMOVED' });
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'MEMBER_REMOVED',
        description: `${name} removed from club`,
        createdAt: new Date().toISOString(),
      });
      loadMembers(currentClubId);
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

  const formatRoleLabel = (r: string) => {
    switch (r) {
      case 'OWNER': return '👑 Owner';
      case 'ADMIN': return '🛡️ Admin';
      case 'EVENT_MANAGER': return '📅 Event Manager';
      case 'CONTENT_MANAGER': return '📢 Content Manager';
      case 'VOLUNTEER_COORDINATOR': return '🤝 Volunteer Coordinator';
      case 'MEETING_MANAGER': return '📝 Meeting Manager';
      case 'MEMBER': return '👤 Member';
      case 'VOLUNTEER': return '🧑 Volunteer';
      default: return r.replace('_', ' ');
    }
  };

  const formatPermName = (p: string) =>
    p.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

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
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">👥 Members & Access Control</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage club roster, assign custom management roles, and configure granular permissions
            </p>
          </div>

          {/* Invite Member Card */}
          <div className="card mb-6 animate-fadeIn">
            <h3 className="font-semibold mb-4 text-base">Invite / Add Club Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Full Name
                </label>
                <input
                  className="input"
                  placeholder="e.g. Aman Kumar"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Email Address *
                </label>
                <input
                  className="input"
                  placeholder="e.g. aman@college.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Assigned Role
                </label>
                <select
                  className="select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="ADMIN">🛡️ Admin</option>
                  <option value="EVENT_MANAGER">📅 Event Manager</option>
                  <option value="CONTENT_MANAGER">📢 Content Manager</option>
                  <option value="VOLUNTEER_COORDINATOR">🤝 Volunteer Coordinator</option>
                  <option value="MEETING_MANAGER">📝 Meeting Manager</option>
                  <option value="MEMBER">👤 Member</option>
                  <option value="VOLUNTEER">🧑 Volunteer</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <button
                className="btn btn-primary btn-sm px-6"
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? 'Adding Member...' : '+ Add Member'}
              </button>
              {inviteMsg && <p className="text-xs text-green-700 font-medium">{inviteMsg}</p>}
            </div>
          </div>

          {/* Members Table / Card List */}
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
              <p className="empty-state-title">No members found</p>
              <p className="empty-state-text">Add your team members above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((m) => {
                const rolePerms = DEFAULT_ROLE_PERMISSIONS[m.role] || DEFAULT_ROLE_PERMISSIONS.MEMBER;
                const totalPerms = (rolePerms.length || 0) + (m.customPermissions?.length || 0);

                return (
                  <div
                    key={m.id}
                    className="card flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700">
                        {(m.displayName || m.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900">
                            {m.displayName || m.email?.split('@')[0] || 'Unknown Member'}
                          </p>
                          <span className="badge badge-gray text-[10px]">
                            {formatRoleLabel(m.role)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{m.email || ''}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          🔑 {totalPerms} active permissions {m.customPermissions && m.customPermissions.length > 0 && `(${m.customPermissions.length} overrides)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openManageAccess(m)}
                      >
                        Manage Access
                      </button>
                      {m.role !== 'OWNER' && (
                        <button
                          className="btn btn-sm text-red-500 hover:bg-red-50"
                          onClick={() => removeMember(m.id, m.displayName || m.email || 'Member')}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Member Access Screen / Modal */}
          {selectedMember && (
            <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
              <div
                className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Member Access & Permissions
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedMember.displayName || selectedMember.email} ({selectedMember.email})
                    </p>
                  </div>
                  <span className="badge badge-blue">
                    {formatRoleLabel(editingRole)}
                  </span>
                </div>

                {/* Role Switcher */}
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Management Role
                  </label>
                  <select
                    className="select text-sm font-medium"
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                  >
                    <option value="OWNER">👑 Owner (Full System Access)</option>
                    <option value="ADMIN">🛡️ Admin (Club Manager)</option>
                    <option value="EVENT_MANAGER">📅 Event Manager</option>
                    <option value="CONTENT_MANAGER">📢 Content Manager</option>
                    <option value="VOLUNTEER_COORDINATOR">🤝 Volunteer Coordinator</option>
                    <option value="MEETING_MANAGER">📝 Meeting Manager</option>
                    <option value="MEMBER">👤 Member</option>
                    <option value="VOLUNTEER">🧑 Volunteer</option>
                  </select>
                </div>

                {/* Granular Permission Checklist */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Effective Permissions
                    </h4>
                    <span className="text-[11px] text-gray-400">
                      ✓ Inherited from role · ⚡ Custom Override
                    </span>
                  </div>

                  <div className="space-y-4 max-h-72 overflow-y-auto pr-2 border rounded-xl p-3 bg-gray-50/50">
                    {PERMISSION_GROUPS.map((group, idx) => {
                      const basePerms = DEFAULT_ROLE_PERMISSIONS[editingRole] || [];
                      return (
                        <div key={idx} className="border-b border-gray-200/60 pb-3 last:border-0 last:pb-0">
                          <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
                            {group.label}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {group.permissions.map((perm) => {
                              const isInherited = basePerms.includes(perm);
                              const isCustom = customPermissions.includes(perm);
                              const isGranted = isInherited || isCustom;

                              return (
                                <label
                                  key={perm}
                                  className={`flex items-center justify-between text-xs p-2 rounded-lg border transition-colors cursor-pointer ${
                                    isGranted
                                      ? 'bg-white border-indigo-200 text-gray-900 font-medium'
                                      : 'bg-transparent border-gray-200 text-gray-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isGranted}
                                      disabled={isInherited}
                                      onChange={() => toggleCustomPermission(perm)}
                                      className="rounded text-indigo-600"
                                    />
                                    <span>{formatPermName(perm)}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    {isInherited ? 'Role' : isCustom ? '⚡ Custom' : ''}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn btn-primary flex-1"
                    onClick={handleSaveAccess}
                    disabled={savingAccess}
                  >
                    {savingAccess ? 'Saving Access...' : 'Save Permissions'}
                  </button>
                  <button
                    className="btn flex-1 bg-gray-100"
                    onClick={() => setSelectedMember(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
