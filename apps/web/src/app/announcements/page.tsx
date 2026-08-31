'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,addDoc,query,where,getDocs,orderBy,doc,getDoc}from'firebase/firestore';
import Sidebar from'@/components/Sidebar';
const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);

export default function AnnouncementsPage(){
const[user,su]=useState(null);const[ck,sc]=useState(false);const[clubs,scl]=useState([]);
const[cid,scid]=useState(null);const[announcements,sa]=useState([]);const[ld,sld]=useState(true);const[sh,ssh]=useState(false);
const[title,st]=useState('');const[content,scnt]=useState('');
useEffect(()=>{const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});return()=>un();},[]);
useEffect(()=>{if(ck)L();},[ck]);
async function L(){const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));const sn=await getDocs(q);const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);scl(mc);if(mc.length>0){scid(mc[0].id);loadA(mc[0].id);}}
async function loadA(id){sld(true);try{const sn=await getDocs(query(collection(db,'announcements'),where('clubId','==',id),orderBy('createdAt','desc')));sa(sn.docs.map(d=>({id:d.id,...d.data()})));}catch(e){}finally{sld(false);}}
async function cr(){await addDoc(collection(db,'announcements'),{clubId:cid,title,content,type:'general',createdBy:user.uid,createdAt:new Date().toISOString()});ssh(false);st('');scnt('');if(cid)loadA(cid);}
const hl=async()=>{await signOut(auth);window.location.href='/login';};const hc=id=>{scid(id);loadA(id);};
if(!user)return<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full"/></div>;
return(<div className="flex min-h-screen"><Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} onClubChange={hc} onLogout={hl} clubName={clubs.find(c=>c.id===cid)?.name}/>
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-6xl mx-auto"><div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">📢 Announcements</h1><button className="btn btn-primary" onClick={()=>ssh(!sh)}>{sh?'Cancel':'+ Create'}</button></div>
{sh&&<div className="card mb-6"><h3 className="font-semibold mb-4">New Announcement</h3><div className="space-y-3"><input className="input" placeholder="Title" value={title} onChange={e=>st(e.target.value)}/><textarea className="textarea" placeholder="Content..." value={content} onChange={e=>scnt(e.target.value)} rows={4}/><button className="btn btn-primary" onClick={cr}>Create</button></div></div>}
{ld?<div className="space-y-3">{[1].map(i=><div key={i} className="card"><div className="skeleton h-6 w-48"/></div>)}</div>:announcements.length===0?<div className="empty-state"><div className="empty-state-icon">📢</div><p className="empty-state-title">No announcements yet</p></div>:<div className="space-y-3">{announcements.map(a=><div key={a.id} className="card"><h3 className="font-semibold">{a.title}</h3><p className="text-sm text-gray-600 mt-1">{a.content}</p><p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString()}</p></div>)}</div>}
</div></main></div>);}