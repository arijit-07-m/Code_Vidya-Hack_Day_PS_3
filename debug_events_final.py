import os, sys
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/events/page.tsx'
c = open(p, encoding='utf-8').read()
print('Total:', len(c))

# Find loadEvents
idx = c.find('async function loadEvents')
print('loadEvents at', idx)
print(c[idx:idx+400])

print('===')
# Find handleSaveEvent
idx2 = c.find('const handleSaveEvent')
print('handleSaveEvent at', idx2)
print(c[idx2:idx2+600])