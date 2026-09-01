import os, sys
sys.stdout.reconfigure(encoding='utf-8')

p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/events/page.tsx'
c = open(p, encoding='utf-8').read()
print('Total:', len(c))

# 1. Check for useSearchParams
if 'useSearchParams' not in c:
    print('FIX: Adding useSearchParams import')
    c = c.replace(
        "import Sidebar from '@/components/Sidebar';",
        "import Sidebar from '@/components/Sidebar';\nimport { useSearchParams } from 'next/navigation';"
    )

# 2. Check if loadClubs reads URL params
if 'urlClubId' not in c:
    print('FIX: Adding URL clubId handling')
    # Add searchParams after the useState declarations
    old = "  // Modal / Form state"
    new = """  const searchParams = useSearchParams();
  const urlClubId = searchParams.get('clubId');

  // Modal / Form state"""
    if old in c:
        c = c.replace(old, new)
    else:
        print('  Pattern not found for Modal/Form state')

# 3. Check if currentClubId is set from URL params
if 'urlClubId && clubs.length' not in c:
    print('FIX: Adding useEffect for URL clubId')
    add_after = "  }, [authChecked, user]);"
    add_code = """
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
    if add_after in c:
        c = c.replace(add_after, add_after + add_code)
    else:
        print('  Pattern not found for useEffect')

# 4. Make sure handleSaveEvent includes clubId
idx = c.find('const handleSaveEvent')
if idx > 0:
    save_block = c[idx:idx+800]
    if 'clubId' not in save_block:
        print('FIX: handleSaveEvent missing clubId - adding it')
        # Find the addDoc call
        add_idx = save_block.find('addDoc(collection(db,')
        if add_idx > 0:
            # Find the object inside the addDoc
            obj_start = save_block.find('{', add_idx)
            obj_end = save_block.find('});', add_idx)
            if obj_start > 0 and obj_end > 0:
                obj = save_block[obj_start:obj_end+2]
                if 'clubId' not in obj:
                    new_obj = obj.replace('{', '{clubId: currentClubId,', 1)
                    c = c[:idx+add_idx+obj_start] + new_obj + c[idx+add_idx+obj_end+2:]
                    print('  clubId added to event document')
    else:
        print('  handleSaveEvent already has clubId')

# 5. Check if loadEvents is missing something
idx2 = c.find('async function loadEvents')
if idx2 > 0:
    load_fn = c[idx2:idx2+500]
    if 'orderBy' not in load_fn and 'createdAt' in load_fn:
        print('FIX: Adding orderBy to loadEvents')
        old_q = "const q = query(collection(db, 'events'), where('clubId', '==', clubId));"
        new_q = "const q = query(collection(db, 'events'), where('clubId', '==', clubId), orderBy('createdAt', 'desc'));"
        if old_q in load_fn:
            c = c.replace(old_q, new_q)
            print('  orderBy added')

open(p, 'w', encoding='utf-8').write(c)
print('DONE')