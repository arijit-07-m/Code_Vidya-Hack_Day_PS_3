import { z } from 'zod';

export const aiToolParametersSchema = z.object({
  tool: z.string(),
  parameters: z.record(z.unknown()),
  clubId: z.string(),
});

export const aiAgentCommandSchema = z.object({
  command: z.string().min(1, 'Command is required').max(500),
  clubId: z.string(),
});

export const aiMeetingAnalysisSchema = z.object({
  meetingId: z.string().optional(),
  notes: z.string().optional(),
  transcript: z.string().optional(),
  clubId: z.string(),
});

export const aiRiskAnalysisSchema = z.object({
  eventId: z.string().optional(),
  clubId: z.string(),
});

export const aiRagQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').max(500),
  clubId: z.string(),
});

export const aiAnnouncementSchema = z.object({
  purpose: z.string().min(1),
  audience: z.string().min(1),
  tone: z.string().min(1),
  eventName: z.string().optional().default(''),
  importantInfo: z.string().optional().default(''),
  clubId: z.string(),
});