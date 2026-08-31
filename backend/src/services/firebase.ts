import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Load .env
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  try { const dotenv = require('dotenv'); dotenv.config({ path: envPath }); } catch (e) { /* ignore */ }
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project';
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-bucket';

let initialized = false;
let initError: string | null = null;

try {
  // Try application default credentials first
  admin.initializeApp({
    projectId,
    storageBucket,
  });
  initialized = true;
  console.log('✅ Firebase Admin initialized');
} catch (err: any) {
  initError = err.message;
  console.warn(`⚠️ Firebase Admin SDK: ${err.message}`);
  // Initialize with minimal config for compilation
  try {
    admin.initializeApp({
      projectId,
      storageBucket,
      credential: {
        getAccessToken: () => Promise.resolve({ access_token: 'mock', expires_in: 3600 }),
      } as any,
    });
    console.warn('   Running with mock credentials (limited functionality)');
  } catch (e2: any) {
    console.error('   Failed to initialize even mock credentials:', e2.message);
  }
}

export const firestore = admin.firestore();
export const auth = initialized ? admin.auth() : null;
export const storage = initialized ? admin.storage() : null;
export const adminApp = admin.apps[0] || null;

export default adminApp;