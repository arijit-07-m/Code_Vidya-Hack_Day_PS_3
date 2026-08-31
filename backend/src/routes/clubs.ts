import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { firestore } from '../services/firebase';
import { COLLECTIONS } from '../@clubops/config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create a club
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, category, facultyCoordinator } = req.body;
    const userId = req.user!.uid;
    const clubId = uuidv4();

    const clubData = {
      id: clubId,
      name,
      description: description || '',
      category: category || '',
      facultyCoordinator: facultyCoordinator || '',
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection(COLLECTIONS.CLUBS).doc(clubId).set(clubData);

    const memberId = uuidv4();
    await firestore.collection(COLLECTIONS.CLUB_MEMBERS).doc(memberId).set({
      id: memberId,
      clubId,
      userId,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
    });

    await firestore.collection(COLLECTIONS.ACTIVITY_LOGS).add({
      clubId,
      userId,
      userName: req.user!.email || 'Unknown',
      action: 'CLUB_CREATED',
      description: `Club "${name}" was created`,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ club: clubData });
  } catch (error) {
    console.error('Create club error:', error);
    res.status(500).json({ error: 'Failed to create club' });
  }
});

// Get user's clubs
router.get('/my', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const membersSnapshot = await firestore
      .collection(COLLECTIONS.CLUB_MEMBERS)
      .where('userId', '==', userId)
      .where('status', '==', 'ACTIVE')
      .get();

    const clubMemberships = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const clubs = await Promise.all(
      clubMemberships.map(async (membership: any) => {
        const clubDoc = await firestore.collection(COLLECTIONS.CLUBS).doc(membership.clubId).get();
        if (clubDoc.exists) {
          return { ...clubDoc.data(), membershipRole: membership.role, membershipId: membership.id };
        }
        return null;
      })
    );

    res.json({ clubs: clubs.filter(Boolean) });
  } catch (error) {
    console.error('Get my clubs error:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

export default router;
