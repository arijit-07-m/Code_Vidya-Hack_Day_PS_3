import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'

content2 = """
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
"""

with open(p, 'a') as f:
    f.write(content2)

print('Part 2 appended: ' + str(os.path.getsize(p)) + ' bytes')