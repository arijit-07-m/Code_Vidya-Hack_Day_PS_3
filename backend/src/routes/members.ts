import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { firestore } from '../services/firebase';
import { COLLECTIONS } from '@clubops/config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Invite member
router.post('/:clubId/members/invite', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const { email, role } = req.body;
    const userId = req.user!.uid;

    const inviterMember = await firestore
      .collection(COLLECTIONS.CLUB_MEMBERS)
      .where('userId', '==', userId).where('clubId', '==', clubId)
      .where('status', '==', 'ACTIVE').limit(1).get();

    if (inviterMember.empty) { res.status(403).json({ error: 'Not a member' }); return; }

    const inviterRole = inviterMember.docs[0].data().role;
    if (!['OWNER', 'ADMIN'].includes(inviterRole)) {
      res.status(403).json({ error: 'Only owners and admins can invite' }); return;
    }

    const userSnapshot = await firestore.collection(COLLECTIONS.USERS).where('email', '==', email).limit(1).get();
    if (userSnapshot.empty) { res.status(404).json({ error: 'User not found' }); return; }

    const targetUser = userSnapshot.docs[0].data();

    const existing = await firestore.collection(COLLECTIONS.CLUB_MEMBERS)
      .where('userId', '==', targetUser.uid).where('clubId', '==', clubId).limit(1).get();
    if (!existing.empty) { res.status(400).json({ error: 'Already a member' }); return; }

    const memberId = uuidv4();
    await firestore.collection(COLLECTIONS.CLUB_MEMBERS).doc(memberId).set({
      id: memberId, clubId, userId: targetUser.uid, role: role || 'MEMBER',
      status: 'ACTIVE', joinedAt: new Date().toISOString(),
      displayName: targetUser.displayName || '', email: targetUser.email,
    });

    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId, userId, userName: req.user!.email || 'Unknown',
      action: 'MEMBER_ADDED', description: `${targetUser.email} added as ${role || 'MEMBER'}`,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ memberId });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

// Get members
router.get('/:clubId/members', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const snapshot = await firestore.collection(COLLECTIONS.CLUB_MEMBERS)
      .where('clubId', '==', clubId).where('status', '==', 'ACTIVE').get();
    const members = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Transfer ownership
router.post('/:clubId/transfer-ownership', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const { memberId } = req.body;
    const userId = req.user!.uid;

    const clubDoc = await firestore.collection(COLLECTIONS.CLUBS).doc(clubId).get();
    if (!clubDoc.exists) { res.status(404).json({ error: 'Club not found' }); return; }
    if (clubDoc.data()!.ownerId !== userId) {
      res.status(403).json({ error: 'Only owner can transfer ownership' }); return;
    }

    const memberDoc = await firestore.collection(COLLECTIONS.CLUB_MEMBERS).doc(memberId).get();
    if (!memberDoc.exists) { res.status(404).json({ error: 'Member not found' }); return; }

    const newOwnerId = memberDoc.data()!.userId;
    const prevOwnerSnapshot = await firestore.collection(COLLECTIONS.CLUB_MEMBERS)
      .where('userId', '==', userId).where('clubId', '==', clubId).limit(1).get();
    const prevOwnerDoc = prevOwnerSnapshot.docs[0];

    await firestore.collection(COLLECTIONS.CLUBS).doc(clubId).update({ ownerId: newOwnerId, updatedAt: new Date().toISOString() });
    await firestore.collection(COLLECTIONS.CLUB_MEMBERS).doc(prevOwnerDoc.id).update({ role: 'ADMIN' });
    await firestore.collection(COLLECTIONS.CLUB_MEMBERS).doc(memberId).update({ role: 'OWNER' });

    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId, userId, userName: req.user!.email || 'Unknown',
      action: 'OWNERSHIP_TRANSFERRED',
      description: `Ownership transferred to ${memberDoc.data()!.email || newOwnerId}`,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to transfer ownership' });
  }
});

// Remove member
router.delete('/:clubId/members/:memberId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clubId, memberId } = req.params;
    const memberDoc = await firestore.collection(COLLECTIONS.CLUB_MEMBERS).doc(memberId).get();
    if (!memberDoc.exists) { res.status(404).json({ error: 'Member not found' }); return; }
    if (memberDoc.data()!.role === 'OWNER') { res.status(403).json({ error: 'Cannot remove owner' }); return; }

    await firestore.collection(COLLECTIONS.CLUB_MEMBERS).doc(memberId).update({ status: 'REMOVED' });
    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId, userId: req.user!.uid, userName: req.user!.email || 'Unknown',
      action: 'MEMBER_REMOVED', description: `Member ${memberDoc.data()!.email || memberId} removed`,
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;