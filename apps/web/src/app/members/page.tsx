'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,doc,getDoc,getDocs,query,where,addDoc,updateDoc}from'firebase/firestore';
import Sidebar from'@/components/Sidebar';
const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);

export default function MembersPage(){
const[user,su]=useState(null);const[ck,sc]=useState(false);const[clubs,scl]=useState([]);const[cid,scid]=useState(null);const[club,sclub]=useState(null);const[members,sm]=useState([]);const[rn,srn]=useState('');const[ld,sld]=useState(true);const[selectedMember,setSelected]=useState(null);const[ie,setIE]=useState('');const[ir,setIR]=useState('MEMBER');const[imsg,setMsg]=useState('');const[inv,setInv]=useState(false);

useEffect(()=>{const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});return()=>un();},[]);
useEffect(()=>{if(ck)L();},[ck]);

async function L(){try{const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));const sn=await getDocs(q);const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);scl(mc);if(mc.length>0){scid(mc[0].id);sclub(mc[0]);LM(mc[0].id);if(mc[0].membershipRole==='OWNER')srn('Owner');}}catch(e){}finally{sld(false);}}
async function LM(id){try{const ms=await getDocs(query(collection(db,'clubMembers'),where('clubId','==',id),where('status','==','ACTIVE')));sm(ms.docs.map(d=>({id:d.id,...d.data()})));}catch(e){}}
const invite=async()=>{if(!ie.trim()){setMsg('Enter email');return;}setInv(true);setMsg('');try{const uid='member_'+Date.now();await addDoc(collection(db,'clubMembers'),{clubId:cid,userId:uid,role:ir,status:'ACTIVE',joinedAt:new Date().toISOString(),displayName:ie.split('@')[0],email:ie.trim()});await addDoc(collection(db,'activityLogs'),{clubId:cid,userId:user.uid,userName:user.email,action:'MEMBER_ADDED',description:`${ie} added as ${ir}`,createdAt:new Date().toISOString()});setMsg('Added!');setIE('');if(cid)LM(cid);}catch(e:any){setMsg('Error: '+e.message);}setInv(false);};
const upRole=async(mid:string,r:string)=>{await updateDoc(doc(db,'clubMembers',mid),{role:r});if(cid)LM(cid);};
const remMember=async(mid:string)=>{if(!confirm('Remove this member?'))return;await updateDoc(doc(db,'clubMembers',mid),{status:'REMOVED'});if(cid)LM(cid);};
const hl=async()=>{await signOut(auth);window.location.href='/login';};const hc=async(id)=>{scid(id);sclub(clubs.find(x=>x.id===id));};
if(!user)return<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full"/></div>;
return(
<div className="flex min-h-screen">
<Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} clubRole={rn} onClubChange={hc} onLogout={hl} clubName={club?.name}/>
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-6xl mx-auto">
<h1 className="text-2xl font-bold mb-6">👥 Members</h1>
<div className="card mb-6">
<h3 className="font-semibold mb-4">Invite Member</h3>
<div className="flex gap-2 items-end">
<div className="flex-1"><input className="input" placeholder="Email address" value={ie} onChange={e=>setIE(e.target.value)}/></div>
<select className="select w-36" value={ir} onChange={e=>setIR(e.target.value)}>
<option value="ADMIN">Admin</option><option value="EVENT_HEAD">Event Head</option><option value="MEMBER">Member</option><option value="VOLUNTEER">Volunteer</option>
</select>
<button className="btn btn-primary" onClick={invite} disabled={inv}>{inv?'Adding...':'Add'}</button>
</div>
{imsg&&<p className="text-sm mt-2">{imsg}</p>}
</div>
{ld?<div className="space-y-3">{[1,2,3].map(i=><div key={i} className="card"><div className="skeleton h-6 w-48"/></div>)}</div>:members.length===0?<div className="empty-state"><div className="empty-state-icon">👥</div><p className="empty-state-title">No members</p><p className="empty-state-text">Invite members above</p></div>:<div className="space-y-2">{members.map(m=>(
<div key={m.id} className="card flex items-center justify-between hover:shadow-md">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-medium text-indigo-600">{(m.displayName||m.email||'?')[0].toUpperCase()}</div>
<div><p className="font-medium">{m.displayName||m.email||'Unknown'}</p><p className="text-xs text-gray-500">{m.email||''}</p></div>
</div>
<div className="flex items-center gap-2">
<span className={"badge "+(m.role==='OWNER'?'badge-red':m.role==='ADMIN'?'badge-blue':m.role==='EVENT_HEAD'?'badge-yellow':'badge-gray')}>{m.role||'Member'}</span>
<button className="btn btn-sm" onClick={()=>setSelected(m)}>Manage</button>
{m.role!=='OWNER'&&<button className="btn btn-sm btn-danger" onClick={()=>remMember(m.id)}>Remove</button>}
</div>
</div>))}</div>}
{selectedMember&&<div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal-content" onClick={e=>e.stopPropagation()}>
<h2 className="text-lg font-bold mb-4">Manage Access</h2>
<p className="font-medium mb-4">{selectedMember.displayName||selectedMember.email||'User'}</p>
<div className="mb-4"><label className="block text-sm font-medium mb-1">Role</label>
<select className="select" value={selectedMember.role||'MEMBER'} onChange={async(e)=>{await upRole(selectedMember.id,e.target.value);if(cid)LM(cid);setSelected(null);}}>
<option value="ADMIN">Admin</option><option value="EVENT_HEAD">Event Head</option><option value="MEMBER">Member</option><option value="VOLUNTEER">Volunteer</option>
</select></div>
<p className="text-sm text-gray-500">Changing the role updates their permissions.</p>
<button className="btn mt-4" onClick={()=>setSelected(null)}>Close</button></div></div>}
</div></main></div>);
}
