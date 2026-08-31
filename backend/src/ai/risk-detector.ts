import { firestore } from '../services/firebase';
import { COLLECTIONS } from '@clubops/config';
import { AIRiskFinding } from '@clubops/types';
import { AIProvider } from './provider';
import { detectAlgorithmicRisks, buildRiskContext, saveRisksToFirestore } from './risk-utils';

const RISK_AI_SYSTEM_PROMPT = `You are an AI risk analyst for college club events.
Analyze the provided data for operational risks. Consider: missing owners, missing deadlines,
overdue tasks, overloaded volunteers, event approaching with incomplete work, dependencies.
Respond with valid JSON: {"risks": [{"title":"","description":"","severity":"LOW|MEDIUM|HIGH|CRITICAL","why":"","recommendation":"","relatedTaskIds":[],"eventId":""}]}`;

export function createRiskDetector(aiProvider: AIProvider) {
  return {
    async detectRisks(clubId: string, eventId?: string): Promise<AIRiskFinding[]> {
      try {
        const [tasksSnap, eventsSnap, volunteersSnap, risksSnap] = await Promise.all([
          firestore.collection(COLLECTIONS.TASKS)
            .where('clubId', '==', clubId).get(),
          firestore.collection(COLLECTIONS.EVENTS)
            .where('clubId', '==', clubId).get(),
          firestore.collection(COLLECTIONS.VOLUNTEERS)
            .where('clubId', '==', clubId).get(),
          firestore.collection(COLLECTIONS.RISKS)
            .where('clubId', '==', clubId).where('status', '==', 'OPEN').get(),
        ]);

        const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const volunteers = volunteersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const existingRisks = risksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Algorithmic risks
        const algorithmicRisks = detectAlgorithmicRisks(
          eventId ? tasks.filter((t: any) => t.eventId === eventId) : tasks,
          eventId ? events.filter((e: any) => e.id === eventId) : events,
          volunteers
        );

        // AI risks
        const context = buildRiskContext(tasks, events, volunteers, existingRisks);
        let aiRisks: AIRiskFinding[] = [];
        try {
          const result = await aiProvider.generateStructured<{ risks: AIRiskFinding[] }>(
            context, {}, RISK_AI_SYSTEM_PROMPT
          );
          aiRisks = (result.risks || []).slice(0, 5);
        } catch (err) {
          console.error('AI risk detection failed:', err);
        }

        // Merge and deduplicate
        const merged = [...algorithmicRisks, ...aiRisks];
        const unique = merged.filter((r, i) => i === merged.findIndex(x => x.title === r.title));

        return eventId ? unique.filter(r => !r.eventId || r.eventId === eventId) : unique;
      } catch (error) {
        console.error('Risk detection error:', error);
        return [];
      }
    },

    async saveRisks(clubId: string, findings: AIRiskFinding[]): Promise<string[]> {
      return saveRisksToFirestore(clubId, findings);
    },
  };
}