'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { COLLECTIONS } from '../@clubops/config';
import type { UserProfile } from '../@clubops/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout - force loading to false after 2.5 seconds
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2500);

    let unsubscribe: (() => void) | undefined;

    if (auth) {
      try {
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          clearTimeout(timeoutId);
          setUser(firebaseUser);
          if (firebaseUser) {
            // Fire and forget profile fetch - don't block on it
            getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid)).then((profileDoc) => {
              if (profileDoc.exists()) {
                setProfile(profileDoc.data() as UserProfile);
              } else {
                const newProfile: UserProfile = {
                  uid: firebaseUser.uid,
                  displayName: firebaseUser.displayName || '',
                  email: firebaseUser.email || '',
                  photoURL: firebaseUser.photoURL || undefined,
                  createdAt: new Date().toISOString(),
                };
                setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newProfile).catch(() => {});
                setProfile(newProfile);
              }
            }).catch(() => {});
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
      } catch (err) {
        console.error('Auth state error:', err);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    } else {
      // No Firebase auth available
      clearTimeout(timeoutId);
      setLoading(false);
    }

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      displayName,
      email: cred.user.email || '',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), newProfile);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
