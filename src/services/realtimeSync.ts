// [MILESTONE 3 / Sub-CPMK 9] Real-Time Data Pipeline & Offline Sync Service
// Integrates WebSocket / Event Stream real-time updates with RxJS Observables
// and manages graceful offline fallbacks and reconnection with backoff.

import { BehaviorSubject, Subject } from 'rxjs';

import { useAppStore } from '../store/useAppStore';
import type {
  ConnectionStatus,
  FoodListing,
  RealtimeEvent,
} from '../types';
import {
  cacheListings,
  clearOfflineQueue,
  getCachedListings,
  getOfflineQueue,
} from './offlineCache';

class RealtimeSyncService {
  private statusSubject = new BehaviorSubject<ConnectionStatus>('connected');
  private eventSubject = new Subject<RealtimeEvent>();

  public readonly status$ = this.statusSubject.asObservable();
  public readonly events$ = this.eventSubject.asObservable();

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private maxReconnectAttempts = 5;
  private isManuallyDisconnected = false;

  private sampleSurplusTemplates: Omit<FoodListing, 'id' | 'distanceKm'>[] = [
    {
      title: 'Fresh Bento Boxes x12',
      donorName: 'Tokyo Dining Senayan',
      donorType: 'restaurant',
      category: 'Cooked meals',
      servings: 12,
      location: { latitude: -6.2215, longitude: 106.8025 },
      address: 'Jl. Asia Afrika No. 19, Senayan',
      availableUntil: new Date(Date.now() + 2 * 3600e3).toISOString(),
      status: 'available',
    },
    {
      title: 'Artisan Sourdough Loaves x8',
      donorName: 'Kemang Artisan Bakery',
      donorType: 'cafe',
      category: 'Bakery',
      servings: 16,
      location: { latitude: -6.2608, longitude: 106.8156 },
      address: 'Jl. Kemang Raya No. 45',
      availableUntil: new Date(Date.now() + 4 * 3600e3).toISOString(),
      status: 'available',
    },
    {
      title: 'Buffet Roast Chicken & Veggies',
      donorName: 'Grand Hyatt Central',
      donorType: 'hotel',
      category: 'Buffet',
      servings: 35,
      location: { latitude: -6.1932, longitude: 106.8236 },
      address: 'Jl. M.H. Thamrin Kav. 28',
      availableUntil: new Date(Date.now() + 3 * 3600e3).toISOString(),
      status: 'available',
    },
    {
      title: 'Fresh Organic Fruit Baskets',
      donorName: 'Hero Supermarket',
      donorType: 'grocery',
      category: 'Produce',
      servings: 20,
      location: { latitude: -6.2253, longitude: 106.8285 },
      address: 'Jl. Gatot Subroto No. 11',
      availableUntil: new Date(Date.now() + 6 * 3600e3).toISOString(),
      status: 'available',
    },
  ];

  constructor() {
    // Listen to real-time events and update Zustand store + local cache
    this.events$.subscribe((event) => {
      this.handleRealtimeEvent(event);
    });

    // Sync state with store
    this.status$.subscribe((status) => {
      useAppStore.getState().setConnectionStatus(status);
    });
  }

  /**
   * Handle incoming real-time event and sync with store & cache
   */
  private handleRealtimeEvent(event: RealtimeEvent) {
    const store = useAppStore.getState();

    switch (event.type) {
      case 'LISTING_CREATED': {
        const newListing = event.payload as FoodListing;
        store.addListing(newListing);
        store.setActiveNotification(`⚡ New Surplus Added: "${newListing.title}"`);
        cacheListings(useAppStore.getState().listings);
        break;
      }

      case 'LISTING_CLAIMED': {
        const { listingId, title } = event.payload as { listingId: string; title?: string };
        store.updateListingStatus(listingId, 'claimed');
        store.setActiveNotification(`✅ Listing Claimed in Real-Time: "${title ?? listingId}"`);
        cacheListings(useAppStore.getState().listings);
        break;
      }

      case 'OFFLINE_SYNC': {
        store.setActiveNotification('🔄 Offline queue successfully synced to server');
        break;
      }

      default:
        break;
    }
  }

  /**
   * Initialize connection and hydrate store with cached or remote listings
   */
  public async initialize(initialListings: FoodListing[]) {
    // Check if we have cached listings
    const cached = await getCachedListings();
    if (cached && cached.length > 0) {
      useAppStore.getState().setListings(cached);
    } else {
      useAppStore.getState().setListings(initialListings);
      await cacheListings(initialListings);
    }

    // Load pending offline queue into store
    const queue = await getOfflineQueue();
    useAppStore.getState().setPendingOfflineActions(queue);

    this.statusSubject.next('connected');
  }

  /**
   * Simulate a disconnect / connection drop (Graceful Offline fallback test)
   */
  public disconnect(manual = true) {
    this.isManuallyDisconnected = manual;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.statusSubject.next('offline');
    useAppStore.getState().setActiveNotification('⚠️ Network disconnected: App switched to Offline Mode (Cached data)');
  }

  /**
   * Connect or reconnect to real-time pipeline
   */
  public connect() {
    this.isManuallyDisconnected = false;
    this.reconnectAttempt = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.statusSubject.next('connecting');

    // Simulate short network handshake
    setTimeout(async () => {
      this.statusSubject.next('connected');
      useAppStore.getState().setActiveNotification('🟢 Real-time pipeline connected & active');

      // Process any pending offline actions upon reconnection
      await this.syncOfflineQueue();
    }, 600);
  }

  /**
   * Toggle connection for classroom presentation demo
   */
  public toggleConnection() {
    if (this.statusSubject.value === 'connected') {
      this.disconnect(true);
    } else {
      this.connect();
    }
  }

  /**
   * Trigger automatic reconnection with exponential backoff (e.g. after network drop)
   */
  public triggerAutoReconnect() {
    if (this.isManuallyDisconnected) return;

    this.statusSubject.next('reconnecting');
    this.reconnectAttempt++;

    const delayMs = Math.min(1000 * Math.pow(2, this.reconnectAttempt - 1), 10000);
    useAppStore.getState().setActiveNotification(
      `🟡 Reconnecting in ${delayMs / 1000}s (Attempt ${this.reconnectAttempt}/${this.maxReconnectAttempts})...`,
    );

    this.reconnectTimer = setTimeout(async () => {
      if (this.reconnectAttempt <= this.maxReconnectAttempts) {
        this.statusSubject.next('connected');
        useAppStore.getState().setActiveNotification('🟢 Connection restored! Syncing updates...');
        await this.syncOfflineQueue();
      } else {
        this.statusSubject.next('offline');
        useAppStore.getState().setActiveNotification('🔴 Reconnect failed: Remaining in Offline Mode');
      }
    }, delayMs);
  }

  /**
   * Process and flush the offline action queue
   */
  public async syncOfflineQueue(): Promise<number> {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return 0;

    // Simulate pushing offline reservations to backend
    const count = queue.length;
    await clearOfflineQueue();
    useAppStore.getState().setPendingOfflineActions([]);

    this.eventSubject.next({
      id: `evt_sync_${Date.now()}`,
      type: 'OFFLINE_SYNC',
      timestamp: new Date().toISOString(),
      message: `Synchronized ${count} queued offline reservation(s)`,
    });

    return count;
  }

  /**
   * Simulate a new food surplus broadcast in real-time (Deliverable 2)
   */
  public simulateIncomingListing(): FoodListing {
    const template =
      this.sampleSurplusTemplates[
        Math.floor(Math.random() * this.sampleSurplusTemplates.length)
      ];

    const newListing: FoodListing = {
      ...template,
      id: `live_${Date.now()}`,
      availableUntil: new Date(Date.now() + 3.5 * 3600e3).toISOString(),
    };

    this.eventSubject.next({
      id: `evt_create_${Date.now()}`,
      type: 'LISTING_CREATED',
      timestamp: new Date().toISOString(),
      payload: newListing,
      message: `New listing broadcasted: ${newListing.title}`,
    });

    return newListing;
  }

  /**
   * Simulate a listing being claimed by someone else in real-time (Deliverable 2)
   */
  public simulateListingClaimed(): string | null {
    const available = useAppStore
      .getState()
      .listings.filter((l) => l.status === 'available');

    if (available.length === 0) return null;

    const target = available[Math.floor(Math.random() * available.length)];

    this.eventSubject.next({
      id: `evt_claim_${Date.now()}`,
      type: 'LISTING_CLAIMED',
      timestamp: new Date().toISOString(),
      payload: { listingId: target.id, title: target.title },
      message: `Listing claimed: ${target.title}`,
    });

    return target.id;
  }

  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.statusSubject.value;
  }
}

export const realtimeSync = new RealtimeSyncService();
