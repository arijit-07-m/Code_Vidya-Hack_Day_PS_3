import { AIMeetingAnalysis, AIMeetingActionItem } from '@clubops/types';
import { AIProvider } from './provider';

const MEETING_ANALYSIS_SYSTEM_PROMPT = `You are an AI assistant that extracts structured action items from meeting notes and transcripts.

Analyze the meeting content and extract:
1. Action items (tasks that need to be done)
2. Owners (who is responsible)
3. Deadlines (when it needs to be done)
4. Priority (LOW, MEDIUM, HIGH, CRITICAL)
5. Any risks mentioned

Respond with valid JSON in this exact format:
{
  "actionItems": [
    {
      "task": "description of the task",
      "owner": "person responsible",
      "deadline": "YYYY-MM-DD or null if not specified",
      "priority": "HIGH|MEDIUM|LOW|CRITICAL"
    }
  ],
  "risks": ["risk1", "risk2"],
  "summary": "brief meeting summary"
}`;

const RISK_ANALYSIS_SYSTEM_PROMPT = `You are an AI risk analyst for college club events. Analyze the provided information and identify operational risks.

Consider:
- Missing owners or deadlines
- Overdue tasks
- Overloaded volunteers
- Event date approaching with incomplete tasks
- Dependency issues
- Insufficient volunteers

Respond with valid JSON in this exact format:
{
  "risks": [
    {
      "title": "short risk title",
      "description": "detailed description",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "why": "explanation of why this is a risk",
      "recommendation": "what should be done"
    }
  ]
}`;

export function createMeetingProcessor(aiProvider: AIProvider) {
  return {
    async analyzeMeeting(notes?: string, transcript?: string): Promise<AIMeetingAnalysis> {
      const content = transcript || notes || '';
      if (!content.trim()) {
        return { actionItems: [], risks: [], summary: 'No content to analyze' };
      }

      const prompt = `Analyze the following meeting content and extract action items, risks, and a summary:\n\n${content}`;
      return aiProvider.generateStructured<AIMeetingAnalysis>(prompt, {}, MEETING_ANALYSIS_SYSTEM_PROMPT);
    },

    async analyzeRisks(context: string): Promise<{ risks: any[] }> {
      const prompt = `Analyze the following club event information for operational risks:\n\n${context}`;
      return aiProvider.generateStructured<{ risks: any[] }>(prompt, {}, RISK_ANALYSIS_SYSTEM_PROMPT);
    },

    formatActionItemForDisplay(item: AIMeetingActionItem): string {
      return `☐ ${item.task} — ${item.owner}${item.deadline ? ` (by ${item.deadline})` : ''} [${item.priority || 'MEDIUM'}]`;
    },
  };
}