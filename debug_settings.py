import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
c = open(p).read()
print('LEN:', len(c))
idx = c.find('Transfer Ownership')
print('TO at:', idx)
print('Context:', c[idx-50:idx+300])
﻿import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
c = open(p).read()
print('LEN:', len(c))
tab_start = c.find('Transfer Ownership')
print('Transfer Ownership at', tab_start)
btn_end = c.find('</button>', tab_start)
print('Button ends at', btn_end)
print('After button:', c[btn_end:btn_end+200])
