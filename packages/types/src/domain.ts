import type {
  UserRole, MembershipStatus, EventStatus, TaskPriority,
  TaskStatus, RiskSeverity, RiskStatus, DocumentType
} from './enums';

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  logo?: string;
  facultyCoordinator?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: UserRole;
  status: MembershipStatus;
  joinedAt: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
}

export interface ClubEvent {
  id: string;
  clubId: string;
  eventName: string;
  description: string;
  date: string;
  format: 'INTERNAL' | 'EXTERNAL' | 'HACKATHON' | 'WORKSHOP';
  startTime?: string;
  endTime?: string;
  venue: string;
  expectedParticipants?: number;
  status: EventStatus;
  bannerImage?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}