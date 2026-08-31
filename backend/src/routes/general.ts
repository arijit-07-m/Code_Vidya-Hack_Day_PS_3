import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { firestore } from '../services/firebase';
import { COLLECTIONS } from '../@clubops/config';

const router = Router();

// Activity logs
router.get('/:clubId/activity', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const snapshot = await firestore.collection(COLLECTIONS.ACTIVITY_LOGS)
      .where('clubId', '==', clubId).orderBy('createdAt', 'desc').limit(limit).get();
    res.json({ logs: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Dashboard overview
router.get('/:clubId/dashboard', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId } = req.params;

    const [tasksSnap, eventsSnap, membersSnap, risksSnap, volunteersSnap] = await Promise.all([
      firestore.collection(COLLECTIONS.TASKS).where('clubId', '==', clubId).get(),
      firestore.collection(COLLECTIONS.EVENTS).where('clubId', '==', clubId).get(),
      firestore.collection(COLLECTIONS.CLUB_MEMBERS).where('clubId', '==', clubId).where('status', '==', 'ACTIVE').get(),
      firestore.collection(COLLECTIONS.RISKS).where('clubId', '==', clubId).where('status', '==', 'OPEN').get(),
      firestore.collection(COLLECTIONS.VOLUNTEERS).where('clubId', '==', clubId).get(),
    ]);

    const tasks = tasksSnap.docs.map(d => d.data());
    const events = eventsSnap.docs.map(d => d.data());
    const now = new Date();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
    const urgentTasks = tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'COMPLETED').length;
    const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'COMPLETED').length;
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;

    const activeEvents = events.filter(e => e.status === 'ACTIVE').length;
    const upcomingEvents = events.filter(e => e.status === 'PLANNING').length;
    const completedEvents = events.filter(e => e.status === 'COMPLETED').length;

    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const memberCount = membersSnap.docs.length;
    const openRisks = risksSnap.docs.length;
    const volunteerCount = volunteersSnap.docs.length;

    res.json({
      overview: {
        totalTasks, completedTasks, pendingTasks, urgentTasks, overdueTasks, blockedTasks,
        activeEvents, upcomingEvents, completedEvents,
        completionPercent, memberCount, openRisks, volunteerCount,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// Update member role
router.put('/:clubId/members/:memberId/role', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;
    await firestore.collection(COLLECTIONS.CLUB_MEMBERS).doc(memberId).update({ role });
    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId: req.params.clubId, userId: req.user!.uid, userName: req.user!.email || 'Unknown',
      action: 'ROLE_CHANGED', description: `Member ${memberId} role changed to ${role}`,
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;
