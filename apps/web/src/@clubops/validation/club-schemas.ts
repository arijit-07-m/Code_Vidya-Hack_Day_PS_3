import { z } from 'zod';

export const createClubSchema = z.object({
  name: z.string().min(1, 'Club name is required').max(100),
  description: z.string().max(500).optional().default(''),
  category: z.string().max(50).optional().default(''),
  facultyCoordinator: z.string().max(100).optional(),
});

export const updateClubSchema = createClubSchema.partial();

export const createEventSchema = z.object({
  clubId: z.string(),
  eventName: z.string().min(1, 'Event name is required').max(200),
  description: z.string().max(2000).optional().default(''),
  date: z.string().min(1, 'Event date is required'),
  format: z.enum(['INTERNAL', 'EXTERNAL', 'HACKATHON', 'WORKSHOP']).optional().default('INTERNAL'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().min(1, 'Venue is required').max(200),
  expectedParticipants: z.number().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional().default('PLANNING'),
});