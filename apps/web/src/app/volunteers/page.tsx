'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,query,where,getDocs,doc,getDoc}from'firebase/firestore';
import Sidebar from'@/components/Sidebar';
const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);

export default function VolunteersPage(){
const[user,su]=useState(null);const[ck,sc]=useState(false);const[clubs,scl]=useState([]);
const[cid,scid]=useState(null);const[members,sm]=useState([]);const[ld,sld]=useState(true);
useEffect(()=>{const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});return()=>un();},[]);
useEffect(()=>{if(ck)L();},[ck]);
async function L(){const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));const sn=await getDocs(q);const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);scl(mc);if(mc.length>0){scid(mc[0].id);loadM(mc[0].id);}}
async function loadM(id){sld(true);try{const sn=await getDocs(query(collection(db,'clubMembers'),where('clubId','==',id),where('status','==','ACTIVE')));sm(sn.docs.map(d=>({id:d.id,...d.data()})));}catch(e){}finally{sld(false);}}
const hl=async()=>{await signOut(auth);window.location.href='/login';};const hc=id=>{scid(id);loadM(id);};
if(!user)return<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full"/></div>;
return(<div className="flex min-h-screen"><Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} onClubChange={hc} onLogout={hl} clubName={clubs.find(c=>c.id===cid)?.name}/>
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-6xl mx-auto">
<h1 className="text-2xl font-bold mb-6">👥 Members & Volunteers</h1>
{ld?<div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="card"><div className="skeleton h-12 w-12 rounded-full mb-2"/><div className="skeleton h-4 w-24"/></div>)}</div>:members.length===0?<div className="empty-state"><div className="empty-state-icon">👥</div><p className="empty-state-title">No members yet</p></div>:<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{members.map(m=><div key={m.id} className="card"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">{(m.displayName||m.email||'?')[0]}</div><div><p className="font-medium">{m.displayName||'Unknown'}</p><p className="text-xs text-gray-500">{m.email||''}</p></div></div><span className="badge badge-blue">{m.role||'Member'}</span></div>)}</div>}
</div></main></div>);}