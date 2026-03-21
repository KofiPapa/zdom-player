// IndexedDB wrapper for offline caching in the ZDOM player

const DB_NAME = "zdom-player";
const DB_VERSION = 1;

const STORE_PLAYLISTS = "playlists";
const STORE_SCREENS = "screens";
const STORE_PLAY_LOG_QUEUE = "playLogQueue";
const STORE_HEARTBEAT_QUEUE = "heartbeatQueue";

export interface PlayLogEntry {
  id?: number;
  screenId: string;
  playlistId: string;
  mediaItemId: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  createdAt: string;
}

export interface HeartbeatEntry {
  id?: number;
  screenId: string;
  timestamp: string;
  status: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_PLAYLISTS)) {
        db.createObjectStore(STORE_PLAYLISTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SCREENS)) {
        db.createObjectStore(STORE_SCREENS, { keyPath: "screenId" });
      }
      if (!db.objectStoreNames.contains(STORE_PLAY_LOG_QUEUE)) {
        db.createObjectStore(STORE_PLAY_LOG_QUEUE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(STORE_HEARTBEAT_QUEUE)) {
        db.createObjectStore(STORE_HEARTBEAT_QUEUE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txPut<T>(storeName: string, value: T): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(value);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
  );
}

function txGet<T>(storeName: string, key: string): Promise<T | undefined> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
  );
}

function txAdd<T>(storeName: string, value: T): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.add(value);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
  );
}

function txGetAllAndClear<T>(storeName: string): Promise<T[]> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const getAllReq = store.getAll();

        getAllReq.onsuccess = () => {
          const items = getAllReq.result as T[];
          const clearReq = store.clear();
          clearReq.onsuccess = () => resolve(items);
          clearReq.onerror = () => reject(clearReq.error);
        };

        getAllReq.onerror = () => reject(getAllReq.error);
        tx.oncomplete = () => db.close();
      })
  );
}

// ---- Playlist caching ----

export async function cachePlaylist(playlist: Record<string, unknown>): Promise<void> {
  if (!playlist.id) {
    throw new Error("Playlist must have an id");
  }
  await txPut(STORE_PLAYLISTS, playlist);
}

export async function getCachedPlaylist(id: string): Promise<Record<string, unknown> | undefined> {
  return txGet(STORE_PLAYLISTS, id);
}

// ---- Screen config caching ----

export async function cacheScreenConfig(config: Record<string, unknown>): Promise<void> {
  if (!config.screenId) {
    throw new Error("Config must have a screenId");
  }
  await txPut(STORE_SCREENS, config);
}

export async function getCachedScreenConfig(
  screenId: string
): Promise<Record<string, unknown> | undefined> {
  return txGet(STORE_SCREENS, screenId);
}

// ---- Play log queue (offline-safe) ----

export async function queuePlayLog(log: Omit<PlayLogEntry, "id">): Promise<void> {
  await txAdd(STORE_PLAY_LOG_QUEUE, log);
}

/**
 * Flush all queued play logs to Firestore.
 * Accepts a Firestore `db` instance (from firebase/firestore) so the cache
 * module itself stays free of Firebase imports.
 */
export async function flushPlayLogQueue(
  db: import("firebase/firestore").Firestore
): Promise<number> {
  const { collection, addDoc } = await import("firebase/firestore");
  const items = await txGetAllAndClear<PlayLogEntry>(STORE_PLAY_LOG_QUEUE);

  let flushed = 0;
  for (const log of items) {
    try {
      const { id: _id, ...data } = log;
      await addDoc(collection(db, "playLogs"), data);
      flushed++;
    } catch (err) {
      // Re-queue items that failed to send
      console.error("Failed to flush play log, re-queuing:", err);
      await txAdd(STORE_PLAY_LOG_QUEUE, log);
    }
  }
  return flushed;
}

// ---- Heartbeat queue (offline-safe) ----

export async function queueHeartbeat(screenId: string): Promise<void> {
  const entry: Omit<HeartbeatEntry, "id"> = {
    screenId,
    timestamp: new Date().toISOString(),
    status: "online",
  };
  await txAdd(STORE_HEARTBEAT_QUEUE, entry);
}

export async function flushHeartbeatQueue(
  db: import("firebase/firestore").Firestore
): Promise<number> {
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  const items = await txGetAllAndClear<HeartbeatEntry>(STORE_HEARTBEAT_QUEUE);

  let flushed = 0;
  for (const heartbeat of items) {
    try {
      const screenRef = doc(db, "screens", heartbeat.screenId);
      await updateDoc(screenRef, {
        status: "online",
        lastHeartbeat: serverTimestamp(),
      });
      flushed++;
    } catch (err) {
      console.error("Failed to flush heartbeat, re-queuing:", err);
      await txAdd(STORE_HEARTBEAT_QUEUE, heartbeat);
    }
  }
  return flushed;
}
