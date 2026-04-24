import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';
import { apiFetch } from '../api';

export interface DbUser {
  id: string;
  googleUid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
  stats: {
    totalPosts: number;
    qualifyingPosts: number;
    totalUpvotesReceived: number;
    totalDownvotesReceived: number;
  };
}

interface AuthContextValue {
  firebaseUser: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncWithBackend = useCallback(async (user: User) => {
    try {
      await apiFetch('/api/auth/sync', {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }),
      });

      const me: DbUser = await apiFetch('/api/auth/me');
      setDbUser(me);
    } catch (err) {
      console.error('Backend sync failed:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await syncWithBackend(user);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [syncWithBackend]);

  const signIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncWithBackend(result.user);
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  }, [syncWithBackend]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setDbUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, dbUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
