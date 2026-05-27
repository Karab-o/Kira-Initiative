import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';

const auth = admin.auth();

/**
 * Middleware to verify Firebase ID token
 * Attaches user info to req.user
 */
export async function verifyFirebaseToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authentication token provided' 
      });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }

    res.status(401).json({ 
      error: 'Authentication failed', 
      message: error.message 
    });
  }
}

/**
 * Verify token and require specific role
 */
export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split('Bearer ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decodedToken = await auth.verifyIdToken(token);
      const userRole = decodedToken.role || 'user';

      if (!roles.includes(userRole)) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: `Role '${userRole}' is not authorized` 
        });
      }

      req.user = decodedToken;
      req.userId = decodedToken.uid;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  };
}

/**
 * Create a new Firebase user
 */
export async function createFirebaseUser({ email, password, displayName }) {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });
    return userRecord;
  } catch (error) {
    logger.error('Error creating Firebase user:', error);
    throw error;
  }
}

/**
 * Get Firebase user by UID
 */
export async function getFirebaseUser(uid) {
  try {
    return await auth.getUser(uid);
  } catch (error) {
    logger.error('Error getting Firebase user:', error);
    throw error;
  }
}

/**
 * Update Firebase user
 */
export async function updateFirebaseUser(uid, updates) {
  try {
    return await auth.updateUser(uid, updates);
  } catch (error) {
    logger.error('Error updating Firebase user:', error);
    throw error;
  }
}

/**
 * Delete Firebase user
 */
export async function deleteFirebaseUser(uid) {
  try {
    await auth.deleteUser(uid);
  } catch (error) {
    logger.error('Error deleting Firebase user:', error);
    throw error;
  }
}

/**
 * Set custom claims for user (e.g., role)
 */
export async function setUserClaims(uid, claims) {
  try {
    await auth.setCustomUserClaims(uid, claims);
  } catch (error) {
    logger.error('Error setting custom claims:', error);
    throw error;
  }
}

/**
 * Generate custom token for testing
 */
export async function generateCustomToken(uid) {
  try {
    return await auth.createCustomToken(uid);
  } catch (error) {
    logger.error('Error generating custom token:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    logger.error('Error getting user by email:', error);
    throw error;
  }
}
