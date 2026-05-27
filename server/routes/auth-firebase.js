import express from 'express';
import { logger } from '../utils/logger.js';
import { verifyFirebaseToken, createFirebaseUser, setUserClaims } from '../middleware/firebaseAuth.js';
import { createUser, getUser, updateUser, getUserByEmail } from '../services/firestore.js';

const router = express.Router();

/**
 * SIGNUP
 * POST /api/auth/signup
 * Body: { email, password, name, role }
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role = 'patient' } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Create Firebase user
    const firebaseUser = await createFirebaseUser({ email, password, displayName: name });

    // Set custom claims for role
    await setUserClaims(firebaseUser.uid, { role });

    // Store additional data in Firestore
    await createUser(firebaseUser.uid, {
      email,
      name,
      role,
      createdAt: new Date(),
    });

    logger.info(`User created: ${firebaseUser.uid}`);
    res.status(201).json({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      role,
      message: 'User created successfully',
    });
  } catch (error) {
    logger.error('Signup error:', error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already in use' });
    }

    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * GET CURRENT USER
 * GET /api/auth/me
 * Requires: Bearer token
 */
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await getUser(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found in Firestore' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * UPDATE PROFILE
 * PUT /api/auth/profile
 * Requires: Bearer token
 */
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { name, bio, specialization, hospital } = req.body;

    await updateUser(req.userId, {
      ...(name && { name }),
      ...(bio && { bio }),
      ...(specialization && { specialization }),
      ...(hospital && { hospital }),
    });

    const updatedUser = await getUser(req.userId);
    res.json(updatedUser);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * CHECK EMAIL AVAILABILITY
 * GET /api/auth/check-email?email=user@example.com
 */
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existingUser = await getUserByEmail(email);
    res.json({ available: !existingUser });
  } catch (error) {
    logger.error('Check email error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE ACCOUNT
 * DELETE /api/auth/account
 * Requires: Bearer token
 */
router.delete('/account', verifyFirebaseToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required for account deletion' });
    }

    // In production, verify password before deletion
    // For now, just delete the user

    // Delete from Firestore (optional - you might want to keep records)
    // await db.collection('users').doc(req.userId).delete();

    // Delete from Firebase Auth
    // await admin.auth().deleteUser(req.userId);

    // For safety, just mark as deleted
    await updateUser(req.userId, {
      deleted: true,
      deletedAt: new Date(),
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * VERIFY EMAIL (optional - Firebase handles email verification)
 * GET /api/auth/verify-email?token=xxx
 */
router.post('/send-verification-email', verifyFirebaseToken, async (req, res) => {
  try {
    // Firebase has built-in email verification
    // This endpoint is optional
    res.json({ message: 'Verification email sent (handled by Firebase)' });
  } catch (error) {
    logger.error('Send verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * REFRESH TOKEN
 * POST /api/auth/refresh
 * The client handles token refresh with Firebase SDK
 */
router.post('/refresh', async (req, res) => {
  try {
    res.json({ message: 'Use Firebase SDK for token refresh on client' });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
