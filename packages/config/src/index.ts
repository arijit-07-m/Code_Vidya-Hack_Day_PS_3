export const config = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    provider: process.env.AI_PROVIDER || 'gemini',
  },
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:3001',
  },
} as const;

export const ROLES_HIERARCHY = {
  OWNER: 100,
  ADMIN: 80,
  EVENT_HEAD: 60,
  MEMBER: 40,
  VOLUNTEER: 20,
} as const;

export const ROLE_PERMISSIONS = {
  OWNER: ['*'],
  ADMIN: [
    'club:read', 'club:update',
    'member:read', 'member:add', 'member:remove', 'member:updateRole',
    'event:create', 'event:read', 'event:update', 'event:delete',
    'task:create', 'task:read', 'task:update', 'task:delete', 'task:assign',
    'volunteer:read', 'volunteer:assign',
    'meeting:create', 'meeting:read', 'meeting:update',
    'document:upload', 'document:read', 'document:delete',
    'risk:read', 'risk:update',
    'announcement:create', 'announcement:read',
    'ai:use', 'ai:configure',
    'analytics:read',
    'activity:read',
  ],
  EVENT_HEAD: [
    'club:read',
    'member:read',
    'event:read', 'event:update',
    'task:create', 'task:read', 'task:update', 'task:assign',
    'volunteer:read',
    'meeting:create', 'meeting:read',
    'document:read',
    'risk:read',
    'ai:use',
  ],
  MEMBER: [
    'club:read',
    'event:read',
    'task:read', 'task:update:assigned',
    'meeting:read',
    'document:read',
    'announcement:read',
    'ai:use',
  ],
  VOLUNTEER: [
    'club:read',
    'event:read',
    'task:read', 'task:update:assigned',
    'volunteer:read',
    'meeting:read',
    'ai:use',
  ],
} as const;

export const COLLECTIONS = {
  USERS: 'users',
  CLUBS: 'clubs',
  CLUB_MEMBERS: 'clubMembers',
  EVENTS: 'events',
  TASKS: 'tasks',
  VOLUNTEERS: 'volunteers',
  MEETINGS: 'meetings',
  MEETING_ACTION_ITEMS: 'meetingActionItems',
  DOCUMENTS: 'documents',
  DOCUMENT_CHUNKS: 'documentChunks',
  RISKS: 'risks',
  ANNOUNCEMENTS: 'announcements',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOGS: 'activityLogs',
  AI_ACTIONS: 'aiActions',
} as const;