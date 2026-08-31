import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
c = open(p, encoding='utf-8').read()
print('LEN:', len(c))
idx = c.find('Transfer Ownership')
print('TO at:', idx)
if idx > 0:
    print('Context:', c[idx-50:idx+300])
# Find the end of the file
print('LAST 200:', c[-200:])