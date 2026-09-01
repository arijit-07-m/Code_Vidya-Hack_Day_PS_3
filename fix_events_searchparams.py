import os, re
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/events/page.tsx'
c = open(p, encoding='utf-8').read()

# Fix 1: Add useSearchParams import
if 'useSearchParams' not in c:
    c = c.replace(
        "import Sidebar from '@/components/Sidebar';",
        "import Sidebar from '@/components/Sidebar';\nimport { useSearchParams } from 'next/navigation';"
    )
    print('Added useSearchParams import')

# Fix 2: Add searchParams reading
old_init = """  const [form, setForm] = useState({
    eventName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '18:00',
    venue: '',
    eventOwner: '',
    status: 'PLANNING' as ClubEvent['status'],
  });"""

new_init = """  const searchParams = useSearchParams();
  const urlClubId = searchParams.get('clubId');

  const [form, setForm] = useState({
    eventName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '18:00',
    venue: '',
    eventOwner: '',
    status: 'PLANNING' as ClubEvent['status'],
  });
  
  // Use URL clubId if provided
  useEffect(() => {
    if (urlClubId && clubs.length > 0) {
      const found = clubs.find(c => c.id === urlClubId);
      if (found) {
        setCurrentClubId(urlClubId);
        loadEvents(urlClubId);
        loadClubMembers(urlClubId);
      }
    }
  }, [urlClubId, clubs]);"""

if old_init in c:
    c = c.replace(old_init, new_init)
    print('Added searchParams + URL clubId handling')
else:
    print('Form init pattern not found - checking alternatives')
    # Try to find a simpler pattern
    idx = c.find("const [form, setForm]")
    if idx > 0:
        print('Form state at', idx, ':', c[idx:idx+100])

# Fix 3: Make sure handleSaveEvent uses currentClubId from state
# The key issue is that events are created with all form fields but need to include clubId
# Let me verify the handleSaveEvent includes clubId
idx = c.find('const handleSaveEvent')
if idx > 0:
    save_fn = c[idx:idx+600]
    if 'clubId' not in save_fn:
        print('WARNING: handleSaveEvent does not include clubId!')
        print(save_fn[:300])
    else:
        print('handleSaveEvent includes clubId - OK')

open(p, 'w', encoding='utf-8').write(c)
print('Done')