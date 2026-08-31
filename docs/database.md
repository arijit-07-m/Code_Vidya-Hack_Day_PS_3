# Database Design

## Collections

### users
```typescript
{
  uid: string;          // Firebase Auth UID
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;    // ISO date
}
```

### clubs
```typescript
{
  id: string;
  name: string;
  description: string;
  category: string;
  logo?: string;
  facultyCoordinator?: string;
  ownerId: string;      // Firebase Auth UID of club owner
  createdAt: string;
  updatedAt: string;
}
```

### clubMembers
```typescript
{
  id: string;
  clubId: string;       // FK to clubs
  userId: string;       // FK to users
  role: 'OWNER' | 'ADMIN' | 'EVENT_HEAD' | 'MEMBER' | 'VOLUNTEER';
  status: 'ACTIVE' | 'INVITED' | 'REMOVED';
  joinedAt: string;
  displayName?: string;
  email?: string;
}
```

### events
```typescript
{
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
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### tasks
```typescript
{
  id: string;
  clubId: string;
  title: string;
  description?: string;
  eventId?: string;
  assignedTo: string;      // User UID
  assignedToName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  deadline?: string;
  createdBy: string;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### meetings
```typescript
{
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
  aiProcessed: boolean;
}
```

### meetingActionItems
```typescript
{
  id: string;
  meetingId: string;
  clubId: string;
  task: string;
  owner?: string;
  deadline?: string;
  priority: TaskPriority;
  status: 'PENDING' | 'APPROVED' | 'EDITED' | 'REJECTED';
  createdAt: string;
}
```

### documents / documentChunks
Documents store file metadata. Chunks store text segments with embeddings.

### risks
```typescript
{
  id: string;
  clubId: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  why?: string;
  eventId?: string;
  relatedTaskIds?: string[];
  recommendation: string;
  status: 'OPEN' | 'MITIGATED' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}
```

### activityLogs
```typescript
{
  id: string;
  clubId: string;
  userId: string;
  userName?: string;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

## Relationships

- Users can belong to many clubs (via clubMembers)
- Clubs have many members
- Events belong to one club
- Tasks belong to one club, optionally to one event
- Meetings belong to one club, optionally to one event
- Risks belong to one club, optionally to one event
- Documents belong to one club
- Activity logs belong to one club

## Indexes

See `firebase/firestore.indexes.json` for composite indexes.

Required composite indexes:
- clubMembers by userId + status
- clubMembers by clubId + status
- tasks by clubId + createdAt
- tasks by assignedTo + createdAt  
- events by clubId + createdAt
- activityLogs by clubId + createdAt