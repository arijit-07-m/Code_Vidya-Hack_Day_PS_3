import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { firestore } from '../services/firebase';
import { COLLECTIONS } from '../@clubops/config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create event
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId, eventName, description, date, format, startTime, endTime, venue, expectedParticipants, status } = req.body;
    const eventId = uuidv4();
    const eventData = {
      id: eventId, clubId, eventName, description: description || '', date,
      format: format || 'INTERNAL', startTime: startTime || '', endTime: endTime || '',
      venue, expectedParticipants: expectedParticipants || 0, status: status || 'PLANNING',
      createdBy: req.user!.uid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await firestore.collection(COLLECTIONS.EVENTS).doc(eventId).set(eventData);
    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId, userId: req.user!.uid, userName: req.user!.email || 'Unknown',
      action: 'EVENT_CREATED', description: `Event "${eventName}" created`, createdAt: new Date().toISOString(),
    });
    res.status(201).json({ event: eventData });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get event by ID
router.get('/:eventId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const doc = await firestore.collection(COLLECTIONS.EVENTS).doc(eventId).get();
    if (!doc.exists) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ event: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Get events by club
router.get('/clubs/:clubId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const snapshot = await firestore.collection(COLLECTIONS.EVENTS)
      .where('clubId', '==', clubId).orderBy('createdAt', 'desc').get();
    res.json({ events: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Update event
router.put('/:eventId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.id; delete updates.clubId; delete updates.createdBy;
    await firestore.collection(COLLECTIONS.EVENTS).doc(eventId).update(updates);
    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId: req.body.clubId || '', userId: req.user!.uid, userName: req.user!.email || 'Unknown',
      action: 'EVENT_UPDATED', description: `Event ${eventId} updated`, createdAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:eventId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const doc = await firestore.collection(COLLECTIONS.EVENTS).doc(eventId).get();
    if (!doc.exists) { res.status(404).json({ error: 'Not found' }); return; }
    const data = doc.data()!;
    await firestore.collection(COLLECTIONS.EVENTS).doc(eventId).delete();
    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId: data.clubId, userId: req.user!.uid, userName: req.user!.email || 'Unknown',
      action: 'EVENT_DELETED', description: `Event "${data.eventName}" deleted`, createdAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
