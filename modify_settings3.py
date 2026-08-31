import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
c = open(p, encoding='utf-8').read()

# Find the ownership tab end
idx = c.find('ownerMsg && <p')
print('Found ownerMsg at', idx)
if idx > 0:
    # Find the end of the closing
    end = c.find('          )}', idx)
    print('End at', end)
    replacement = '''{ownerMsg && <p className="text-xs font-semibold mt-2">{ownerMsg}</p>}
              </div>
            </div>
          )}

          {tab === 'club' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="font-bold text-lg mb-4">General</h2>
                <div className="space-y-3">
                  <div><label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Club Name</label><input className="input" value={club?.name || ''} disabled /></div>
                  <div><label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Description</label><textarea className="textarea" value={club?.description || ''} disabled /></div>
                  <p className="text-xs text-gray-400">Contact the club owner to edit these details.</p>
                </div>
              </div>
              <div className="card border-2 border-red-200">
                <div className="flex items-center gap-2 mb-2"><span className="text-red-600 font-bold">DANGER ZONE</span></div>
                <p className="text-sm text-gray-600 mb-4">Permanently delete this club and all associated data.</p>
                <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>Delete Club</button>
              </div>
              {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
                  <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                    <div className="text-center mb-4"><div className="text-4xl mb-2">Delete Club</div></div>
                    <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete <strong>{club?.name}</strong>?</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg">
                      <span>Events</span><span>Tasks</span><span>Members</span><span>Meetings</span>
                      <span>Documents</span><span>Risks</span><span>Announcements</span><span>Activity history</span>
                      <span>Custom roles</span><span>Invitations</span>
                    </div>
                    <p className="text-xs text-red-600 font-semibold mb-3">This action cannot be undone.</p>
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Type <strong>{club?.name}</strong> to confirm:</label>
                      <input className="input" placeholder="Enter club name" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
                    </div>
                    {deleteMsg && <p className="text-sm font-semibold mb-2">{deleteMsg}</p>}
                    <div className="flex gap-2">
                      <button className="btn flex-1 bg-gray-100" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} disabled={deleting}>Cancel</button>
                      <button className="btn btn-danger flex-1" onClick={deleteClub} disabled={deleting || deleteConfirm !== (club?.name || '')}>
                        {deleting ? 'Deleting...' : 'Delete Club Permanently'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
'''
    c = c[:idx] + replacement + c[end+12:]
    open(p, 'w', encoding='utf-8').write(c)
    print('Club tab added')
else:
    print('Pattern not found')
    # Try to find what's there
    for kw in ['ownerMsg', 'Delete Club', 'club tab']:
        i = c.find(kw)
        if i > 0: print(f'{kw} at {i}:', c[i:i+80])