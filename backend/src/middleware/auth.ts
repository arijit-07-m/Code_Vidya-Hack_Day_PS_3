import { Request, Response, NextFunction } from 'express';
import { auth } from '../services/firebase';
import { firestore } from '../services/firebase';
import { COLLECTIONS } from '../@clubops/config';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
  };
  clubMembership?: {
    clubId: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    if (!auth) {
      res.status(503).json({ error: 'Authentication service unavailable. Configure Firebase Admin SDK.' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireClubMembership = (requiredRoles?: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubId = req.params.clubId || req.body.clubId || req.query.clubId;
      if (!clubId) {
        res.status(400).json({ error: 'Club ID is required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!firestore) {
      res.status(503).json({ error: 'Database service unavailable' });
      return;
    }

    const memberSnapshot = await firestore
        .collection(COLLECTIONS.CLUB_MEMBERS)
        .where('userId', '==', req.user.uid)
        .where('clubId', '==', clubId)
        .where('status', '==', 'ACTIVE')
        .limit(1)
        .get();

      if (memberSnapshot.empty) {
        res.status(403).json({ error: 'You are not a member of this club' });
        return;
      }

      const memberData = memberSnapshot.docs[0].data();
      req.clubMembership = {
        clubId: clubId as string,
        role: memberData.role,
      };

      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(memberData.role)) {
          res.status(403).json({ error: 'Insufficient permissions for this action' });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Club membership check error:', error);
      res.status(500).json({ error: 'Failed to verify club membership' });
    }
  };
};
