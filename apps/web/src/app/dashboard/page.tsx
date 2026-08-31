'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,query,where,getDocs,orderBy,limit,doc,getDoc}from'firebase/firestore';
import Sidebar from'@/components/Sidebar';

const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);
const auth=getAuth(app);
const db=getFirestore(app);

export default function DashboardPage(){
const[user,su]=useState(null);
const[ck,sc]=useState(false);
const[clubs,scl]=useState([]);
const[cid,scid]=useState(null);
const[club,sclub]=useState(null);
const[ov,sov]=useState(null);
const[act,sact]=useState([]);
const[rn,srn]=useState('');
const[ld,sld]=useState(true);
const[gr,sgr]=useState('');

useEffect(()=>{
const h=new Date().getHours();
sgr(h<12?'Good morning':h<18?'Good afternoon':'Good evening');
const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});
return()=>un();
},[]);

useEffect(()=>{if(ck)L();},[ck]);

async function L(){try{
const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));
const sn=await getDocs(q);
const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);
scl(mc);
if(mc.length>0){const id=mc[0].id;scid(id);sclub(mc[0]);if(mc[0].membershipRole==='OWNER')srn('Owner');else if(mc[0].membershipRole==='ADMIN')srn('Admin');
const[ts,es,ms,rs,ls]=await Promise.all([getDocs(query(collection(db,'tasks'),where('clubId','==',id))),getDocs(query(collection(db,'events'),where('clubId','==',id))),getDocs(query(collection(db,'clubMembers'),where('clubId','==',id),where('status','==','ACTIVE'))),getDocs(query(collection(db,'risks'),where('clubId','==',id),where('status','==','OPEN'))),getDocs(query(collection(db,'activityLogs'),where('clubId','==',id),orderBy('createdAt','desc'),limit(10)))]);
const tasks=ts.docs.map(d=>d.data()as any);
const events=es.docs.map(d=>d.data()as any);
const now=new Date();
const total=tasks.length;
const completed=tasks.filter(t=>t.status==='COMPLETED').length;
const pending=tasks.filter(t=>t.status==='TODO'||t.status==='IN_PROGRESS').length;
const urgent=tasks.filter(t=>t.priority==='CRITICAL'&&t.status!=='COMPLETED').length;
const overdue=tasks.filter(t=>t.deadline&&new Date(t.deadline)<now&&t.status!=='COMPLETED').length;
sov({totalTasks:total,completedTasks:completed,pendingTasks:pending,urgentTasks:urgent,overdueTasks:overdue,activeEvents:events.filter(e=>e.status==='ACTIVE').length,upcomingEvents:events.filter(e=>e.status==='PLANNING').length,completionPercent:total>0?Math.round(completed/total*100):0,memberCount:ms.docs.length,openRisks:rs.docs.length});
sact(ls.docs.map(d=>({id:d.id,...d.data()})));}}catch(e){console.error(e);}finally{sld(false);}}

const hl=async()=>{await signOut(auth);window.location.href='/login';};
const hc=async(id)=>{scid(id);sclub(clubs.find(x=>x.id===id));};

if(!user)return(<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>);

return(
<div className="flex min-h-screen">
<Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} clubRole={rn} onClubChange={hc} onLogout={hl} clubName={club?.name} />
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-7xl mx-auto">
{ld?(<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i=>(<div key={i} className="card"><div className="skeleton h-4 w-24 mb-2" /><div className="skeleton h-8 w-16" /></div>))}</div>
):!cid?(<div className="text-center py-20"><div className="text-4xl mb-4">🎉</div><h2 className="text-2xl font-bold mb-2">Welcome to ClubOps AI!</h2><p className="text-gray-500 mb-6">Create your first club to get started</p><a href="/clubs/new" className="btn btn-primary btn-lg">Create Club</a></div>
):(<div>
<div className="flex items-center justify-between mb-6">
<div><h1 className="text-2xl font-bold">{gr}, {(user?.email?.split('@')[0])||'there'} 👋</h1><p className="text-gray-500 mt-1">{club?.name} · <span className="text-indigo-600 font-medium">{rn}</span></p></div>
<div className="flex gap-2"><a href={'/events?clubId='+cid} className="btn btn-primary btn-sm">+ Event</a><a href={'/tasks?clubId='+cid} className="btn btn-sm">+ Task</a></div>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
<div className="card"><p className="text-sm text-gray-500 mb-1">Active Events</p><p className="text-2xl font-bold">{ov?.activeEvents||0}</p></div>
<div className="card"><p className="text-sm text-gray-500 mb-1">Open Tasks</p><p className="text-2xl font-bold">{ov?.pendingTasks||0}</p>{ov?.urgentTasks>0&&(<span className="badge badge-red">{ov.urgentTasks} urgent</span>)}</div>
<div className="card"><p className="text-sm text-gray-500 mb-1">Risks</p><p className={'text-2xl font-bold '+(ov?.openRisks>0?'text-red-600':'text-green-600')}>{ov?.openRisks||0}</p></div>
<div className="card"><p className="text-sm text-gray-500 mb-1">Members</p><p className="text-2xl font-bold">{ov?.memberCount||0}</p></div>
</div>
{act.length>0&&(<div className="card"><div className="card-header"><h2 className="card-title">Recent Activity</h2></div>{act.slice(0,5).map(a=>(<div key={a.id} className="flex gap-3 p-2"><div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" /><div><p className="text-sm">{a.description}</p><p className="text-xs text-gray-400">{a.userName||'System'}</p></div></div>))}</div>)}
</div>)}
</div></main>
</div>);
}