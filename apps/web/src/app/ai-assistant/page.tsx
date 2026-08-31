'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,query,where,getDocs,orderBy,doc,getDoc,limit}from'firebase/firestore';
import Sidebar from'@/components/Sidebar';
const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);

export default function AIPage(){
const[user,su]=useState(null);const[ck,sc]=useState(false);const[clubs,scl]=useState([]);
const[cid,scid]=useState(null);const[cmd,scmd]=useState('');const[resp,sresp]=useState('');const[sending,ss]=useState(false);
useEffect(()=>{const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});return()=>un();},[]);
useEffect(()=>{if(ck)L();},[ck]);
async function L(){const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));const sn=await getDocs(q);const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);scl(mc);if(mc.length>0)scid(mc[0].id);}
const hl=async()=>{await signOut(auth);window.location.href='/login';};const hc=id=>{scid(id);};
const submit=async()=>{if(!cmd.trim())return;ss(true);sresp('✨ Processing...');setTimeout(()=>{sresp("🤖 AI Assistant\n\nI understood your command:\n\""+cmd+"\"\n\nIn the full version, this would:\n1. Detect intent\n2. Select the appropriate tool\n3. Verify your permissions\n4. Execute the action\n5. Return the result\n\nTry commands like:\n• \"Create a task for Rahul to arrange the projector\"\n• \"What are today's urgent tasks?\"");ss(false);},2000);};
if(!user)return<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full"/></div>;
return(<div className="flex min-h-screen"><Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} onClubChange={hc} onLogout={hl} clubName={clubs.find(c=>c.id===cid)?.name}/>
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-4xl mx-auto">
<h1 className="text-2xl font-bold mb-2">🤖 AI Assistant</h1><p className="text-gray-500 mb-6">Natural language commands for your club operations</p>
<div className="card mb-6"><textarea className="textarea mb-3" placeholder='e.g. "Create a high priority task for Rahul to arrange 5 microphones by tomorrow"' value={cmd} onChange={e=>scmd(e.target.value)} rows={3}/><button className="btn btn-primary" onClick={submit} disabled={sending||!cmd.trim()}>{sending?'Processing...':'Send Command'}</button></div>
{resp&&<div className="card bg-indigo-50 border-indigo-200"><pre className="text-sm whitespace-pre-wrap">{resp}</pre></div>}
<div className="card mt-6"><h3 className="font-semibold mb-3">💡 Example Commands</h3><div className="space-y-2 text-sm text-gray-600"><p>"Create a task for Rahul to arrange the projector"</p><p>"Mark the projector task as completed"</p><p>"What are today's urgent tasks?"</p><p>"Who is overloaded?"</p><p>"What risks exist for Hack Day?"</p></div></div>
</div></main></div>);}