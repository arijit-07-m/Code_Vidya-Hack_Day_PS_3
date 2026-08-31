import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
c = open(p, encoding='utf-8').read()

# Find the handleInvite function and add deleteClub after it
idx = c.find('const handleInvite = async () => {')
end = c.find('  const removeMember', idx)
if end < 0: end = c.find('  const hl', idx)

# Add deleteClub function before hl
add = """
  async function deleteClub() {
    if (!currentClubId || !club) return;
    setDeleting(true); setDeleteMsg('');
    try {
      const collections = ['clubMembers', 'events', 'tasks', 'meetings', 'risks', 'announcements', 'roles', 'invitations', 'activityLogs'];
      for (const col of collections) {
        const snap = await getDocs(query(collection(db, col), where('clubId', '==', currentClubId)));
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 500) {
          const batch = docs.slice(i, i + 500);
          await Promise.all(batch.map(d => deleteDoc(doc(db, col, d.id))));
        }
      }
      await deleteDoc(doc(db, 'clubs', currentClubId));
      setDeleteMsg('Club deleted successfully.');
      setShowDeleteModal(false);
      setTimeout(() => {
        const remaining = clubs.filter(c => c.id !== currentClubId);
        if (remaining.length > 0) { window.location.href = '/dashboard?clubId=' + remaining[0].id; }
        else { window.location.href = '/clubs/new'; }
      }, 1500);
    } catch (e) { setDeleteMsg('Error: ' + e.message); }
    setDeleting(false);
  }

"""

c = c[:end] + add + c[end:]
open(p, 'w', encoding='utf-8').write(c)
print('deleteClub added')