'use client';
import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';
const cfg = { apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro", authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com", projectId: "code-vidya-hack-day-ps-3-6b47d" };
const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);
const pG = [
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
const pretty = (p: string) => p.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());

export default function SettingsPage() {
  const [user, su] = useState<any>(null);
  const [checked, sc] = useState(false);
  const [clubs, scl] = useState<any[]>([]);
  const [cid, scid] = useState<string | null>(null);
  const [club, sclub] = useState<any>(null);
  const [tab, st] = useState('members');
  const [members, sm] = useState<any[]>([]);
  const [roles, sr] = useState<any[]>([]);
  const [rn, srn] = useState('');
  const [ie, setIE] = useState('');
  const [ir, setIR] = useState('MEMBER');
  const [imsg, setMsg] = useState('');
  const [inv, setInv] = useState(false);
  const [rf, setRF] = useState({ name: '', description: '', permissions: [] as string[] });
  const [er, setER] = useState<any>(null);
  useEffect(() => { const un = onAuthStateChanged(auth, (u: any) => { if (!u) { window.location.href = '/login'; return; } su(u); sc(true); }); return () => un(); }, []);
  useEffect(() => { if (checked) L(); }, [checked]);

  async function L() {
    try {
      const q = query(collection(db, 'clubMembers'), where('userId', '==', user.uid), where('status', '==', 'ACTIVE'));
      const sn = await getDocs(q);
      const mc = (await Promise.all(sn.docs.map(async (d: any) => {
        const m = d.data(); const c = await getDoc(doc(db, 'clubs', m.clubId));
        if (!c.exists()) return null; return { id: c.id, ...c.data(), membershipRole: m.role };
      }))).filter(Boolean);
      scl(mc);
      if (mc.length > 0) { scid(mc[0].id); sclub(mc[0]); LM(mc[0].id); LR(mc[0].id); if (mc[0].membershipRole === 'OWNER') srn('Owner'); }
    } catch (e) { console.error(e); }
  }
  async function LM(id: string) {
    try { const ms = await getDocs(query(collection(db, 'clubMembers'), where('clubId', '==', id), where('status', '==', 'ACTIVE'))); sm(ms.docs.map((d: any) => ({ id: d.id, ...d.data() }))); } catch (e) { }
  }
  async function LR(id: string) {
    try { const rs = await getDocs(query(collection(db, 'roles'), where('clubId', '==', id))); sr(rs.docs.map((d: any) => ({ id: d.id, ...d.data() }))); } catch (e) { }
  }
  const invite = async () => {
    if (!ie.trim()) { setMsg('Enter email'); return; }
    setInv(true); setMsg('');
    try {
      const uid = 'member_' + Date.now();
      await addDoc(collection(db, 'clubMembers'), { clubId: cid, userId: uid, role: ir, status: 'ACTIVE', joinedAt: new Date().toISOString(), displayName: ie.split('@')[0], email: ie.trim() });
      await addDoc(collection(db, 'activityLogs'), { clubId: cid, userId: user.uid, userName: user.email, action: 'MEMBER_ADDED', description: `+${ie} added as ${ir}`, createdAt: new Date().toISOString() });
      setMsg('Added!'); setIE(''); if (cid) LM(cid);
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setInv(false);
  };
  const upRole = async (mid: string, r: string) => { await updateDoc(doc(db, 'clubMembers', mid), { role: r }); if (cid) LM(cid); };
  const remMember = async (mid: string) => { if (!confirm('Remove this member?')) return; await updateDoc(doc(db, 'clubMembers', mid), { status: 'REMOVED' }); if (cid) LM(cid); };
  const createRole = async () => {
    if (!rf.name.trim()) return;
    await addDoc(collection(db, 'roles'), { clubId: cid, name: rf.name, description: rf.description, permissions: rf.permissions, isSystemRole: false, createdAt: new Date().toISOString(), createdBy: user.uid });
    setRF({ name: '', description: '', permissions: [] }); setER(null); if (cid) LR(cid);
  };
  const saveRole = async () => {
    if (!er || !rf.name.trim()) return;
    await updateDoc(doc(db, 'roles', er.id), { name: rf.name, description: rf.description, permissions: rf.permissions });
    setRF({ name: '', description: '', permissions: [] }); setER(null); if (cid) LR(cid);
  };
  const delRole = async (id: string) => { if (!confirm('Delete this role?')) return; await deleteDoc(doc(db, 'roles', id)); if (cid) LR(cid); };
  const tp = (p: string) => {
    const arr = rf.permissions;
    if (arr.indexOf(p) > -1) setRF({ ...rf, permissions: arr.filter((x: string) => x !== p) });
    else setRF({ ...rf, permissions: [...arr, p] });
  };
  const hl = async () => { await signOut(auth); window.location.href = '/login'; };
  const hc = async (id: string) => { scid(id); sclub(clubs.find((x: any) => x.id === id)); };
  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar clubs={clubs} currentClubId={cid || ''} userDisplayName={user?.email?.split('@')[0]} clubRole={rn} onClubChange={hc} onLogout={hl} clubName={club?.name} />
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>
          <div className="tabs mb-6">
            <button className={"tab" + (tab === 'members' ? ' active' : '')} onClick={() => st('members')}>Members</button>
            <button className={"tab" + (tab === 'roles' ? ' active' : '')} onClick={() => st('roles')}>Roles & Permissions</button>
          </div>
          {tab === 'members' && (
            <div>
              <div className="card mb-6">
                <h3 className="font-semibold mb-4">Invite Member</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1"><input className="input" placeholder="Email or name" value={ie} onChange={e => setIE(e.target.value)} /></div>
                  <select className="select w-36" value={ir} onChange={e => setIR(e.target.value)}>
                    <option value="ADMIN">Admin</option><option value="EVENT_HEAD">Event Head</option><option value="MEMBER">Member</option><option value="VOLUNTEER">Volunteer</option>
                  </select>
                  <button className="btn btn-primary" onClick={invite} disabled={inv}>{inv ? 'Adding...' : 'Add Member'}</button>
                </div>
                {imsg && <p className="text-sm mt-2">{imsg}</p>}
              </div>
              <div className="space-y-2">
                {members.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No members yet.</p> : members.map(m => (
                  <div key={m.id} className="card flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-medium text-indigo-600">{(m.displayName || m.email || '?')[0].toUpperCase()}</div>
                      <div><p className="font-medium">{m.displayName || m.email || 'User'}</p><p className="text-xs text-gray-500">{m.email || ''}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={"badge " + (m.role === 'OWNER' ? 'badge-red' : m.role === 'ADMIN' ? 'badge-blue' : m.role === 'EVENT_HEAD' ? 'badge-yellow' : 'badge-gray')}>{m.role || 'Member'}</span>
                      {m.role !== 'OWNER' && <button className="btn btn-sm btn-danger" onClick={() => remMember(m.id)}>Remove</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'roles' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">Create custom roles with granular permissions</p>
                <button className="btn btn-primary btn-sm" onClick={() => { setER({ new: true }); setRF({ name: '', description: '', permissions: [] }); }}>+ Create Role</button>
              </div>
              <div className="card mb-4">
                <div className="p-3 bg-gray-50 rounded-lg mb-2"><p className="font-semibold">👑 Owner</p><p className="text-sm text-gray-500">Full access to everything</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="font-semibold">🛡️ Admin</p><p className="text-sm text-gray-500">Club management</p></div>
              </div>
              {roles.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No custom roles yet.</p> : roles.map(r => (
                <div key={r.id} className="card mb-2 flex items-center justify-between p-3">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.description || ''}</p>
                    <p className="text-xs text-gray-400 mt-1">{r.permissions?.length || 0} permissions</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-sm" onClick={() => { setER(r); setRF({ name: r.name, description: r.description || '', permissions: r.permissions || [] }); }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => delRole(r.id)}>Delete</button>
                  </div>
                </div>
              ))}
              {er !== null && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setER(null)}>
                  <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold mb-4">{er.new ? 'Create Role' : 'Edit Role'}</h2>
                    <input className="input mb-2" placeholder="Role name (e.g. Event Manager)" value={rf.name} onChange={e => setRF({ ...rf, name: e.target.value })} />
                    <input className="input mb-4" placeholder="Description" value={rf.description} onChange={e => setRF({ ...rf, description: e.target.value })} />
                    <div className="space-y-3 mb-4">
                      {pG.map((g: any, j: number) => (
                        <div key={j}>
                          <p className="text-sm font-semibold text-gray-600 mb-1">{g[0]}</p>
                          {g[1].map((pm: string, i: number) => (
                            <label key={i} className="flex items-center gap-2 text-sm cursor-pointer p-0.5 rounded hover:bg-gray-50">
                              <input type="checkbox" checked={rf.permissions.indexOf(pm) > -1} onChange={() => tp(pm)} />
                              {pretty(pm)}
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-primary flex-1" onClick={er.new ? createRole : saveRole}>{er.new ? 'Create Role' : 'Save'}</button>
                      <button className="btn flex-1" onClick={() => setER(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
