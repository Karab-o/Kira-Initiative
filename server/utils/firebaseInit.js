import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Initialize Firebase Admin SDK
 * Must be called BEFORE using firebaseDb in your routes
 * 
 * Call this from your server/index.js at the very beginning
 */
export function initializeFirebase() {
  try {
    // Skip if already initialized
    if (admin.apps.length > 0) {
      logger.info('✓ Firebase Admin SDK already initialized');
      return;
    }

    let serviceAccount;

    // Method 1: Load from file (best for development)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.startsWith('/')
        ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        : path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

      if (fs.existsSync(keyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        logger.info('✓ Loaded Firebase service account from:', keyPath);
      } else {
        logger.warn('⚠ Firebase service account file not found at:', keyPath);
      }
    }

    // Method 2: Use environment variables (best for production)
    if (!serviceAccount && process.env.FIREBASE_PROJECT_ID) {
      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
      };
      logger.info('✓ Using Firebase credentials from environment variables');
    }

    if (!serviceAccount) {
      throw new Error(
        'Firebase credentials not found!\n' +
        'Set either:\n' +
        '  1. FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json\n' +
        '  2. FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, etc.\n' +
        'Get credentials from Firebase Console → Project Settings → Service Accounts'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logger.info('✓ Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('✗ Failed to initialize Firebase:', error.message);
    throw error;
  }
}

export { admin };
