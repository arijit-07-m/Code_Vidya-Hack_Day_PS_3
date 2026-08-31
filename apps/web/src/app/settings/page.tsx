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
  deleteDoc,
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

const PERMISSION_GROUPS: [string, string[]][] = [
  ['Club', ['VIEW_CLUB', 'EDIT_CLUB']],
  ['Members', ['VIEW_MEMBERS', 'INVITE_MEMBERS', 'REMOVE_MEMBERS', 'MANAGE_MEMBER_ROLES', 'MANAGE_MEMBER_PERMISSIONS']],
  ['Events', ['VIEW_EVENTS', 'CREATE_EVENTS', 'EDIT_EVENTS', 'DELETE_EVENTS', 'MANAGE_EVENTS']],
  ['Tasks', ['VIEW_TASKS', 'CREATE_TASKS', 'EDIT_TASKS', 'DELETE_TASKS', 'ASSIGN_TASKS', 'MANAGE_TASKS']],
  ['Volunteers', ['VIEW_VOLUNTEERS', 'MANAGE_VOLUNTEERS', 'ASSIGN_VOLUNTEERS']],
  ['Meetings', ['VIEW_MEETINGS', 'CREATE_MEETINGS', 'EDIT_MEETINGS', 'DELETE_MEETINGS', 'MANAGE_MEETINGS']],
  ['Documents', ['VIEW_DOCUMENTS', 'UPLOAD_DOCUMENTS', 'DELETE_DOCUMENTS', 'MANAGE_DOCUMENTS']],
  ['Risks', ['VIEW_RISKS', 'CREATE_RISKS', 'MANAGE_RISKS', 'RESOLVE_RISKS']],
  ['Announcements', ['VIEW_ANNOUNCEMENTS', 'CREATE_ANNOUNCEMENTS', 'EDIT_ANNOUNCEMENTS', 'PUBLISH_ANNOUNCEMENTS', 'DELETE_ANNOUNCEMENTS']],
  ['AI', ['USE_AI', 'ANALYZE_MEETINGS', 'USE_AI_ACTIONS', 'RUN_RISK_ANALYSIS', 'MANAGE_KNOWLEDGE_BASE']],
  ['Analytics', ['VIEW_ANALYTICS']],
  ['Administration', ['MANAGE_CLUB_SETTINGS', 'MANAGE_ROLES', 'TRANSFER_OWNERSHIP']],
];

const formatPermName = (p: string) =>
  p
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [currentClubId, setCurrentClubId] = useState<string | null>(null);
  const [club, setClub] = useState<any>(null);
  const [tab, setTab] = useState<'members' | 'roles' | 'ownership'>('members');
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [roleName, setRoleName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviting, setInviting] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] });
  const [editingRole, setEditingRole] = useState<any>(null);

  // Ownership transfer
  const [newOwnerId, setNewOwnerId] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [ownerMsg, setOwnerMsg] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = '/login';
        return;
      }
      setUser(u);
      setChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (checked && user) {
      loadClubs();
    }
  }, [checked, user]);

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
        loadMembers(firstClub.id);
        loadRoles(firstClub.id);
        if (firstClub.membershipRole === 'OWNER') setRoleName('Owner');
      }
    } catch (e) {
      console.error(e);
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
      setMembers(ms.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  }

  async function loadRoles(clubId: string) {
    try {
      const rs = await getDocs(query(collection(db, 'roles'), where('clubId', '==', clubId)));
      setRoles(rs.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user || !currentClubId) {
      setInviteMsg('Enter a valid email');
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
        description: `+${inviteEmail} added as ${inviteRole}`,
        createdAt: new Date().toISOString(),
      });
      setInviteMsg('Added!');
      setInviteEmail('');
      loadMembers(currentClubId);
    } catch (e: any) {
      setInviteMsg('Error: ' + e.message);
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (mid: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await updateDoc(doc(db, 'clubMembers', mid), { status: 'REMOVED' });
      if (currentClubId) loadMembers(currentClubId);
    } catch (e) {
      console.error(e);
    }
  };

  const createRole = async () => {
    if (!roleForm.name.trim() || !currentClubId || !user) return;
    try {
      await addDoc(collection(db, 'roles'), {
        clubId: currentClubId,
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        isSystemRole: false,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      });
      setRoleForm({ name: '', description: '', permissions: [] });
      setEditingRole(null);
      loadRoles(currentClubId);
    } catch (e) {
      console.error(e);
    }
  };

  const saveRole = async () => {
    if (!editingRole || !roleForm.name.trim() || !currentClubId) return;
    try {
      await updateDoc(doc(db, 'roles', editingRole.id), {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
      });
      setRoleForm({ name: '', description: '', permissions: [] });
      setEditingRole(null);
      loadRoles(currentClubId);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try {
      await deleteDoc(doc(db, 'roles', id));
      if (currentClubId) loadRoles(currentClubId);
    } catch (e) {
      console.error(e);
    }
  };

  const togglePermission = (p: string) => {
    const arr = roleForm.permissions;
    if (arr.includes(p)) {
      setRoleForm({ ...roleForm, permissions: arr.filter((x) => x !== p) });
    } else {
      setRoleForm({ ...roleForm, permissions: [...arr, p] });
    }
  };

  const transferOwnership = async () => {
    if (!newOwnerId) {
      setOwnerMsg('Select a new owner');
      return;
    }
    if (confirmText !== 'TRANSFER') {
      setOwnerMsg('Type TRANSFER in capital letters to confirm');
      return;
    }
    if (!currentClubId || !user) return;

    const target = members.find((x) => x.id === newOwnerId);
    const current = members.find((x) => x.userId === user.uid);
    if (!target || !current) {
      setOwnerMsg('Target member not found');
      return;
    }

    setTransferring(true);
    setOwnerMsg('');
    try {
      await updateDoc(doc(db, 'clubs', currentClubId), {
        ownerId: target.userId,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'clubMembers', target.id), { role: 'OWNER' });
      await updateDoc(doc(db, 'clubMembers', current.id), { role: 'ADMIN' });
      await addDoc(collection(db, 'activityLogs'), {
        clubId: currentClubId,
        userId: user.uid,
        userName: user.email,
        action: 'OWNERSHIP_TRANSFERRED',
        description: `Ownership of club transferred to ${target.displayName || target.email}`,
        createdAt: new Date().toISOString(),
      });
      setOwnerMsg('✅ Ownership transferred successfully!');
      setNewOwnerId('');
      setConfirmText('');
      loadMembers(currentClubId);
    } catch (e: any) {
      setOwnerMsg('Error: ' + e.message);
    } finally {
      setTransferring(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const handleClubChange = (id: string) => {
    setCurrentClubId(id);
    const selected = clubs.find((x) => x.id === id);
    setClub(selected);
    loadMembers(id);
    loadRoles(id);
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
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">⚙️ Settings & Administration</h1>

          <div className="tabs mb-6">
            <button
              className={'tab' + (tab === 'members' ? ' active' : '')}
              onClick={() => setTab('members')}
            >
              Members
            </button>
            <button
              className={'tab' + (tab === 'roles' ? ' active' : '')}
              onClick={() => setTab('roles')}
            >
              Roles & Permissions
            </button>
            {roleName === 'Owner' && (
              <button
                className={'tab' + (tab === 'ownership' ? ' active' : '')}
                onClick={() => setTab('ownership')}
              >
                Transfer Ownership
              </button>
            )}
          </div>

          {tab === 'members' && (
            <div>
              <div className="card mb-6">
                <h3 className="font-semibold mb-4 text-base">Invite Member</h3>
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <input
                      className="input"
                      placeholder="Email or name"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <select
                    className="select w-36"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="EVENT_HEAD">Event Head</option>
                    <option value="MEMBER">Member</option>
                    <option value="VOLUNTEER">Volunteer</option>
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={handleInvite}
                    disabled={inviting}
                  >
                    {inviting ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
                {inviteMsg && <p className="text-xs text-gray-600 mt-2">{inviteMsg}</p>}
              </div>

              <div className="space-y-2">
                {members.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No members yet.</p>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="card flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-medium text-indigo-600">
                          {(m.displayName || m.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {m.displayName || m.email || 'User'}
                          </p>
                          <p className="text-xs text-gray-500">{m.email || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            'badge ' +
                            (m.role === 'OWNER'
                              ? 'badge-red'
                              : m.role === 'ADMIN'
                              ? 'badge-blue'
                              : m.role === 'EVENT_HEAD'
                              ? 'badge-yellow'
                              : 'badge-gray')
                          }
                        >
                          {m.role || 'Member'}
                        </span>
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
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'roles' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Create custom roles with granular permissions
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingRole({ new: true });
                    setRoleForm({ name: '', description: '', permissions: [] });
                  }}
                >
                  + Create Role
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <p className="font-semibold text-sm">👑 Owner</p>
                  <p className="text-xs text-gray-500">Full access to all operations & transfers</p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <p className="font-semibold text-sm">🛡️ Admin</p>
                  <p className="text-xs text-gray-500">Club management and task assignments</p>
                </div>
              </div>

              {roles.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No custom roles yet.</p>
              ) : (
                roles.map((r) => (
                  <div
                    key={r.id}
                    className="card mb-2 flex items-center justify-between p-3"
                  >
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.description || ''}</p>
                      <p className="text-xs text-indigo-600 mt-1">
                        {r.permissions?.length || 0} permissions granted
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm bg-white border border-gray-200"
                        onClick={() => {
                          setEditingRole(r);
                          setRoleForm({
                            name: r.name,
                            description: r.description || '',
                            permissions: r.permissions || [],
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteRole(r.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}

              {editingRole !== null && (
                <div
                  className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                  onClick={() => setEditingRole(null)}
                >
                  <div
                    className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 className="text-lg font-bold mb-3">
                      {editingRole.new ? 'Create Custom Role' : 'Edit Role'}
                    </h2>
                    <input
                      className="input mb-2"
                      placeholder="Role name (e.g. Lead Coordinator)"
                      value={roleForm.name}
                      onChange={(e) =>
                        setRoleForm({ ...roleForm, name: e.target.value })
                      }
                    />
                    <input
                      className="input mb-4"
                      placeholder="Short description"
                      value={roleForm.description}
                      onChange={(e) =>
                        setRoleForm({ ...roleForm, description: e.target.value })
                      }
                    />

                    <div className="space-y-4 mb-4">
                      {PERMISSION_GROUPS.map(([groupName, perms], j) => (
                        <div key={j} className="border-t pt-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                            {groupName}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {perms.map((pm, i) => (
                              <label
                                key={i}
                                className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={roleForm.permissions.includes(pm)}
                                  onChange={() => togglePermission(pm)}
                                  className="rounded text-indigo-600"
                                />
                                <span className="text-gray-700">{formatPermName(pm)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="btn btn-primary flex-1"
                        onClick={editingRole.new ? createRole : saveRole}
                      >
                        {editingRole.new ? 'Create Role' : 'Save Changes'}
                      </button>
                      <button
                        className="btn flex-1 bg-gray-100"
                        onClick={() => setEditingRole(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'ownership' && (
            <div className="card">
              <h2 className="font-bold text-lg mb-2">👑 Transfer Club Ownership</h2>
              <p className="text-sm text-gray-600 mb-4">
                Current Owner: <strong>{user?.email?.split('@')[0]}</strong>
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Select New Owner
                  </label>
                  <select
                    className="select"
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                  >
                    <option value="">Choose a club member...</option>
                    {members
                      .filter((m) => m.role !== 'OWNER')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName || m.email}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  ⚠️ <strong>Important Notice:</strong> The selected member will become the primary Owner. Your role will change to Admin. This action is irreversible.
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Type <strong>TRANSFER</strong> to confirm
                  </label>
                  <input
                    className="input"
                    placeholder="TRANSFER"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-danger w-full"
                  onClick={transferOwnership}
                  disabled={transferring || confirmText !== 'TRANSFER'}
                >
                  {transferring ? 'Transferring...' : 'Transfer Ownership'}
                </button>
                {ownerMsg && <p className="text-xs font-semibold mt-2">{ownerMsg}</p>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
