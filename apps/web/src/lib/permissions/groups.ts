import { Permission } from './types';

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: 'Club', permissions: ['VIEW_CLUB', 'EDIT_CLUB'] },
  { label: 'Members', permissions: ['VIEW_MEMBERS', 'INVITE_MEMBERS', 'REMOVE_MEMBERS', 'MANAGE_MEMBER_ROLES', 'MANAGE_MEMBER_PERMISSIONS'] },
  { label: 'Events', permissions: ['VIEW_EVENTS', 'CREATE_EVENTS', 'EDIT_EVENTS', 'DELETE_EVENTS', 'MANAGE_EVENTS'] },
  { label: 'Tasks', permissions: ['VIEW_TASKS', 'CREATE_TASKS', 'EDIT_TASKS', 'DELETE_TASKS', 'ASSIGN_TASKS', 'MANAGE_TASKS'] },
  { label: 'Volunteers', permissions: ['VIEW_VOLUNTEERS', 'MANAGE_VOLUNTEERS', 'ASSIGN_VOLUNTEERS'] },
  { label: 'Meetings', permissions: ['VIEW_MEETINGS', 'CREATE_MEETINGS', 'EDIT_MEETINGS', 'DELETE_MEETINGS', 'MANAGE_MEETINGS'] },
  { label: 'Documents', permissions: ['VIEW_DOCUMENTS', 'UPLOAD_DOCUMENTS', 'DELETE_DOCUMENTS', 'MANAGE_DOCUMENTS'] },
  { label: 'Risks', permissions: ['VIEW_RISKS', 'CREATE_RISKS', 'MANAGE_RISKS', 'RESOLVE_RISKS'] },
  { label: 'Announcements', permissions: ['VIEW_ANNOUNCEMENTS', 'CREATE_ANNOUNCEMENTS', 'EDIT_ANNOUNCEMENTS', 'PUBLISH_ANNOUNCEMENTS', 'DELETE_ANNOUNCEMENTS'] },
  { label: 'AI', permissions: ['USE_AI', 'ANALYZE_MEETINGS', 'USE_AI_ACTIONS', 'RUN_RISK_ANALYSIS', 'MANAGE_KNOWLEDGE_BASE'] },
  { label: 'Analytics', permissions: ['VIEW_ANALYTICS'] },
  { label: 'Administration', permissions: ['MANAGE_CLUB_SETTINGS', 'MANAGE_ROLES', 'TRANSFER_OWNERSHIP'] },
];

export interface NavItemDef {
  href: string; label: string; icon: string;
  permission?: Permission; section: 'main' | 'knowledge' | 'ai' | 'analytics' | 'settings';
}

export const NAV_ITEMS: NavItemDef[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠', section: 'main' },
  { href: '/events', label: 'Events', icon: '📅', permission: 'VIEW_EVENTS', section: 'main' },
  { href: '/tasks', label: 'Tasks', icon: '✅', permission: 'VIEW_TASKS', section: 'main' },
  { href: '/members', label: 'Members', icon: '👥', permission: 'VIEW_MEMBERS', section: 'main' },
  { href: '/volunteers', label: 'Volunteers', icon: '🤝', permission: 'VIEW_VOLUNTEERS', section: 'main' },
  { href: '/meetings', label: 'Meetings', icon: '📝', permission: 'VIEW_MEETINGS', section: 'main' },
  { href: '/documents', label: 'Documents', icon: '📄', permission: 'VIEW_DOCUMENTS', section: 'knowledge' },
  { href: '/risks', label: 'Risks', icon: '⚠️', permission: 'VIEW_RISKS', section: 'knowledge' },
  { href: '/announcements', label: 'Announcements', icon: '📢', permission: 'VIEW_ANNOUNCEMENTS', section: 'knowledge' },
  { href: '/ai-assistant', label: 'AI Assistant', icon: '✨', permission: 'USE_AI', section: 'ai' },
  { href: '/analytics', label: 'Analytics', icon: '📊', permission: 'VIEW_ANALYTICS', section: 'analytics' },
  { href: '/settings', label: 'Settings', icon: '⚙️', permission: 'MANAGE_CLUB_SETTINGS', section: 'settings' },
];