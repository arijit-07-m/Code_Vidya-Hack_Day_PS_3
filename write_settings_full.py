import os

p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/settings/page.tsx'

content = """'use client';
import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import Sidebar from '@/components/Sidebar';
const cfg = { apiKey: "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro", authDomain: "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com", projectId: "code-vidya-hack-day-ps-3-6b47d" };
const app = getApps().length ? getApps()[0] : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);
const pG = [
  ['Club', ['VIEW_CLUB', 'EDIT_CLUB']],
  ['Members', ['VIEW_MEMBERS', 'INVITE_MEMBERS', 'REMOVE_MEMBERS', 'MANAGE_MEMBER_ROLES', 'MANAGE_MEMBER_PERMISSIONS']],
  ['Events', ['VIEW_EVENTS', 'CREATE_EVENTS', 'EDIT_EVENTS', 'DELETE_EVENTS', 'MANAGE_EVENTS']],
  ['Tasks', ['VIEW_TASKS', 'CREATE_TASKS', 'EDIT_TASKS', 'DELETE_TASKS', 'ASSIGN_TASKS', 'MANAGE_TASKS']],
  ['Volunteers', ['VIEW_VOLUNTEERS', 'MANAGE_VOLUNTEERS', 'ASSIGN_VOLUNTEERS']],
  ['Meetings', ['VIEW_MEETINGS', 'CREATE_MEETINGS', 'EDIT_MEETINGS', 'DELETE_MEETINGS', 'MANAGE_MEETINGS']],
  ['Documents', ['VIEW_DOCUMENTS', 'UPLOAD_DOCUMENTS', 'DELETE_DOCUMENTS', 'MANAGE_DOCUMENTS']],
  ['Risks', ['VIEW_RISKS', 'CREATE_RISKS', 'MANAGE_RISKS', 'RESOLVE_RISKS']],
  ['Announcements', ['VIEW_ANNOUNCEMENTS', 'CREATE_ANNOUNCEMENTS', 'EDIT_ANNOUNCEMENTS', 'PUBLISH_ANNOUNCEMENTS', 'DELETE_ANNOUNCEMENTS']],
  ['AI', ['USE_AI', 'ANALYZE_MEETINGS', 'USE_AI_ACTIONS', 'RUN_RISK_ANALYSIS', 'MANAGE_KNOWLEDGE_BASE']],
  ['Analytics', ['VIEW_ANALYTICS']],
  ['Administration', ['MANAGE_CLUB_SETTINGS', 'MANAGE_ROLES', 'TRANSFER_OWNERSHIP']],
];
const pretty = (p: string) => p.replace(/_/g, ' ').toLowerCase().replace(/\\b\\w/g, (c: string) => c.toUpperCase());

export default function SettingsPage() {
  const [user, su] = useState<any>(null);
  const [checked, sc] = useState(false);
  const [clubs, scl] = useState<any[]>([]);
  const [cid, scid] = useState<string | null>(null);
  const [club, sclub] = useState<any>(null);
  const [tab, st] = useState('members');
  const [members, sm] = useState<any[]>([]);
  const [roles, sr] = useState<any[]>([]);
  const [rn, srn] = useState('');
  const [ie, setIE] = useState('');
  const [ir, setIR] = useState('MEMBER');
  const [imsg, setMsg] = useState('');
  const [inv, setInv] = useState(false);
  const [rf, setRF] = useState({ name: '', description: '', permissions: [] as string[] });
  const [er, setER] = useState<any>(null);
  useEffect(() => { const un = onAuthStateChanged(auth, (u: any) => { if (!u) { window.location.href = '/login'; return; } su(u); sc(true); }); return () => un(); }, []);
  useEffect(() => { if (checked) L(); }, [checked]);
"""

with open(p, 'w') as f:
    f.write(content)

print('Part 1 written: ' + str(os.path.getsize(p)) + ' bytes')