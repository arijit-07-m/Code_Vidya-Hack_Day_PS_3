import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "code-vidya-hack-day-ps-3-6b47d.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "code-vidya-hack-day-ps-3-6b47d",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "code-vidya-hack-day-ps-3-6b47d.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "883458590456",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:883458590456:web:9c813f6634a8c5956a9d0d",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (e) {
  console.error('Firebase init error:', e);
}

export { app, auth, db, storage };