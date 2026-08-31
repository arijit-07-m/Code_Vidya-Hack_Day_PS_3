import { z } from 'zod';

export const createTaskSchema = z.object({
  clubId: z.string(),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).optional(),
  eventId: z.string().optional(),
  assignedTo: z.string().min(1, 'Assignee is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  deadline: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
  deadline: z.string().optional(),
  assignedTo: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

export const createMeetingSchema = z.object({
  clubId: z.string(),
  title: z.string().min(1, 'Meeting title is required').max(200),
  date: z.string().min(1, 'Meeting date is required'),
  participants: z.array(z.string()).optional(),
  notes: z.string().optional(),
  transcript: z.string().optional(),
  eventId: z.string().optional(),
});

export const meetingAnalysisSchema = z.object({
  meetingId: z.string(),
  notes: z.string().optional(),
  transcript: z.string().optional(),
});

export const createRiskSchema = z.object({
  clubId: z.string(),
  title: z.string().min(1, 'Risk title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  why: z.string().optional(),
  eventId: z.string().optional(),
  recommendation: z.string().min(1, 'Recommendation is required').max(500),
  relatedTaskIds: z.array(z.string()).optional(),
});

export const createMemberSchema = z.object({
  clubId: z.string(),
  email: z.string().email('Valid email is required'),
  role: z.enum(['ADMIN', 'EVENT_HEAD', 'MEMBER', 'VOLUNTEER']).optional().default('MEMBER'),
});

export const updateRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'EVENT_HEAD', 'MEMBER', 'VOLUNTEER']),
});

export const transferOwnershipSchema = z.object({
  memberId: z.string(),
  clubId: z.string(),
});