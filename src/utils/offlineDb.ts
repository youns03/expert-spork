/**
 * IndexedDB Offline Database for French Lessons, Synthesized Audio Blobs, & Model State
 * Works 100% offline on Android APK / Capacitor and Browsers without any API keys.
 */

import { AudioProject, SentenceItem } from '../types';

const DB_NAME = 'french_audio_learning_db_v1';
const DB_VERSION = 1;
const STORE_LESSONS = 'lessons';
const STORE_AUDIO_BLOBS = 'audio_blobs';
const STORE_SETTINGS = 'settings';

let dbInstance: IDBDatabase | null = null;

export async function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_LESSONS)) {
        db.createObjectStore(STORE_LESSONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO_BLOBS)) {
        db.createObjectStore(STORE_AUDIO_BLOBS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error('تعذر فتح قاعدة البيانات المحلية IndexedDB'));
    };
  });
}

/**
 * Save a complete audio lesson
 */
export async function saveLessonOffline(lesson: AudioProject): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_LESSONS], 'readwrite');
    const store = tx.objectStore(STORE_LESSONS);
    const req = store.put(lesson);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Load all offline lessons
 */
export async function loadAllOfflineLessons(): Promise<AudioProject[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_LESSONS], 'readonly');
    const store = tx.objectStore(STORE_LESSONS);
    const req = store.getAll();
    req.onsuccess = () => {
      const results: AudioProject[] = req.result || [];
      // Sort newest first
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a lesson from offline storage
 */
export async function deleteLessonOffline(lessonId: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_LESSONS], 'readwrite');
    const store = tx.objectStore(STORE_LESSONS);
    const req = store.delete(lessonId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save an audio blob or wav array buffer with key
 */
export async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_AUDIO_BLOBS], 'readwrite');
    const store = tx.objectStore(STORE_AUDIO_BLOBS);
    const req = store.put({ id, blob, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve an audio blob by id
 */
export async function getAudioBlob(id: string): Promise<Blob | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_AUDIO_BLOBS], 'readonly');
    const store = tx.objectStore(STORE_AUDIO_BLOBS);
    const req = store.get(id);
    req.onsuccess = () => {
      resolve(req.result ? req.result.blob : null);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Check Cache Storage size (for Kokoro ONNX model files)
 */
export async function getModelCacheInfo(): Promise<{ cached: boolean; totalBytes: number; modelName: string }> {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const kokoroCaches = cacheNames.filter(name => 
        name.includes('transformers') || name.includes('onnx') || name.includes('kokoro')
      );

      if (kokoroCaches.length > 0) {
        let totalSize = 0;
        for (const cName of kokoroCaches) {
          const cache = await caches.open(cName);
          const requests = await cache.keys();
          for (const req of requests) {
            const resp = await cache.match(req);
            if (resp) {
              const blob = await resp.clone().blob();
              totalSize += blob.size;
            }
          }
        }
        return {
          cached: totalSize > 10 * 1024 * 1024, // > 10MB means model weights are stored
          totalBytes: totalSize,
          modelName: 'Kokoro-82M-v1.0-ONNX (q8)'
        };
      }
    }
  } catch (err) {
    console.warn('Error reading CacheStorage info:', err);
  }

  return {
    cached: false,
    totalBytes: 0,
    modelName: 'Kokoro-82M-v1.0-ONNX (q8)'
  };
}

/**
 * Clear model cache from CacheStorage
 */
export async function clearModelCache(): Promise<boolean> {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.includes('transformers') || name.includes('onnx') || name.includes('kokoro')) {
          await caches.delete(name);
        }
      }
      return true;
    }
  } catch (err) {
    console.error('Error clearing model cache:', err);
  }
  return false;
}
