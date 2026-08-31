'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/permissions/groups';
import type { Permission } from '@/lib/permissions/types';

interface SidebarProps {
  clubName?: string;
  userDisplayName?: string;
  userEmail?: string;
  clubRole?: string;
  clubs?: { id: string; name: string; membershipRole: string }[];
  currentClubId?: string;
  userPermissions?: Permission[];
  onClubChange?: (clubId: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({
  clubName, userDisplayName, clubRole,
  clubs = [], currentClubId, userPermissions = [],
  onClubChange, onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const [showClubSwitcher, setShowClubSwitcher] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = (userDisplayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const canSee = (perm?: Permission) => !perm || userPermissions.includes(perm);

  const sections = [
    { key: 'main', label: 'Main', items: NAV_ITEMS.filter(i => i.section === 'main' && canSee(i.permission)) },
    { key: 'knowledge', label: 'Knowledge', items: NAV_ITEMS.filter(i => i.section === 'knowledge' && canSee(i.permission)) },
    { key: 'ai', label: 'AI', items: NAV_ITEMS.filter(i => i.section === 'ai' && canSee(i.permission)) },
    { key: 'analytics', label: 'Analytics', items: NAV_ITEMS.filter(i => i.section === 'analytics' && canSee(i.permission)) },
    { key: 'settings', label: '', items: NAV_ITEMS.filter(i => i.section === 'settings' && canSee(i.permission)) },
  ];
const inner = (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CA</span>
          </div>
          <span className="font-semibold text-lg">ClubOps AI</span>
        </div>
      </div>
      <div className="relative px-3 pt-3">
        <button onClick={() => setShowClubSwitcher(!showClubSwitcher)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100">
          <span className="text-sm font-medium truncate flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
            {clubName || 'Select Club'}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {showClubSwitcher && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {clubs.map((c: any) => (
              <button key={c.id} onClick={() => { onClubChange?.(c.id); setShowClubSwitcher(false); }}
                className={`w-full text-left p-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${currentClubId === c.id ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                <span>{c.membershipRole === 'OWNER' ? '👑' : '🧑'}</span><span className="truncate">{c.name}</span>
              </button>
            ))}
            <Link href="/clubs/new" className="block p-2.5 text-sm text-indigo-600 border-t border-gray-100 hover:bg-gray-50" onClick={() => setShowClubSwitcher(false)}>+ Create New Club</Link>
          </div>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {sections.filter(s => s.items.length > 0).map(section => (
          <div key={section.key}>
            {section.label && <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{section.label}</p>}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={currentClubId ? `${item.href}?clubId=${currentClubId}` : item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setMobileOpen(false)}>
                    <span className="text-lg">{item.icon}</span><span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userDisplayName || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{clubRole || ''}</p>
          </div>
          <button onClick={onLogout} className="text-gray-400 hover:text-red-500 p-1 rounded" title="Sign out">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-50 btn btn-icon bg-white shadow-md">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
      </button>
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 min-h-screen flex-col">{inner}</aside>
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl flex flex-col">{inner}</aside>
        </>
      )}
    </>
  );
}