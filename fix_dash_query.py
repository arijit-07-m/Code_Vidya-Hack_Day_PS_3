c = open('apps/web/src/app/dashboard/page.tsx').read()
old_q = "where('status', '==', 'ACTIVE')"
new_q = "where('userId', '==', user.uid), where('status', '==', 'ACTIVE')"
if old_q in c:
    c = c.replace(old_q, new_q)
    open('apps/web/src/app/dashboard/page.tsx', 'w').write(c)
    print('Fixed dashboard - userId filter added')
else:
    print('Pattern not found')
    idx = c.find("collection(db")
    print(c[idx:idx+200])
