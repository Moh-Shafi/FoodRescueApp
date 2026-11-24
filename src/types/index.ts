// Shared domain types for the Zero-Waste Food Redistribution app (SDG 12).

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type ListingStatus = 'available' | 'claimed' | 'expired';

export interface FoodListing {
  id: string;
  title: string;
  donorName: string;
  donorType: 'restaurant' | 'hotel' | 'grocery' | 'cafe';
  category: string;
  servings: number;
  location: LatLng;
  address: string;
  availableUntil: string; // ISO timestamp
  status: ListingStatus;
  /** Filled at runtime — straight-line distance from the user (Haversine). */
  distanceKm?: number;
}

export interface RescueStats {
  listingsRescued: number;
  mealsSaved: number;
  co2eKgSaved: number;
}

// ==========================================
// Milestone 3: Real-Time & Reactive Pipeline
// ==========================================

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'offline';

export type RealtimeEventType =
  | 'LISTING_CREATED'
  | 'LISTING_CLAIMED'
  | 'LISTING_UPDATED'
  | 'OFFLINE_SYNC'
  | 'HEARTBEAT';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  timestamp: string;
  payload?: any;
  message: string;
}

export interface OfflineAction {
  id: string;
  type: 'RESERVE_LISTING';
  listingId: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface SearchFilterCriteria {
  query: string;
  category: string; // 'All' | 'Cooked meals' | 'Bakery' | 'Buffet' | 'Produce'
  status: 'all' | 'available' | 'claimed';
  sortBy: 'distance' | 'servings' | 'expiry';
}

