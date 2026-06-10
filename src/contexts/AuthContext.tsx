// ============================================================
// GrindOS — Auth Context (Firebase Authentication & Local User)
// ============================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  deleteUser,
  type User,
} from 'firebase/auth';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useLiveQuery } from 'dexie-react-hooks';
import { auth, googleProvider, isFirebaseConfigured, firestore } from '../lib/firebase';
import { startSync, stopSync } from '../domain/syncEngine';
import { db } from '../db/database';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  profileName: string;
  profileAvatar: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileInfo: (name: string, avatarId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isConfigured: false,
  profileName: 'Grinder',
  profileAvatar: 'human:coder',
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateProfileInfo: async () => {},
  deleteAccount: async () => {},
});

const SYNC_TABLES = [
  'tasks',
  'reviews',
  'workstreams',
  'notifications',
  'dsaProgress',
  'weeklyTemplates',
  'userConfig',
  'journalEntries',
  'notificationLogs',
];

async function clearAllFirestoreData(uid: string) {
  if (!firestore) return;
  for (const tableName of SYNC_TABLES) {
    const colRef = collection(firestore, 'users', uid, tableName);
    try {
      const snapshot = await getDocs(colRef);
      for (const d of snapshot.docs) {
        await deleteDoc(doc(firestore, 'users', uid, tableName, d.id));
      }
    } catch (err) {
      console.warn(`[Auth] Failed to clear Firestore table ${tableName}:`, err);
    }
  }
}

async function clearAllLocalData() {
  await db.transaction('rw', [
    db.tasks,
    db.reviews,
    db.workstreams,
    db.notifications,
    db.dsaProgress,
    db.weeklyTemplates,
    db.userConfig,
    db.journalEntries,
    db.notificationLogs,
  ], async () => {
    await db.tasks.clear();
    await db.reviews.clear();
    await db.workstreams.clear();
    await db.notifications.clear();
    await db.dsaProgress.clear();
    await db.weeklyTemplates.clear();
    await db.userConfig.clear();
    await db.journalEntries.clear();
    await db.notificationLogs.clear();
  });
  localStorage.clear();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseConfigured();

  // Read local config for local-only fallback
  const localConfig = useLiveQuery(() => db.userConfig.get('default'));

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

  const updateProfileInfo = async (name: string, avatarId: string) => {
    // 1. Update local config first (caches it locally)
    const existingConfig = await db.userConfig.get('default');
    if (existingConfig) {
      await db.userConfig.update('default', {
        displayName: name,
        avatarId: avatarId,
        updatedAt: Date.now(),
      });
    } else {
      await db.userConfig.add({
        id: 'default',
        challengeStartDate: new Date().toISOString().split('T')[0],
        challengeWeeks: 7,
        goalDescription: 'My Execution Goal',
        goalCategory: 'Custom',
        onboardingCompleted: false,
        displayName: name,
        avatarId: avatarId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // 2. If online and authenticated, update Firebase Auth profile
    if (auth && auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: avatarId,
        });
        await auth.currentUser.reload();
        setUser(auth.currentUser);
      } catch (err) {
        console.error('[Auth] Failed to update Firebase profile:', err);
      }
    }
  };

  const deleteAccount = async () => {
    const currentUser = auth?.currentUser;
    if (currentUser) {
      try {
        // Clear remote Firestore data
        await clearAllFirestoreData(currentUser.uid);
        // Delete user in auth
        await deleteUser(currentUser);
      } catch (err) {
        console.error('[Auth] Error deleting user account:', err);
        throw err;
      }
    }

    // Clear local Dexie database
    await clearAllLocalData();
    setUser(null);

    // Reload window to trigger default seeding automatically
    window.location.href = '/';
  };

  // Derive profile attributes (Firebase Auth vs. Local Dexie config fallback)
  const profileName = user
    ? user.displayName || user.email?.split('@')[0] || 'User'
    : localConfig?.displayName || 'Grinder';

  const profileAvatar = user
    ? user.photoURL || 'human:coder'
    : localConfig?.avatarId || 'human:coder';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured,
        profileName,
        profileAvatar,
        signInWithGoogle,
        signOut,
        updateProfileInfo,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
