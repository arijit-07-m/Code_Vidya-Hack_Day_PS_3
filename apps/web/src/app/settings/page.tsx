'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,doc,getDoc,getDocs,query,where,addDoc,updateDoc}from'firebase/firestore';
import Sidebar from'@/components/Sidebar';
const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);

export default function SettingsPage(){
const[user,su]=useState(null);const[ck,sc]=useState(false);const[clubs,scl]=useState([]);const[cid,scid]=useState(null);const[club,sclub]=useState(null);const[tab,st]=useState('members');
const[members,sm]=useState([]);const[rn,srn]=useState('');const[ie,setIE]=useState('');const[ir,setIR]=useState('MEMBER');const[imsg,setMsg]=useState('');const[inv,setInv]=useState(false);
useEffect(()=>{const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});return()=>un();},[]);
useEffect(()=>{if(ck)L();},[ck]);
async function L(){try{const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));const sn=await getDocs(q);const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);scl(mc);if(mc.length>0){scid(mc[0].id);sclub(mc[0]);LM(mc[0].id);if(mc[0].membershipRole==='OWNER')srn('Owner');}}catch(e){}}
async function LM(id){try{const ms=await getDocs(query(collection(db,'clubMembers'),where('clubId','==',id),where('status','==','ACTIVE')));sm(ms.docs.map(d=>({id:d.id,...d.data()})));}catch(e){}}
const invite=async()=>{if(!ie.trim()){setMsg('Enter email');return;}setInv(true);setMsg('');try{const uid='member_'+Date.now();await addDoc(collection(db,'clubMembers'),{clubId:cid,userId:uid,role:ir,status:'ACTIVE',joinedAt:new Date().toISOString(),displayName:ie.split('@')[0],email:ie.trim()});await addDoc(collection(db,'activityLogs'),{clubId:cid,userId:user.uid,userName:user.email,action:'MEMBER_ADDED',description:`${ie} added as ${ir}`,createdAt:new Date().toISOString()});setMsg('Added!');setIE('');if(cid)LM(cid);}catch(e:any){setMsg('Error: '+e.message);}setInv(false);};
const upRole=async(mid:string,r:string)=>{await updateDoc(doc(db,'clubMembers',mid),{role:r});if(cid)LM(cid);};
const remMember=async(mid:string)=>{if(!confirm('Remove?'))return;await updateDoc(doc(db,'clubMembers',mid),{status:'REMOVED'});if(cid)LM(cid);};
const hl=async()=>{await signOut(auth);window.location.href='/login';};const hc=async(id)=>{scid(id);sclub(clubs.find(x=>x.id===id));};
if(!user)return<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full"/></div>;
return(
<div className="flex min-h-screen">
<Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} clubRole={rn} onClubChange={hc} onLogout={hl} clubName={club?.name}/>
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-5xl mx-auto">
<h1 className="text-2xl font-bold mb-6">Settings</h1>
<div className="tabs mb-6">
<button className={"tab"+(tab==='members'?' active':'')} onClick={()=>st('members')}>Members</button>
<button className={"tab"+(tab==='roles'?' active':'')} onClick={()=>st('roles')}>Roles</button>
</div>
{tab==='members'&&(
<div>
<div className="card mb-6">
<h3 className="font-semibold mb-4">Invite Member</h3>
<div className="space-y-3">
<input className="input" placeholder="Name" value={ie} onChange={e=>setIE(e.target.value)}/>
<div className="flex gap-2">
<select className="select w-36" value={ir} onChange={e=>setIR(e.target.value)}>
<option value="ADMIN">Admin</option><option value="EVENT_HEAD">Event Head</option><option value="MEMBER">Member</option><option value="VOLUNTEER">Volunteer</option>
</select>
<button className="btn btn-primary" onClick={invite} disabled={inv}>{inv?'Adding...':'Add Member'}</button>
</div>
{imsg&&<p className="text-sm">{imsg}</p>}
</div></div>
<div className="space-y-2">{members.map(m=>(
<div key={m.id} className="card flex items-center justify-between p-3">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-medium text-indigo-600">{(m.displayName||m.email||'?')[0].toUpperCase()}</div>
<div><p className="font-medium">{m.displayName||m.email||'User'}</p><p className="text-xs text-gray-500">{m.email||''}</p></div>
</div>
<div className="flex items-center gap-2">
<span className="badge badge-blue">{m.role||'Member'}</span>
{m.role!=='OWNER'&&<button className="btn btn-sm btn-danger" onClick={()=>remMember(m.id)}>Remove</button>}
</div>
</div>))}
{members.length===0&&<p className="text-sm text-gray-400 text-center py-8">No members yet. Add someone above!</p>}
</div></div>)}
{tab==='roles'&&(<div><p className="text-sm text-gray-500 mb-4">Roles define member permissions.</p><div className="card mb-4"><div className="p-3 bg-gray-50 rounded-lg mb-2"><p className="font-semibold">Owner</p><p className="text-sm text-gray-500">Full access</p></div><div className="p-3 bg-gray-50 rounded-lg"><p className="font-semibold">Admin</p><p className="text-sm text-gray-500">Club management</p></div></div></div>)}
</div></main></div>);
}
