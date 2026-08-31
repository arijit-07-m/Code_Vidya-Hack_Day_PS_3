import type { TaskPriority, TaskStatus, RiskSeverity, RiskStatus, DocumentType } from './enums';
import type { ActivityAction } from './enums';

export interface Task {
  id: string;
  clubId: string;
  title: string;
  description?: string;
  eventId?: string;
  ownerId?: string;
  assignedTo: string;
  assignedToName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;
  createdBy: string;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Volunteer {
  id: string;
  clubId: string;
  userId: string;
  name: string;
  skills: string[];
  availability: string[];
  currentWorkload?: number;
  createdAt: string;
}

export interface Meeting {
  id: string;
  clubId: string;
  title: string;
  date: string;
  participants?: string[];
  notes?: string;
  transcript?: string;
  eventId?: string;
  createdBy: string;
  createdAt: string;
  aiProcessed?: boolean;
}

export interface MeetingActionItem {
  id: string;
  meetingId: string;
  clubId: string;
  task: string;
  owner?: string;
  ownerId?: string;
  deadline?: string;
  priority: TaskPriority;
  status: 'PENDING' | 'APPROVED' | 'EDITED' | 'REJECTED';
  createdAt: string;
}

export interface Document {
  id: string;
  clubId: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
  description?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  clubId: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface Risk {
  id: string;
  clubId: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  why?: string;
  eventId?: string;
  relatedTaskIds?: string[];
  recommendation: string;
  status: RiskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  clubId: string;
  title: string;
  content: string;
  type: string;
  createdBy: string;
  createdAt: string;
  aiGenerated?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  clubId?: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  relatedEntityId?: string;
}

export interface ActivityLog {
  id: string;
  clubId: string;
  userId: string;
  userName?: string;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AIAction {
  id: string;
  clubId: string;
  userId: string;
  intent: string;
  tool: string;
  parameters: Record<string, unknown>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  executedAt?: string;
}