import type { TaskPriority, RiskSeverity } from './enums';

export interface AIMeetingActionItem {
  task: string;
  owner: string;
  deadline?: string;
  priority?: TaskPriority;
}

export interface AIMeetingAnalysis {
  actionItems: AIMeetingActionItem[];
  risks?: string[];
  summary?: string;
}

export interface AIRiskFinding {
  title: string;
  description: string;
  severity: RiskSeverity;
  why: string;
  recommendation: string;
  relatedTaskIds?: string[];
  eventId?: string;
}

export interface AIRiskResponse {
  risks: AIRiskFinding[];
}

export interface AIAnnouncementInput {
  purpose: string;
  audience: string;
  tone: string;
  eventName: string;
  importantInfo: string;
}

export interface AIAgentResponse {
  intent: string;
  tool: string;
  parameters: Record<string, unknown>;
  confidence: number;
  message: string;
}

export interface AIOperationsBrief {
  summary: string;
  urgentTasks: number;
  upcomingDeadlines: number;
  unresolvedRisks: number;
  overloadedUsers: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface AIAssistantConversation {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIAssistantResponse {
  reply: string;
  action?: AIAgentResponse;
}

export interface RAGQueryResult {
  answer: string;
  sources: { documentName: string; chunkIndex: number; excerpt: string }[];
  found: boolean;
}