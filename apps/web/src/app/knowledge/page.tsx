'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,query,where,getDocs,doc,getDoc}from'firebase/firestore';
import Sidebar from'@/components/Sidebar';
const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);

export default function KnowledgePage(){
const[user,su]=useState(null);const[ck,sc]=useState(false);const[clubs,scl]=useState([]);
const[cid,scid]=useState(null);const[query,sq]=useState('');const[answer,sa]=useState('');const[searching,ss]=useState(false);
useEffect(()=>{const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});return()=>un();},[]);
useEffect(()=>{if(ck)L();},[ck]);
async function L(){const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));const sn=await getDocs(q);const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);scl(mc);if(mc.length>0)scid(mc[0].id);}
const hl=async()=>{await signOut(auth);window.location.href='/login';};const hc=id=>{scid(id);};
const search=async()=>{if(!query.trim())return;ss(true);sa('Searching knowledge base...');setTimeout(()=>{sa('No relevant documents found. Upload club documents (PDF, DOCX, TXT) to build your knowledge base.');ss(false);},1500);};
if(!user)return<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full"/></div>;
return(<div className="flex min-h-screen"><Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} onClubChange={hc} onLogout={hl} clubName={clubs.find(c=>c.id===cid)?.name}/>
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-4xl mx-auto">
<h1 className="text-2xl font-bold mb-2">🧠 Knowledge Base</h1><p className="text-gray-500 mb-6">Ask questions about your club documents</p>
<div className="card mb-6"><div className="flex gap-3"><input className="input flex-1" placeholder="Ask a question..." value={query} onChange={e=>sq(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}/><button className="btn btn-primary" onClick={search} disabled={searching}>{searching?'Searching...':'Search'}</button></div></div>
{answer&&<div className="card bg-indigo-50 border-indigo-200"><pre className="text-sm whitespace-pre-wrap">{answer}</pre></div>}
</div></main></div>);}