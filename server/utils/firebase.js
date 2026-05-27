import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Initialize Firebase Admin SDK
 * 
 * Expects:
 * - FIREBASE_SERVICE_ACCOUNT_KEY: Path to service account JSON file
 *   OR environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.)
 */
export function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      logger.info('Firebase already initialized');
      return;
    }

    let serviceAccount;

    // Try to load from file first
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const keyPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      if (fs.existsSync(keyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        logger.info('Loaded Firebase service account from file');
      }
    }

    // Otherwise, construct from environment variables
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
      logger.info('Using Firebase credentials from environment variables');
    }

    if (!serviceAccount) {
      throw new Error(
        'Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or Firebase env variables'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

export { admin };
