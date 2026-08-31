import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'

content3 = """
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
"""

with open(p, 'a') as f:
    f.write(content3)

print('Part 3 appended: ' + str(os.path.getsize(p)) + ' bytes')