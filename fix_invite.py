import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/dashboard/page.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find("const q = query(collection(db, 'clubMembers'), where('userId', '==', user.uid),")
if idx == -1:
    idx = c.find("const q = query(\n        collection(db, 'clubMembers'),\n        where('userId', '==', user.uid),")
    
endIdx = c.find('const rawClubs', idx)

if idx == -1 or endIdx == -1:
    print('Pattern not found!')
    # Show what's around clubMembers
    i = c.find("clubMembers")
    print(c[i-50:i+200])
    exit(1)

newQ = "const q = query(collection(db, 'clubMembers'), where('status', '==', 'ACTIVE'));\n      const snapshot = await getDocs(q);\n      const allMembers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));\n      const userMembers = allMembers.filter(x => x.userId === user.uid or (x.email and x.email.lower() == (user.email or '').lower()));\n      const rawClubs = await Promise.all("

c = c[:idx] + newQ + c[endIdx:]
c = c.replace("snapshot.docs.map(async (d) => {", "userMembers.map(async (d) => {")

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)
print('Fixed! Size:', os.path.getsize(p))