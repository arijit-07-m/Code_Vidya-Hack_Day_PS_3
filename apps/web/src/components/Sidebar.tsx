'use client';
import BottomNav from './BottomNav'

import React, { useState } from 'react';
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
  clubName,
  userDisplayName,
  clubRole,
  clubs = [],
  currentClubId,
  userPermissions = [],
  onClubChange,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const [showClubSwitcher, setShowClubSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, text: '🔴 High priority task assigned: Arrange projector', time: '5m ago', read: false },
    { id: 2, text: '⚠️ Risk detected: Backup venue not confirmed', time: '12m ago', read: false },
    { id: 3, text: '✓ Task completed: Participant list finalized', time: '1h ago', read: true },
    { id: 4, text: '👤 New member joined: rahul@college.edu', time: '2h ago', read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const initials = (userDisplayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const canSee = (perm?: Permission) => {
    // If no permissions loaded yet, show everything
    if (userPermissions.length === 0) return true;
    // If no permission required, show
    if (!perm) return true;
    // Check permission
    return userPermissions.includes(perm);
  };

  const sections = [
    { key: 'main', label: 'MAIN', items: NAV_ITEMS.filter((i) => i.section === 'main' && canSee(i.permission)) },
    { key: 'knowledge', label: 'KNOWLEDGE', items: NAV_ITEMS.filter((i) => i.section === 'knowledge' && canSee(i.permission)) },
    { key: 'operations', label: 'OPERATIONS', items: NAV_ITEMS.filter((i) => i.section === 'operations' && canSee(i.permission)) },
    { key: 'ai', label: 'AI', items: NAV_ITEMS.filter((i) => i.section === 'ai' && canSee(i.permission)) },
    { key: 'analytics', label: 'ANALYTICS', items: NAV_ITEMS.filter((i) => i.section === 'analytics' && canSee(i.permission)) },
    { key: 'settings', label: 'SETTINGS', items: NAV_ITEMS.filter((i) => i.section === 'settings' && canSee(i.permission)) },
  ];

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const inner = (
    <>
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm tracking-wider">CA</span>
          </div>
          <div>
            <span className="font-bold text-base text-gray-900 tracking-tight">ClubOps AI</span>
            <span className="block text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
              Operating System
            </span>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 relative transition-colors"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-600 hover:underline font-medium"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2 rounded-lg text-xs transition-colors ${
                      n.read ? 'bg-gray-50 text-gray-600' : 'bg-indigo-50/60 text-indigo-950 font-medium border border-indigo-100'
                    }`}
                  >
                    <p className="line-clamp-2">{n.text}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Club Switcher */}
      <div className="relative px-3 pt-3">
        <button
          onClick={() => setShowClubSwitcher(!showClubSwitcher)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/60 transition-colors"
        >
          <span className="text-xs font-semibold truncate flex items-center gap-2 text-gray-800">
            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
            {clubName || 'Select Club Workspace'}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showClubSwitcher && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto animate-fadeIn">
            {clubs.map((c: any) => (
              <button
                key={c.id}
                onClick={() => {
                  onClubChange?.(c.id);
                  setShowClubSwitcher(false);
                }}
                className={`w-full text-left p-2.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${
                  currentClubId === c.id ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'
                }`}
              >
                <span>{c.membershipRole === 'OWNER' ? '👑' : '🧑'}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
            <a
              href="/clubs/new"
              className="block p-2.5 text-xs text-indigo-600 font-semibold border-t border-gray-100 hover:bg-gray-50"
              onClick={() => setShowClubSwitcher(false)}
            >
              + Create New Club
            </a>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {sections
          .filter((s) => s.items.length > 0)
          .map((section) => (
            <div key={section.key}>
              <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + '/') ||
                    (item.href === '/ai-assistant' && pathname === '/ai');
                  return (
                    <a
                      key={item.href}
                      href={currentClubId ? `${item.href}?clubId=${currentClubId}` : item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-3 p-1.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {userDisplayName || 'User'}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{clubRole || 'Member'}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top bar trigger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-md text-gray-700"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 h-screen flex-col shrink-0 sticky top-0">
        {inner}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40 animate-fadeIn"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col animate-slideRight">
            {inner}
          </aside>
        </>
      )}
    </>
  );
}