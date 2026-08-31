import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
c = open(p, encoding='utf-8').read()

# 1. Update tab type to include 'club'
c = c.replace(
    "useState<'members' | 'roles' | 'ownership'>('members')",
    "useState<'members' | 'roles' | 'ownership' | 'club'>('members')"
)

# 2. Add Club tab button after Transfer Ownership button
old_tab_btn = """            {roleName === 'Owner' && (
              <button
                className={'tab' + (tab === 'ownership' ? ' active' : '')}
                onClick={() => setTab('ownership')}
              >
                Transfer Ownership
              </button>
            )}"""

new_tab_btn = """            {roleName === 'Owner' && (
              <button
                className={'tab' + (tab === 'ownership' ? ' active' : '')}
                onClick={() => setTab('ownership')}
              >
                Transfer Ownership
              </button>
            )}
            {roleName === 'Owner' && (
              <button
                className={'tab' + (tab === 'club' ? ' active' : '')}
                onClick={() => setTab('club')}
              >
                Club
              </button>
            )}"""

if old_tab_btn in c:
    c = c.replace(old_tab_btn, new_tab_btn)
    print('Club tab button added')
else:
    print('Tab button pattern NOT FOUND - trying alternative')
    alt_btn = """{roleName === 'Owner' && (
              <button
                className={'tab' + (tab === 'ownership' ? ' active' : '')}
                onClick={() => setTab('ownership')}
              >
                Transfer Ownership
              </button>
            )}"""
    if alt_btn in c:
        c = c.replace(alt_btn, alt_btn + """
            {roleName === 'Owner' && (
              <button
                className={'tab' + (tab === 'club' ? ' active' : '')}
                onClick={() => setTab('club')}
              >
                Club
              </button>
            )}""")
        print('Club tab button added (alt)')
    else:
        print('Could not find ownership tab button')

open(p, 'w', encoding='utf-8').write(c)
print('Done')