import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'

content4 = """
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
"""

with open(p, 'a') as f:
    f.write(content4)

print('Part 4 appended, total: ' + str(os.path.getsize(p)) + ' bytes')