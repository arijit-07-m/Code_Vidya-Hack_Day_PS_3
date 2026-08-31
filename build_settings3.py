import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
with open(p, 'a') as f:
    f.write("return React.createElement('div',{className:'flex min-h-screen'},")
    f.write("React.createElement(Sidebar,{clubs:clubs,currentClubId:cid||'',userDisplayName:user?.email?.split('@')[0],clubRole:rn,onClubChange:hc,onLogout:hl,clubName:club?.name}),")
    f.write("React.createElement('main',{className:'flex-1 bg-gray-50 overflow-y-auto p-6'},")
    f.write("React.createElement('div',{className:'max-w-5xl mx-auto'},")
    f.write("React.createElement('h1',{className:'text-2xl font-bold mb-6'},'Settings'),")
    f.write("React.createElement('div',{className:'tabs mb-6'},")
    f.write("React.createElement('button',{className:'tab'+(tab==='members'?' active':''),onClick:function(){return st('members')}},'Members'),")
    f.write("React.createElement('button',{className:'tab'+(tab==='roles'?' active':''),onClick:function(){return st('roles')}},'Roles'),")
    f.write("),")
print("Return start appended: " + str(os.path.getsize(p)) + " bytes")