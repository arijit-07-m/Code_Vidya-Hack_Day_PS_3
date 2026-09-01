import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/components/Sidebar.tsx'
c = open(p, encoding='utf-8').read()

# Fix the sidebar links to include clubId
old_link = """<a href={item.href}"""
new_link = """<a href={currentClubId ? `${item.href}?clubId=${currentClubId}` : item.href}"""
if old_link in c:
    c = c.replace(old_link, new_link)
    open(p, 'w', encoding='utf-8').write(c)
    print('Sidebar links fixed to include clubId')
else:
    print('Pattern not found in sidebar')
    # Check what the href pattern looks like
    idx = c.find('item.href')
    if idx > 0: print('href pattern:', c[idx:idx+100])