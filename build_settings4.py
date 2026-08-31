import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
with open(p, 'a') as f:
    # Member tab
    f.write("tab==='members'?")
    f.write("React.createElement('div',null,")
    f.write("React.createElement('div',{className:'card mb-6'},React.createElement('h3',{className:'font-semibold mb-4'},'Invite Member'),")
    f.write("React.createElement('div',{className:'flex gap-2 items-end'},")
    f.write("React.createElement('div',{className:'flex-1'},React.createElement('input',{className:'input',placeholder:'Email or name',value:ie,onChange:function(e){return setIE(e.target.value)}})),")
    f.write("React.createElement('select',{className:'select w-36',value:ir,onChange:function(e){return setIR(e.target.value)}},")
    f.write("React.createElement('option',{value:'ADMIN'},'Admin'),React.createElement('option',{value:'EVENT_HEAD'},'Event Head'),React.createElement('option',{value:'MEMBER'},'Member'),React.createElement('option',{value:'VOLUNTEER'},'Volunteer')),")
    f.write("React.createElement('button',{className:'btn btn-primary',onClick:invite,disabled:inv},inv?'Adding...':'Add')),")
    f.write("imsg?React.createElement('p',{className:'text-sm mt-2'},imsg):null),")
    f.write("members.length===0?React.createElement('p',{className:'text-sm text-gray-400 text-center py-8'},'No members yet.'):")
    f.write("members.map(function(m){return React.createElement('div',{key:m.id,className:'card flex items-center justify-between p-3'},")
    f.write("React.createElement('div',{className:'flex items-center gap-3'},React.createElement('div',{className:'w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-medium text-indigo-600'},(m.displayName||m.email||'?')[0].toUpperCase()),")
    f.write("React.createElement('div',null,React.createElement('p',{className:'font-medium'},m.displayName||m.email||'User'),React.createElement('p',{className:'text-xs text-gray-500'},m.email||''))),")
    f.write("React.createElement('div',{className:'flex items-center gap-2'},React.createElement('span',{className:'badge '+(m.role==='OWNER'?'badge-red':m.role==='ADMIN'?'badge-blue':m.role==='EVENT_HEAD'?'badge-yellow':'badge-gray')},m.role||'Member'),")
    f.write("m.role!=='OWNER'?React.createElement('button',{className:'btn btn-sm btn-danger',onClick:function(){return remMember(m.id)}},'Remove'):null))})")
    f.write("):")
print("Member tab appended: " + str(os.path.getsize(p)) + " bytes")