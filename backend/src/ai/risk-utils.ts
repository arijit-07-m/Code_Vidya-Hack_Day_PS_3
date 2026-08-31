import { firestore } from '../services/firebase';
import { COLLECTIONS } from '../@clubops/config';
import { v4 as uuidv4 } from 'uuid';
import { AIRiskFinding } from '../@clubops/types';

export function detectAlgorithmicRisks(tasks: any[], events: any[], volunteers: any[]): AIRiskFinding[] {
  const risks: AIRiskFinding[] = [];
  const now = new Date();

  // Overdue tasks
  const overdueTasks = tasks.filter(
    (t: any) => t.deadline && new Date(t.deadline) < now && t.status !== 'COMPLETED'
  );
  if (overdueTasks.length > 0) {
    risks.push({
      title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
      description: `Overdue: ${overdueTasks.slice(0, 3).map((t: any) => `"${t.title}"`).join(', ')}`,
      severity: overdueTasks.length > 3 ? 'HIGH' : 'MEDIUM',
      why: 'Overdue tasks can cascade and delay other activities.',
      recommendation: 'Review and prioritize overdue tasks immediately.',
      relatedTaskIds: overdueTasks.map((t: any) => t.id),
    });
  }

  // Tasks without owners
  const unowned = tasks.filter((t: any) => !t.assignedTo && t.status !== 'COMPLETED');
  if (unowned.length > 0) {
    risks.push({
      title: `${unowned.length} task${unowned.length > 1 ? 's' : ''} without assigned owner`,
      description: `Tasks: ${unowned.slice(0, 3).map((t: any) => `"${t.title}"`).join(', ')}`,
      severity: 'MEDIUM',
      why: 'Tasks without owners are unlikely to be completed.',
      recommendation: 'Assign owners to all unassigned tasks.',
      relatedTaskIds: unowned.map((t: any) => t.id),
    });
  }

  // Tasks without deadlines
  const noDeadline = tasks.filter((t: any) => !t.deadline && t.status !== 'COMPLETED');
  if (noDeadline.length > 0) {
    risks.push({
      title: `${noDeadline.length} task${noDeadline.length > 1 ? 's' : ''} without deadline`,
      description: `Tasks: ${noDeadline.slice(0, 3).map((t: any) => `"${t.title}"`).join(', ')}`,
      severity: 'LOW',
      why: 'Tasks without deadlines can be deprioritized indefinitely.',
      recommendation: 'Add deadlines to all tasks.',
      relatedTaskIds: noDeadline.map((t: any) => t.id),
    });
  }

  // Overloaded volunteers
  const overloaded = volunteers.filter((v: any) => (v.currentWorkload || 0) > 80);
  if (overloaded.length > 0) {
    risks.push({
      title: `${overloaded.length} volunteer${overloaded.length > 1 ? 's' : ''} overloaded`,
      description: `${overloaded.map((v: any) => v.name).join(', ')} workload above 80%`,
      severity: 'MEDIUM',
      why: 'Overloaded volunteers risk burnout and missed deadlines.',
      recommendation: 'Redistribute tasks among available volunteers.',
      relatedTaskIds: [],
    });
  }

  // Upcoming event with incomplete tasks (< 7 days away)
  const upcomingEvents = events.filter((e: any) => {
    const eventDate = new Date(e.date);
    const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays < 7 && e.status !== 'COMPLETED';
  });

  for (const event of upcomingEvents) {
    const eventTasks = tasks.filter((t: any) => t.eventId === event.id && t.status !== 'COMPLETED');
    if (eventTasks.length > 0) {
      const daysUntil = Math.ceil((new Date(event.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      risks.push({
        title: `Event "${event.eventName}" in ${daysUntil}d with ${eventTasks.length} incomplete tasks`,
        description: `Remaining: ${eventTasks.map((t: any) => `"${t.title}"`).join(', ')}`,
        severity: eventTasks.length > 5 ? 'CRITICAL' : 'HIGH',
        why: 'Event date is approaching with incomplete tasks.',
        recommendation: 'Prioritize event tasks; consider adding volunteers.',
        relatedTaskIds: eventTasks.map((t: any) => t.id),
        eventId: event.id,
      });
    }
  }

  return risks;
}

export async function saveRisksToFirestore(clubId: string, findings: AIRiskFinding[]): Promise<string[]> {
  const riskIds: string[] = [];
  for (const finding of findings) {
    const riskId = uuidv4();
    await firestore.collection(COLLECTIONS.RISKS).doc(riskId).set({
      id: riskId,
      clubId,
      title: finding.title,
      description: finding.description,
      severity: finding.severity,
      why: finding.why,
      eventId: finding.eventId || '',
      relatedTaskIds: finding.relatedTaskIds || [],
      recommendation: finding.recommendation,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    riskIds.push(riskId);

    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId, userId: 'system', userName: 'AI Risk Detector',
      action: 'RISK_DETECTED', description: `Risk: ${finding.title}`,
      metadata: { severity: finding.severity }, createdAt: new Date().toISOString(),
    });
  }
  return riskIds;
}

export function buildRiskContext(tasks: any[], events: any[], volunteers: any[], existingRisks: any[]): string {
  return JSON.stringify({
    tasks: tasks.map((t: any) => ({
      title: t.title, status: t.status, priority: t.priority,
      deadline: t.deadline, assignedTo: t.assignedTo, eventId: t.eventId,
    })),
    events: events.map((e: any) => ({
      name: e.eventName, date: e.date, status: e.status, venue: e.venue,
    })),
    volunteers: volunteers.map((v: any) => ({
      name: v.name, workload: v.currentWorkload, skills: v.skills,
    })),
    existingRisks: existingRisks.map((r: any) => ({ title: r.title, severity: r.severity })),
  });
}
