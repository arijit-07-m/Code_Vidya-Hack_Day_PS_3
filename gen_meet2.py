import os
p = os.path.expanduser("~") + "/Desktop/CodingVidyaPS/apps/web/src/app/meetings/page.tsx"
code2 = '''
async function approveItems(){if(!analysis||!cid)return;try{for(var i=0;i<analysis.items.length;i++){var ai=analysis.items[i];if(!ai.selected)continue;await addDoc(collection(db,"tasks"),{title:ai.task,assignedTo:ai.name,deadline:ai.deadline||"",priority:ai.priority,status:"TODO",clubId:cid,description:"From meeting analysis",createdBy:user.uid,createdAt:new Date().toISOString()})}for(var j=0;j<analysis.risks.length;j++){var r=analysis.risks[j];await addDoc(collection(db,"risks"),{title:r.title,description:r.description,severity:r.severity,status:"OPEN",clubId:cid,createdAt:new Date().toISOString(),recommendation:"Review and address"})}sa(null);alert("Tasks and risks created!");if(cid)loadM(cid)}catch(e){alert("Error: "+e.message)}}
var hl=async function(){await signOut(auth);window.location.href="/login"};var hc=function(id){scid(id);sclub(clubs.find(function(x){return x.id===id}));loadM(id)};
function analyze(){if(!f.transcript.trim())return;saz(true);setTimeout(function(){sa(analyzeText(f.transcript));saz(false)},800)}
'''

with open(p, "a") as f:
    f.write(code2)
print("Part2:", os.path.getsize(p))