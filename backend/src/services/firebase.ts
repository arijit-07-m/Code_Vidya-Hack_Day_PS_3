import * as admin from 'firebase-admin';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

let firebaseApp: admin.app.App;

if (serviceAccountPath) {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const firestore = admin.firestore(firebaseApp);
export const auth = admin.auth(firebaseApp);
export const storage = admin.storage(firebaseApp);
export const adminApp = firebaseApp;

export default firebaseApp;