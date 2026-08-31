import os, json
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'
perms = [("Club",["VIEW_CLUB","EDIT_CLUB"]),("Members",["VIEW_MEMBERS","INVITE_MEMBERS","REMOVE_MEMBERS","MANAGE_MEMBER_ROLES","MANAGE_MEMBER_PERMISSIONS"]),("Events",["VIEW_EVENTS","CREATE_EVENTS","EDIT_EVENTS","DELETE_EVENTS","MANAGE_EVENTS"]),("Tasks",["VIEW_TASKS","CREATE_TASKS","EDIT_TASKS","DELETE_TASKS","ASSIGN_TASKS","MANAGE_TASKS"]),("Volunteers",["VIEW_VOLUNTEERS","MANAGE_VOLUNTEERS","ASSIGN_VOLUNTEERS"]),("Meetings",["VIEW_MEETINGS","CREATE_MEETINGS","EDIT_MEETINGS","DELETE_MEETINGS","MANAGE_MEETINGS"]),("Documents",["VIEW_DOCUMENTS","UPLOAD_DOCUMENTS","DELETE_DOCUMENTS","MANAGE_DOCUMENTS"]),("Risks",["VIEW_RISKS","CREATE_RISKS","MANAGE_RISKS","RESOLVE_RISKS"]),("Announcements",["VIEW_ANNOUNCEMENTS","CREATE_ANNOUNCEMENTS","EDIT_ANNOUNCEMENTS","PUBLISH_ANNOUNCEMENTS","DELETE_ANNOUNCEMENTS"]),("AI",["USE_AI","ANALYZE_MEETINGS","USE_AI_ACTIONS","RUN_RISK_ANALYSIS","MANAGE_KNOWLEDGE_BASE"]),("Analytics",["VIEW_ANALYTICS"]),("Admin",["MANAGE_CLUB_SETTINGS","MANAGE_ROLES","TRANSFER_OWNERSHIP"])]

with open(p, 'a') as f:
    # Modal
    f.write("er!==null?")
    f.write("React.createElement('div',{className:'fixed inset-0 bg-black/50 z-50 flex items-center justify-center',onClick:function(){setER(null)}},")
    f.write("React.createElement('div',{className:'bg-white rounded-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto',onClick:function(e){return e.stopPropagation()}},")
    f.write("React.createElement('h2',{className:'text-lg font-bold mb-4'},er.new?'Create Role':'Edit Role'),")
    f.write("React.createElement('input',{className:'input mb-2',placeholder:'Role name',value:rf.name,onChange:function(e){return setRF({...rf,name:e.target.value})}}),")
    f.write("React.createElement('input',{className:'input mb-4',placeholder:'Description',value:rf.description,onChange:function(e){return setRF({...rf,description:e.target.value})}}),")
    for label, plist in perms:
        f.write("React.createElement('div',{className:'mb-2'},React.createElement('p',{className:'text-sm font-semibold text-gray-600 mb-1'},"+json.dumps(label)+"),")
        for p in plist:
            lbl = p.replace('_',' ').title()
            f.write("React.createElement('label',{className:'flex items-center gap-2 text-sm cursor-pointer p-0.5 rounded hover:bg-gray-50'},React.createElement('input',{type:'checkbox',checked:rf.permissions.indexOf('"+p+"')>-1,onChange:function(){return tp('"+p+"')}}),"+json.dumps(lbl)+"),")
        f.write("),")
    f.write("React.createElement('div',{className:'flex gap-2 mt-4'},React.createElement('button',{className:'btn btn-primary flex-1',onClick:er.new?createRole:saveRole},er.new?'Create Role':'Save'),React.createElement('button',{className:'btn flex-1',onClick:function(){setER(null)}},'Cancel'))")
    f.write(")):null")
    # Close the inner div, main, outer div
    f.write(")))")
    f.write(");")
    f.write("}")
print("Modal closed. Full size: " + str(os.path.getsize(p)) + " bytes")