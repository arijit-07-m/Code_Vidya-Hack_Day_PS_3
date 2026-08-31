# AI Features

## 1. Meeting Analysis

Extracts structured action items from meeting notes/transcripts.

**Input**: Meeting notes or transcript text
**Output**: JSON array of action items with task, owner, deadline, priority

**Flow**:
1. User uploads/pastes meeting content
2. AI analyzes and extracts action items
3. Human reviews the extracted items
4. User approves, edits, or rejects
5. Approved items become tasks in the database

## 2. Risk Detection

Analyzes club operations to identify potential risks.

**Detection methods**:
- Algorithmic: overdue tasks, missing owners, missing deadlines, overloaded volunteers, approaching events
- AI: contextual analysis using Gemini/OpenAI

**Risk object includes**:
- Title and description
- Severity (LOW, MEDIUM, HIGH, CRITICAL)
- Explanation of WHY it's a risk
- Recommended action
- Related task/event IDs

## 3. AI Action Agent

Natural language command processor that executes safe application actions.

**Architecture**:
```
User Command → Intent Detection → Tool Selection → Permission Check → Execution
```

**Supported tools**:
- create_task, update_task, assign_task, complete_task
- create_event, update_event
- assign_volunteer
- create_announcement
- detect_risks
- search_documents (RAG)
- get_user_tasks, get_event_status

**Safety**: Every action validates authentication, club membership, role permissions, and input before execution.

## 4. RAG Knowledge Base

Retrieval-Augmented Generation for club-specific knowledge.

**Flow**:
1. Upload documents (PDF, DOCX, TXT)
2. Text extraction and chunking (500 char chunks with 50 char overlap)
3. Embedding generation (Gemini embedding-001)
4. Cosine similarity search
5. AI generates answer with source references

**Security**: All chunks are scoped by clubId. Vector search filters by clubId.

## 5. AI Provider Abstraction

All AI features use a common interface:

```typescript
interface AIProvider {
  generateCompletion(prompt: string, systemPrompt?: string): Promise<string>;
  generateStructured<T>(prompt: string, schema: Record<string, unknown>, systemPrompt?: string): Promise<T>;
  generateEmbedding(text: string): Promise<number[]>;
}
```

Supported providers:
- Gemini (GeminiProvider)
- OpenAI (OpenAIProvider - can be added)

## 6. Announcement Generator

AI-powered announcement generation for various purposes:
- Event announcements
- Volunteer reminders
- Deadline reminders
- Meeting reminders
- Emergency announcements

## 7. Daily Operations Brief

AI-generated dashboard summary showing:
- Urgent and overdue tasks
- Upcoming deadlines
- Unresolved risks
- Overloaded team members
- Recommended actions