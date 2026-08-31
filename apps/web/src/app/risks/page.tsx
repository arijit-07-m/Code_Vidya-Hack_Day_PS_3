'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,query,where,getDocs,orderBy,doc,getDoc}from'firebase/firestore';
import Sidebar from'@/components/Sidebar';
const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);

export default function RisksPage(){
const[user,su]=useState(null);const[ck,sc]=useState(false);const[clubs,scl]=useState([]);
const[cid,scid]=useState(null);const[risks,sr]=useState([]);const[ld,sld]=useState(true);
useEffect(()=>{const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});return()=>un();},[]);
useEffect(()=>{if(ck)L();},[ck]);
async function L(){const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));const sn=await getDocs(q);const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);scl(mc);if(mc.length>0){scid(mc[0].id);loadR(mc[0].id);}}
async function loadR(id){sld(true);try{const sn=await getDocs(query(collection(db,'risks'),where('clubId','==',id),orderBy('createdAt','desc')));sr(sn.docs.map(d=>({id:d.id,...d.data()})));}catch(e){}finally{sld(false);}}
const hl=async()=>{await signOut(auth);window.location.href='/login';};const hc=id=>{scid(id);loadR(id);};
const scClass=s=>s==='CRITICAL'?'badge-red':s==='HIGH'?'badge-yellow':s==='MEDIUM'?'badge-blue':'badge-gray';
if(!user)return<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full"/></div>;
return(<div className="flex min-h-screen"><Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} onClubChange={hc} onLogout={hl} clubName={clubs.find(c=>c.id===cid)?.name}/>
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-6xl mx-auto">
<h1 className="text-2xl font-bold mb-6">⚠️ Risk Center</h1>
{ld?<div className="skeleton h-32"/>:risks.length===0?<div className="empty-state"><div className="empty-state-icon">✅</div><p className="empty-state-title">No risks detected</p><p className="empty-state-text">Run AI risk analysis from the event page</p></div>:<div className="space-y-3">{risks.map(r=><div key={r.id} className="card"><div className="flex items-center gap-2 mb-2"><span className={"badge "+scClass(r.severity)}>{r.severity}</span><h3 className="font-semibold">{r.title}</h3></div><p className="text-sm text-gray-600 mb-2">{r.description}</p>{r.why&&<p className="text-sm text-gray-500 mb-1">📌 {r.why}</p>}{r.recommendation&&<p className="text-sm text-blue-600">💡 {r.recommendation}</p>}</div>)}</div>}
</div></main></div>);}