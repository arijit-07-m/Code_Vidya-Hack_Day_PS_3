export type UserRole = 'OWNER' | 'ADMIN' | 'EVENT_HEAD' | 'MEMBER' | 'VOLUNTEER';

export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'REMOVED';

export type EventStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskStatus = 'OPEN' | 'MITIGATED' | 'RESOLVED';

export type DocumentType = 'PDF' | 'DOCX' | 'TXT' | 'MD';

export type ActivityAction =
  | 'CLUB_CREATED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'ROLE_CHANGED'
  | 'OWNERSHIP_TRANSFERRED'
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_DELETED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'MEETING_CREATED'
  | 'RISK_DETECTED'
  | 'RISK_RESOLVED'
  | 'DOCUMENT_UPLOADED'
  | 'ANNOUNCEMENT_CREATED'
  | 'AI_ACTION_EXECUTED';