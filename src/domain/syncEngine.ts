// ============================================================
// GrindOS — Offline-First Sync Engine (Dexie ↔ Firestore)
// ============================================================

import Dexie from 'dexie';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../db/database';
import { auth, firestore } from '../lib/firebase';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
type SyncStatusListener = (status: SyncStatus) => void;

let currentStatus: SyncStatus = 'synced';
const listeners = new Set<SyncStatusListener>();
let activeUnsubscribes: (() => void)[] = [];
let syncPromise: Promise<void> | null = null;

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

export function getSyncStatus(): SyncStatus {
  if (!navigator.onLine) return 'offline';
  return currentStatus;
}

export function subscribeSyncStatus(listener: SyncStatusListener) {
  listeners.add(listener);
  listener(getSyncStatus());
  return () => {
    listeners.delete(listener);
  };
}

function setSyncStatus(status: SyncStatus) {
  currentStatus = status;
  listeners.forEach((l) => l(getSyncStatus()));
}

// Helper to get doc ID from local Dexie object
function getDocId(tableName: string, row: any): string {
  if (tableName === 'dsaProgress') {
    return row.lectureId.toString();
  }
  return row.id;
}

// Helper to parse doc ID back to correct Dexie primary key type
function parseDocId(tableName: string, docId: string): string | number {
  if (tableName === 'dsaProgress') {
    return parseInt(docId, 10);
  }
  return docId;
}

function getUpdatedAt(_tableName: string, obj: any): number {
  if (obj.updatedAt !== undefined) return obj.updatedAt;
  if (obj.createdAt !== undefined) return obj.createdAt;
  if (obj.completedAt !== undefined) return obj.completedAt;
  if (obj.firedAt !== undefined) return obj.firedAt;
  return 0;
}

// Helper to remove any undefined fields for Firestore
function sanitizeForFirestore(obj: any): any {
  const clean: any = {};
  for (const key in obj) {
    if (obj[key] === undefined) {
      clean[key] = null;
    } else {
      clean[key] = obj[key];
    }
  }
  return clean;
}

// Perform full merge between Dexie table and Firestore collection
async function syncTable(tableName: string, uid: string, lastSyncTime: number) {
  if (!firestore) return;
  const localTable = db.table(tableName);
  const localItems = await localTable.toArray();
  const localMap = new Map(localItems.map((item) => [getDocId(tableName, item), item]));

  const colRef = collection(firestore, 'users', uid, tableName);
  const snapshot = await getDocs(colRef);
  const remoteItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const remoteMap = new Map(remoteItems.map((item) => [item.id, item]));

  const keys = new Set([...localMap.keys(), ...remoteMap.keys()]);

  await db.transaction('rw', localTable, async () => {
    const tx = Dexie.currentTransaction as any;
    if (tx) {
      tx.customData = { isSync: true };
    }

    for (const key of keys) {
      const localItem = localMap.get(key);
      const remoteItem = remoteMap.get(key);

      if (localItem && remoteItem) {
        // Exists in both, compare timestamps
        const localTime = getUpdatedAt(tableName, localItem);
        const remoteTime = getUpdatedAt(tableName, remoteItem);

        if (localTime > remoteTime) {
          // Local is newer, upload to Firestore
          const docRef = doc(firestore!, 'users', uid, tableName, key);
          await setDoc(docRef, sanitizeForFirestore(localItem));
        } else if (remoteTime > localTime) {
          // Remote is newer, update local Dexie
          const parsedKey = parseDocId(tableName, key);
          const cleanItem: any = { ...remoteItem };
          if (tableName === 'dsaProgress') {
            cleanItem.lectureId = parsedKey;
            delete cleanItem.id;
          } else {
            cleanItem.id = parsedKey;
          }
          await localTable.put(cleanItem);
        }
      } else if (localItem && !remoteItem) {
        // Local exists, remote doesn't. Was it created locally or deleted remotely?
        const localTime = getUpdatedAt(tableName, localItem);
        if (localTime > lastSyncTime) {
          // Created locally after last sync -> upload
          const docRef = doc(firestore!, 'users', uid, tableName, key);
          await setDoc(docRef, sanitizeForFirestore(localItem));
        } else {
          // Deleted remotely -> delete local
          await localTable.delete(parseDocId(tableName, key));
        }
      } else if (!localItem && remoteItem) {
        // Remote exists, local doesn't. Was it deleted locally or created remotely?
        const remoteTime = getUpdatedAt(tableName, remoteItem);
        if (remoteTime > lastSyncTime) {
          // Created remotely after last sync -> download
          const parsedKey = parseDocId(tableName, key);
          const cleanItem: any = { ...remoteItem };
          if (tableName === 'dsaProgress') {
            cleanItem.lectureId = parsedKey;
            delete cleanItem.id;
          } else {
            cleanItem.id = parsedKey;
          }
          await localTable.put(cleanItem);
        } else {
          // Deleted locally -> delete remote
          const docRef = doc(firestore!, 'users', uid, tableName, key);
          await deleteDoc(docRef);
        }
      }
    }
  });
}

function setupRealtimeListeners(uid: string) {
  if (!firestore) return;

  SYNC_TABLES.forEach((tableName) => {
    const colRef = collection(firestore!, 'users', uid, tableName);
    const unsub = onSnapshot(
      colRef,
      async (snapshot) => {
        const localTable = db.table(tableName);

        await db.transaction('rw', localTable, async () => {
          const tx = Dexie.currentTransaction as any;
          if (tx) {
            tx.customData = { isSync: true };
          }

          for (const change of snapshot.docChanges()) {
            const docId = change.doc.id;
            const remoteData = change.doc.data();

            if (change.type === 'removed') {
              const parsedKey = parseDocId(tableName, docId);
              const exists = await localTable.get(parsedKey);
              if (exists) {
                await localTable.delete(parsedKey);
              }
            } else {
              const parsedKey = parseDocId(tableName, docId);
              const localItem = await localTable.get(parsedKey);

              if (localItem) {
                const localTime = getUpdatedAt(tableName, localItem);
                const remoteTime = getUpdatedAt(tableName, remoteData);
                if (remoteTime > localTime) {
                  await localTable.put({
                    ...remoteData,
                    [tableName === 'dsaProgress' ? 'lectureId' : 'id']: parsedKey,
                  });
                }
              } else {
                await localTable.put({
                  ...remoteData,
                  [tableName === 'dsaProgress' ? 'lectureId' : 'id']: parsedKey,
                });
              }
            }
          }
        });
      },
      (err) => {
        console.error(`[Sync] Real-time sync error for ${tableName}:`, err);
        setSyncStatus('error');
      }
    );

    activeUnsubscribes.push(unsub);
  });
}

export function startSync(uid: string) {
  if (!firestore || !auth) return;
  if (syncPromise) return;

  setSyncStatus('syncing');

  syncPromise = (async () => {
    try {
      const lastSyncKey = `grindos_last_sync_time_${uid}`;
      const lastSyncTime = parseInt(localStorage.getItem(lastSyncKey) || '0', 10);

      // 1. Run initial merge
      for (const tableName of SYNC_TABLES) {
        await syncTable(tableName, uid, lastSyncTime);
      }

      localStorage.setItem(lastSyncKey, Date.now().toString());
      setSyncStatus('synced');

      // 2. Start realtime monitoring
      setupRealtimeListeners(uid);
    } catch (err) {
      console.error('[Sync] Initial sync failed:', err);
      setSyncStatus('error');
      syncPromise = null;
    }
  })();
}

export function stopSync() {
  activeUnsubscribes.forEach((unsub) => unsub());
  activeUnsubscribes = [];
  syncPromise = null;
  setSyncStatus('synced');
}

// Register global Dexie hooks for outbound synchronization
if (auth && firestore) {
  SYNC_TABLES.forEach((tableName) => {
    const table = db.table(tableName);

    table.hook('creating', function (this: any, _primKey, obj, _transaction) {
      const tx = Dexie.currentTransaction as any;
      if (tx?.customData?.isSync) return;

      this.onsubmit = () => {
        const user = auth?.currentUser;
        if (!user) return;

        const docId = getDocId(tableName, obj);
        const docRef = doc(firestore!, 'users', user.uid, tableName, docId);
        setDoc(docRef, sanitizeForFirestore(obj)).catch((err) => {
          console.error(`[Sync] Failed to sync create for ${tableName}/${docId}:`, err);
        });
      };
    });

    table.hook('updating', function (this: any, _mods, _primKey, _obj, _transaction) {
      const tx = Dexie.currentTransaction as any;
      if (tx?.customData?.isSync) return;

      this.onsubmit = (updatedObj: any) => {
        const user = auth?.currentUser;
        if (!user) return;

        const docId = getDocId(tableName, updatedObj);
        const docRef = doc(firestore!, 'users', user.uid, tableName, docId);
        setDoc(docRef, sanitizeForFirestore(updatedObj)).catch((err) => {
          console.error(`[Sync] Failed to sync update for ${tableName}/${docId}:`, err);
        });
      };
    });

    table.hook('deleting', function (this: any, _primKey, obj, _transaction) {
      const tx = Dexie.currentTransaction as any;
      if (tx?.customData?.isSync) return;

      this.onsubmit = () => {
        const user = auth?.currentUser;
        if (!user) return;

        const docId = getDocId(tableName, obj);
        const docRef = doc(firestore!, 'users', user.uid, tableName, docId);
        deleteDoc(docRef).catch((err) => {
          console.error(`[Sync] Failed to sync delete for ${tableName}/${docId}:`, err);
        });
      };
    });
  });

  // Listen to connectivity status changes
  window.addEventListener('online', () => {
    const user = auth?.currentUser;
    if (user) {
      syncPromise = null;
      startSync(user.uid);
    }
  });

  window.addEventListener('offline', () => {
    setSyncStatus('offline');
  });
}
