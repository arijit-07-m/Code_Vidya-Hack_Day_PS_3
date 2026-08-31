'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/events', label: 'Events', icon: '📅' },
  { href: '/tasks', label: 'Tasks', icon: '✅' },
  { href: '/volunteers', label: 'Volunteers', icon: '👥' },
  { href: '/meetings', label: 'Meetings', icon: '📝' },
  { href: '/documents', label: 'Documents', icon: '📄' },
  { href: '/risks', label: 'Risks', icon: '⚠️' },
  { href: '/announcements', label: 'Announcements', icon: '📢' },
  { href: '/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

interface SidebarProps {
  clubName?: string;
  clubs?: { id: string; name: string; membershipRole: string }[];
  currentClubId?: string;
  onClubChange?: (clubId: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({
  clubName,
  clubs = [],
  currentClubId,
  onClubChange,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const [showClubSwitcher, setShowClubSwitcher] = useState(false);
  const { profile } = useAuth();

  const initials = profile?.displayName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CA</span>
          </div>
          <span className="font-semibold text-lg">ClubOps AI</span>
        </div>
      </div>

      {/* Club Switcher */}
      <div className="relative px-3 pt-3">
        <button
          onClick={() => setShowClubSwitcher(!showClubSwitcher)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm font-medium truncate">{clubName || 'Select Club'}</span>
          <span className="text-xs">▼</span>
        </button>

        {showClubSwitcher && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {clubs.map((club: any) => (
              <button
                key={club.id}
                onClick={() => {
                  onClubChange?.(club.id);
                  setShowClubSwitcher(false);
                }}
                className={`w-full text-left p-2 text-sm hover:bg-gray-50 ${
                  currentClubId === club.id ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <span className="mr-2">
                  {club.membershipRole === 'OWNER' ? '👑' : '🧑'}
                </span>
                {club.name}
              </button>
            ))}
            <Link
              href="/clubs/new"
              className="block p-2 text-sm text-blue-600 border-t border-gray-100 hover:bg-gray-50"
              onClick={() => setShowClubSwitcher(false)}
            >
              + Create New Club
            </Link>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={currentClubId ? `${item.href}?clubId=${currentClubId}` : item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* User */}
      <div className="p-3 border-t border-gray-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{profile?.displayName || 'User'}</p>
          <p className="text-xs text-gray-500 truncate">{profile?.email || ''}</p>
        </div>
        <button onClick={onLogout} className="text-xs text-gray-400 hover:text-red-500" title="Sign out">
          ⏻
        </button>
      </div>

      {showClubSwitcher && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowClubSwitcher(false)}
        />
      )}
    </aside>
  );
}