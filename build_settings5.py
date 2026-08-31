import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
with open(p, 'a') as f:
    # Roles tab
    f.write("React.createElement('div',null,")
    f.write("React.createElement('div',{className:'flex items-center justify-between mb-4'},")
    f.write("React.createElement('p',{className:'text-sm text-gray-500'},'Custom roles'),")
    f.write("React.createElement('button',{className:'btn btn-primary btn-sm',onClick:function(){setER({new:true});setRF({name:'',description:'',permissions:[]})}},'+ Create Role')),")
    f.write("React.createElement('div',{className:'card mb-4'},")
    f.write("React.createElement('div',{className:'p-3 bg-gray-50 rounded-lg mb-2'},React.createElement('p',{className:'font-semibold'},'👑 Owner'),React.createElement('p',{className:'text-sm text-gray-500'},'Full access')),")
    f.write("React.createElement('div',{className:'p-3 bg-gray-50 rounded-lg'},React.createElement('p',{className:'font-semibold'},'🛡️ Admin'),React.createElement('p',{className:'text-sm text-gray-500'},'Club management'))),")
    f.write("roles.length===0?React.createElement('p',{className:'text-sm text-gray-400 text-center py-4'},'No custom roles.'):")
    f.write("roles.map(function(r){return React.createElement('div',{key:r.id,className:'card mb-2 flex items-center justify-between p-3'},")
    f.write("React.createElement('div',null,React.createElement('p',{className:'font-semibold'},r.name),React.createElement('p',{className:'text-xs text-gray-500'},r.description||''),React.createElement('p',{className:'text-xs text-gray-400 mt-1'},(r.permissions?.length||0)+' permissions')),")
    f.write("React.createElement('div',{className:'flex gap-2'},React.createElement('button',{className:'btn btn-sm',onClick:function(){setER(r);setRF({name:r.name,description:r.description||'',permissions:r.permissions||[]})}},'Edit'),React.createElement('button',{className:'btn btn-sm btn-danger',onClick:function(){return delRole(r.id)}},'Delete')))})")
    f.write(")")
print("Roles tab appended: " + str(os.path.getsize(p)) + " bytes")