import os
root = os.path.expanduser('~') + '/Desktop/CodingVidyaPS'
for f in os.listdir(root):
    if f.endswith('.py') and f not in ['apps']:
        try:
            os.remove(os.path.join(root, f))
            print('Removed:', f)
        except:
            pass
print('Cleanup done')