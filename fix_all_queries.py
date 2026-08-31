import os, glob

# Fix all pages that query clubMembers by status only -> add userId filter
files = [
    'apps/web/src/app/dashboard/page.tsx',
    'apps/web/src/app/events/page.tsx',
    'apps/web/src/app/tasks/page.tsx',
    'apps/web/src/app/members/page.tsx',
    'apps/web/src/app/volunteers/page.tsx',
    'apps/web/src/app/meetings/page.tsx',
    'apps/web/src/app/risks/page.tsx',
    'apps/web/src/app/ai-assistant/page.tsx',
    'apps/web/src/app/analytics/page.tsx',
    'apps/web/src/app/announcements/page.tsx',
    'apps/web/src/app/documents/page.tsx',
    'apps/web/src/app/knowledge/page.tsx',
    'apps/web/src/app/settings/page.tsx',
]

old_q1 = "where('status', '==', 'ACTIVE')"
new_q1 = "where('userId', '==', user.uid), where('status', '==', 'ACTIVE')"
old_q2 = 'where(\"status\", \"==\", \"ACTIVE\")'
new_q2 = 'where(\"userId\", \"==\", user.uid), where(\"status\", \"==\", \"ACTIVE\")'

changed = []
for f in files:
    p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/' + f
    if not os.path.exists(p):
        print('SKIP (missing):', f)
        continue
    c = open(p).read()
    orig = c
    if old_q1 in c:
        c = c.replace(old_q1, new_q1)
    if old_q2 in c:
        c = c.replace(old_q2, new_q2)
    if c != orig:
        open(p, 'w').write(c)
        changed.append(f)
        print('FIXED:', f)
    else:
        print('OK:', f)

print('\nTotal fixed:', len(changed))