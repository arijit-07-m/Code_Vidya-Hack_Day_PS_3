import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
c = open(p, encoding='utf-8').read()

# Check current state
print('Has club tab state:', "'club'" in c)
print('Has club tab button:', "tab === 'club'" in c)

# Find the ownership tab render
idx = c.find("tab === 'ownership' && (")
print('Ownership tab render at:', idx)

# Find the end of the ownership tab
end_idx = c.find("        </div>", idx)
if end_idx > 0:
    end_idx = c.find("        </div>", end_idx + 1)
    if end_idx > 0:
        end_idx += 9  # Include the closing div
        print('Ownership tab ends at:', end_idx)
        print('After ownership tab:', c[end_idx:end_idx+200])

# Check if club tab already exists
if "tab === 'club' && (" in c:
    print('Club tab already exists')
else:
    print('Club tab NOT yet added')