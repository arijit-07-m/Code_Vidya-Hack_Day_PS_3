'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,addDoc,query,where,getDocs,orderBy,doc,getDoc}from'firebase/firestore';
import Sidebar from'@/components/Sidebar';
const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);

export default function MeetingsPage(){
const[user,su]=useState(null);const[ck,sc]=useState(false);const[clubs,scl]=useState([]);
const[cid,scid]=useState(null);const[meetings,sm]=useState([]);const[ld,sld]=useState(true);const[sh,ssh]=useState(false);
const[f,sf]=useState({title:'',date:'',notes:''});
useEffect(()=>{const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});return()=>un();},[]);
useEffect(()=>{if(ck)L();},[ck]);
async function L(){const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));const sn=await getDocs(q);const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);scl(mc);if(mc.length>0){scid(mc[0].id);loadM(mc[0].id);}}
async function loadM(id){sld(true);try{const sn=await getDocs(query(collection(db,'meetings'),where('clubId','==',id),orderBy('createdAt','desc')));sm(sn.docs.map(d=>({id:d.id,...d.data()})));}catch(e){}finally{sld(false);}}
async function cr(){await addDoc(collection(db,'meetings'),{...f,clubId:cid,participants:[],createdBy:user.uid,createdAt:new Date().toISOString(),aiProcessed:false});ssh(false);sf({title:'',date:'',notes:''});if(cid)loadM(cid);}
const hl=async()=>{await signOut(auth);window.location.href='/login';};const hc=id=>{scid(id);loadM(id);};
if(!user)return<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full"/></div>;
return(<div className="flex min-h-screen"><Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} onClubChange={hc} onLogout={hl} clubName={clubs.find(c=>c.id===cid)?.name}/>
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-6xl mx-auto">
<div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">📝 Meetings</h1><button className="btn btn-primary" onClick={()=>ssh(!sh)}>{sh?'Cancel':'+ New Meeting'}</button></div>
{sh&&<div className="card mb-6"><h3 className="font-semibold mb-4">New Meeting</h3><div className="space-y-3"><input className="input" placeholder="Meeting title" value={f.title} onChange={e=>sf({...f,title:e.target.value})}/><input className="input" type="date" value={f.date} onChange={e=>sf({...f,date:e.target.value})}/><textarea className="textarea" placeholder="Notes or transcript..." value={f.notes} onChange={e=>sf({...f,notes:e.target.value})}/><button className="btn btn-primary" onClick={cr}>Create Meeting</button></div></div>}
{ld?<div className="space-y-3">{[1,2].map(i=><div key={i} className="card"><div className="skeleton h-6 w-48"/></div>)}</div>:meetings.length===0?<div className="empty-state"><div className="empty-state-icon">📝</div><p className="empty-state-title">No meetings yet</p><p className="empty-state-text">Create your first meeting</p></div>:<div className="space-y-3">{meetings.map(m=><div key={m.id} className="card"><h3 className="font-semibold">{m.title}</h3><p className="text-sm text-gray-500">{m.date?new Date(m.date).toLocaleDateString():''} · {m.participants?.length||0} participants</p>{m.notes&&<p className="text-sm text-gray-600 mt-2 line-clamp-2">{m.notes}</p>}{m.aiProcessed&&<span className="badge badge-green mt-2">✨ AI Processed</span>}</div>)}</div>}
</div></main></div>);}