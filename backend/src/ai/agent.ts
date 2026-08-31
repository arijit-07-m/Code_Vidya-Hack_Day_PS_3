import { AIProvider } from './provider';

const AGENT_SYSTEM_PROMPT = `You are an AI assistant for ClubOps, a college club management platform. You can understand natural language commands and translate them into application actions.

Available tools:
1. create_task - Creates a new task
   Parameters: title, description, assignedTo, priority (LOW|MEDIUM|HIGH|CRITICAL), deadline, eventId
   
2. update_task - Updates an existing task
   Parameters: taskId, status, priority, deadline, assignedTo
   
3. assign_task - Assigns or reassigns a task
   Parameters: taskId, assignedTo
   
4. complete_task - Marks a task as completed
   Parameters: taskId

5. create_event - Creates a new event
   Parameters: eventName, description, date, venue, expectedParticipants

6. detect_risks - Analyzes current state for risks
   Parameters: eventId

7. get_user_tasks - Gets tasks for a user
   Parameters: userId

8. search_documents - Searches the club knowledge base
   Parameters: query

Respond in this EXACT JSON format:
{
  "tool": "tool_name",
  "parameters": { ... },
  "message": "friendly confirmation message for the user",
  "confidence": 0.0-1.0
}

If you cannot determine the intent, use tool: "unknown" with confidence: 0.`;

export function createAIAgent(aiProvider: AIProvider) {
  return {
    async processCommand(command: string): Promise<{
      tool: string;
      parameters: Record<string, unknown>;
      message: string;
      confidence: number;
    }> {
      const prompt = `Process this command: "${command}"`;
      try {
        const result = await aiProvider.generateStructured<any>(prompt, {}, AGENT_SYSTEM_PROMPT);
        return {
          tool: result.tool || 'unknown',
          parameters: result.parameters || {},
          message: result.message || 'I understood your request.',
          confidence: result.confidence || 0.5,
        };
      } catch (error) {
        return {
          tool: 'unknown',
          parameters: {},
          message: 'I could not understand that command. Please try rephrasing.',
          confidence: 0,
        };
      }
    },

    async generateOperationsBrief(
      context: string
    ): Promise<{
      summary: string;
      urgentTasks: number;
      upcomingDeadlines: number;
      unresolvedRisks: number;
      overloadedUsers: string[];
      recommendations: string[];
    }> {
      const prompt = `Generate a daily operations brief based on this club data:\n\n${context}`;
      const systemPrompt = `You are an AI operations analyst. Generate a brief summary of the current state of club operations.
Respond with valid JSON:
{
  "summary": "2-3 sentence summary",
  "urgentTasks": 0,
  "upcomingDeadlines": 0,
  "unresolvedRisks": 0,
  "overloadedUsers": [],
  "recommendations": []
}`;

      try {
        return await aiProvider.generateStructured<any>(prompt, {}, systemPrompt);
      } catch {
        return {
          summary: 'Unable to generate brief at this time.',
          urgentTasks: 0,
          upcomingDeadlines: 0,
          unresolvedRisks: 0,
          overloadedUsers: [],
          recommendations: [],
        };
      }
    },

    async generateAnnouncement(
      purpose: string,
      audience: string,
      tone: string,
      eventName: string,
      importantInfo: string
    ): Promise<string> {
      const prompt = `Generate a club announcement with:
Purpose: ${purpose}
Audience: ${audience}
Tone: ${tone}
Event: ${eventName}
Important Info: ${importantInfo}

Generate a complete, ready-to-send announcement.`;

      const systemPrompt = 'You are an announcement generator for college clubs. Generate professional, engaging announcements.';
      return aiProvider.generateCompletion(prompt, systemPrompt);
    },
  };
}