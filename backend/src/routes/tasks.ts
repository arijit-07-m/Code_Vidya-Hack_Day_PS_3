import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { firestore } from '../services/firebase';
import { COLLECTIONS } from '@clubops/config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create task
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId, title, description, eventId, assignedTo, priority, deadline, dependencies } = req.body;
    const taskId = uuidv4();
    const taskData = {
      id: taskId, clubId, title, description: description || '', eventId: eventId || '',
      assignedTo, assignedToName: '', priority: priority || 'MEDIUM', status: 'TODO',
      deadline: deadline || '', createdBy: req.user!.uid, dependencies: dependencies || [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await firestore.collection(COLLECTIONS.TASKS).doc(taskId).set(taskData);
    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId, userId: req.user!.uid, userName: req.user!.email || 'Unknown',
      action: 'TASK_CREATED', description: `Task "${title}" created`, createdAt: new Date().toISOString(),
    });
    res.status(201).json({ task: taskData });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get task by ID
router.get('/:taskId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const doc = await firestore.collection(COLLECTIONS.TASKS).doc(taskId).get();
    if (!doc.exists) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ task: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Get tasks by club
router.get('/clubs/:clubId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const snapshot = await firestore.collection(COLLECTIONS.TASKS)
      .where('clubId', '==', clubId).orderBy('createdAt', 'desc').get();
    res.json({ tasks: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks by user
router.get('/user/:userId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const snapshot = await firestore.collection(COLLECTIONS.TASKS)
      .where('assignedTo', '==', userId).orderBy('createdAt', 'desc').get();
    res.json({ tasks: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Update task
router.put('/:taskId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.id; delete updates.clubId; delete updates.createdBy;
    await firestore.collection(COLLECTIONS.TASKS).doc(taskId).update(updates);
    if (updates.status === 'COMPLETED') {
      await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
        clubId: req.body.clubId || '', userId: req.user!.uid, userName: req.user!.email || 'Unknown',
        action: 'TASK_COMPLETED', description: `Task ${taskId} completed`, createdAt: new Date().toISOString(),
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:taskId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await firestore.collection(COLLECTIONS.TASKS).doc(req.params.taskId).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;