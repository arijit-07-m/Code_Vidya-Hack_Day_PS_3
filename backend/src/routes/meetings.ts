import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { firestore } from '../services/firebase';
import { COLLECTIONS } from '../@clubops/config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create meeting
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId, title, date, participants, notes, transcript, eventId } = req.body;
    const meetingId = uuidv4();
    const meetingData = {
      id: meetingId, clubId, title, date, participants: participants || [],
      notes: notes || '', transcript: transcript || '', eventId: eventId || '',
      createdBy: req.user!.uid, createdAt: new Date().toISOString(), aiProcessed: false,
    };
    await firestore.collection(COLLECTIONS.MEETINGS).doc(meetingId).set(meetingData);
    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId, userId: req.user!.uid, userName: req.user!.email || 'Unknown',
      action: 'MEETING_CREATED', description: `Meeting "${title}" created`, createdAt: new Date().toISOString(),
    });
    res.status(201).json({ meeting: meetingData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Get meetings by club
router.get('/clubs/:clubId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const snapshot = await firestore.collection(COLLECTIONS.MEETINGS)
      .where('clubId', '==', clubId).orderBy('createdAt', 'desc').get();
    res.json({ meetings: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get single meeting
router.get('/:meetingId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await firestore.collection(COLLECTIONS.MEETINGS).doc(req.params.meetingId).get();
    if (!doc.exists) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ meeting: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// Update meeting
router.put('/:meetingId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await firestore.collection(COLLECTIONS.MEETINGS).doc(req.params.meetingId).update(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Get action items for meeting
router.get('/:meetingId/action-items', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { meetingId } = req.params;
    const snapshot = await firestore.collection(COLLECTIONS.MEETING_ACTION_ITEMS)
      .where('meetingId', '==', meetingId).get();
    res.json({ actionItems: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch action items' });
  }
});

// Update action item status
router.put('/:meetingId/action-items/:itemId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body;
    await firestore.collection(COLLECTIONS.MEETING_ACTION_ITEMS).doc(itemId).update({ status });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

export default router;
