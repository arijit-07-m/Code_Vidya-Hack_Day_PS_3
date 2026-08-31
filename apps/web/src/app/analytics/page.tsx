'use client';
import{useState,useEffect}from'react';
import{initializeApp,getApps}from'firebase/app';
import{getAuth,signOut,onAuthStateChanged}from'firebase/auth';
import{getFirestore,collection,query,where,getDocs,doc,getDoc}from'firebase/firestore';
import{BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer}from'recharts';
import Sidebar from'@/components/Sidebar';
const cfg={apiKey:"AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",authDomain:"code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",projectId:"code-vidya-hack-day-ps-3-6b47d"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);

export default function AnalyticsPage(){
const[user,su]=useState(null);const[ck,sc]=useState(false);const[clubs,scl]=useState([]);
const[cid,scid]=useState(null);const[ov,sov]=useState(null);const[ld,sld]=useState(true);
useEffect(()=>{const un=onAuthStateChanged(auth,u=>{if(!u){window.location.href='/login';return;}su(u);sc(true);});return()=>un();},[]);
useEffect(()=>{if(ck)L();},[ck]);
async function L(){const q=query(collection(db,'clubMembers'),where('userId','==',user.uid),where('status','==','ACTIVE'));const sn=await getDocs(q);const mc=(await Promise.all(sn.docs.map(async d=>{const m=d.data()as any;const c=await getDoc(doc(db,'clubs',m.clubId));if(!c.exists())return null;return{id:c.id,...c.data(),membershipRole:m.role};}))).filter(Boolean);scl(mc);if(mc.length>0){scid(mc[0].id);loadA(mc[0].id);}}
async function loadA(id){sld(true);try{const[ts,es,ms,rs]=await Promise.all([getDocs(query(collection(db,'tasks'),where('clubId','==',id))),getDocs(query(collection(db,'events'),where('clubId','==',id))),getDocs(query(collection(db,'clubMembers'),where('clubId','==',id),where('status','==','ACTIVE'))),getDocs(query(collection(db,'risks'),where('clubId','==',id),where('status','==','OPEN')))]);const tasks=ts.docs.map(d=>d.data());const total=tasks.length;const completed=tasks.filter(t=>t.status==='COMPLETED').length;const pending=tasks.filter(t=>t.status==='TODO'||t.status==='IN_PROGRESS').length;sov({totalTasks:total,completedTasks:completed,pendingTasks:pending,activeEvents:es.docs.filter(d=>d.data().status==='ACTIVE').length,memberCount:ms.docs.length,openRisks:rs.docs.length,completionPercent:total>0?Math.round(completed/total*100):0,chartData:[{name:'Completed',value:completed},{name:'Pending',value:pending},{name:'Blocked',value:tasks.filter(t=>t.status==='BLOCKED').length}]});}catch(e){}finally{sld(false);}}
const hl=async()=>{await signOut(auth);window.location.href='/login';};const hc=id=>{scid(id);loadA(id);};
if(!user)return<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full"/></div>;
return(<div className="flex min-h-screen"><Sidebar clubs={clubs} currentClubId={cid||''} userDisplayName={user?.email?.split('@')[0]} onClubChange={hc} onLogout={hl} clubName={clubs.find(c=>c.id===cid)?.name}/>
<main className="flex-1 bg-gray-50 overflow-y-auto p-6"><div className="max-w-6xl mx-auto"><h1 className="text-2xl font-bold mb-6">📊 Analytics</h1>
{ld?<div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="card"><div className="skeleton h-4 w-24 mb-2"/><div className="skeleton h-8 w-16"/></div>)}</div>:<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="card"><h3 className="font-semibold mb-4">Task Completion</h3><div className="text-4xl font-bold mb-2">{ov?.completionPercent||0}%</div><div className="progress-bar"><div className={"progress-bar-fill "+((ov?.completionPercent||0)>70?'green':(ov?.completionPercent||0)>40?'yellow':'red')} style={{width:(ov?.completionPercent||0)+'%'}}/></div><div className="flex justify-between text-sm mt-2"><span>{ov?.completedTasks||0} completed</span><span>{ov?.totalTasks||0} total</span></div></div>
<div className="card"><h3 className="font-semibold mb-4">Status Breakdown</h3><ResponsiveContainer width="100%" height={200}><BarChart data={ov?.chartData||[]}><XAxis dataKey="name" fontSize={12}/><YAxis fontSize={12}/><Tooltip/><Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
<div className="card"><h3 className="font-semibold mb-4">Events</h3><div className="space-y-3"><div className="flex justify-between"><span>📅 Active</span><span className="font-semibold">{ov?.activeEvents||0}</span></div><div className="flex justify-between"><span>👥 Members</span><span className="font-semibold">{ov?.memberCount||0}</span></div><div className="flex justify-between"><span>⚠️ Open Risks</span><span className="font-semibold text-red-600">{ov?.openRisks||0}</span></div></div></div>
<div className="card"><h3 className="font-semibold mb-4">Task Status</h3><div className="space-y-3"><div className="flex justify-between"><span>✅ Completed</span><span className="font-semibold text-green-600">{ov?.completedTasks||0}</span></div><div className="flex justify-between"><span>⏳ In Progress</span><span className="font-semibold text-blue-600">{ov?.pendingTasks||0}</span></div></div></div>
</div>}
</div></main></div>);}