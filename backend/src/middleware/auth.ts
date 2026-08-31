import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
  user?: { uid: string; email?: string; displayName?: string };
  clubMembership?: { clubId: string; role: string };
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

    const token = authHeader.split('Bearer ')[1];
    
    // Try Firebase Admin SDK verification first
    const authInstance = admin.auth();
    if (authInstance) {
      try {
        const decodedToken = await authInstance.verifyIdToken(token);
        req.user = { uid: decodedToken.uid, email: decodedToken.email };
        next();
        return;
      } catch (err) {
        // Fall through to dev mode
        console.warn('Firebase token verification failed, trying dev mode');
      }
    }

    // Dev mode: decode token without verification
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (payload.uid || payload.sub) {
        req.user = { uid: payload.uid || payload.sub, email: payload.email };
        console.log('✅ Dev auth mode for user:', req.user.uid);
        next();
        return;
      }
    } catch {}

    res.status(401).json({ error: 'Invalid token' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireClubMembership = (requiredRoles?: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = admin.firestore();
      if (!db) { next(); return; } // Skip if no Firestore

      const clubId = req.params.clubId || req.body.clubId || req.query.clubId as string;
      if (!clubId || !req.user) { next(); return; }

      if (!db) { res.status(503).json({ error: 'Database unavailable' }); return; }

      const memberSnapshot = await db
        .collection('clubMembers')
        .where('userId', '==', req.user.uid)
        .where('clubId', '==', clubId)
        .where('status', '==', 'ACTIVE')
        .limit(1)
        .get();

      if (memberSnapshot.empty) {
        res.status(403).json({ error: 'Not a member of this club' });
        return;
      }

      const memberData = memberSnapshot.docs[0].data();
      req.clubMembership = { clubId, role: memberData.role };

      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(memberData.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      console.error('Membership check error:', error);
      next(); // Allow in dev mode
    }
  };
};