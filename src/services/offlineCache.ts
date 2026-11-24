// [MILESTONE 3 / Sub-CPMK 9] Offline Cache & Offline Action Queue
// Graceful offline fallback using AsyncStorage.
// Stores food rescue listings locally so the app remains fully functional
// when network connection drops, and queues actions (e.g. food reservations)
// to be synced once connection is restored.

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FoodListing, OfflineAction } from '../types';

const STORAGE_KEYS = {
  CACHED_LISTINGS: '@foodrescue:cached_listings',
  OFFLINE_QUEUE: '@foodrescue:offline_queue',
  LAST_CACHE_TIME: '@foodrescue:last_cache_time',
};

/**
 * Cache current listings into persistent storage.
 */
export async function cacheListings(listings: FoodListing[]): Promise<void> {
  try {
    const json = JSON.stringify(listings);
    const now = new Date().toISOString();
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.CACHED_LISTINGS, json],
      [STORAGE_KEYS.LAST_CACHE_TIME, now],
    ]);
  } catch (error) {
    console.warn('[OfflineCache] Failed to cache listings:', error);
  }
}

/**
 * Retrieve cached listings during offline startup or connection failure.
 */
export async function getCachedListings(): Promise<FoodListing[] | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_LISTINGS);
    if (!json) return null;
    return JSON.parse(json) as FoodListing[];
  } catch (error) {
    console.warn('[OfflineCache] Failed to read cached listings:', error);
    return null;
  }
}

/**
 * Get timestamp of when the listings were last cached.
 */
export async function getLastCacheTimestamp(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_CACHE_TIME);
  } catch {
    return null;
  }
}

/**
 * Read all pending offline actions waiting to be synced with the server.
 */
export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!json) return [];
    return JSON.parse(json) as OfflineAction[];
  } catch (error) {
    console.warn('[OfflineCache] Failed to read offline queue:', error);
    return [];
  }
}

/**
 * Enqueue an action performed while offline (e.g. reserve pickup).
 */
export async function enqueueOfflineAction(
  action: Omit<OfflineAction, 'id' | 'timestamp'>,
): Promise<OfflineAction> {
  const newAction: OfflineAction = {
    ...action,
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const currentQueue = await getOfflineQueue();
    const updatedQueue = [...currentQueue, newAction];
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue));
  } catch (error) {
    console.warn('[OfflineCache] Failed to enqueue offline action:', error);
  }

  return newAction;
}

/**
 * Remove a successfully synced action from the offline queue.
 */
export async function removeOfflineAction(id: string): Promise<void> {
  try {
    const currentQueue = await getOfflineQueue();
    const updatedQueue = currentQueue.filter((a) => a.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue));
  } catch (error) {
    console.warn('[OfflineCache] Failed to remove offline action:', error);
  }
}

/**
 * Clear the entire offline queue (e.g. after full batch synchronization).
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  } catch (error) {
    console.warn('[OfflineCache] Failed to clear offline queue:', error);
  }
}
