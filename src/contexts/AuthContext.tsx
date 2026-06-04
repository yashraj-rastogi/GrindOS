// ============================================================
// GrindOS — Auth Context (Firebase Authentication)
// ============================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { startSync, stopSync } from '../domain/syncEngine';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isConfigured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!auth || !isConfigured) {
      // No Firebase — skip auth, run in local-only mode
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        startSync(firebaseUser.uid);
      } else {
        stopSync();
      }
    });

    return () => {
      unsubscribe();
      stopSync();
    };
  }, [isConfigured]);

  const signInWithGoogle = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('[Auth] Google sign-in failed:', err);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('[Auth] Sign-out failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isConfigured, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
