// Global state — Zustand store (UDF / single source of truth).
// Only immutable updates through actions; components read via selectors.

import { create } from 'zustand';

import { haversineDistanceKm } from '../utils/geo';
import type {
  ConnectionStatus,
  FoodListing,
  LatLng,
  ListingStatus,
  OfflineAction,
} from '../types';

interface AppState {
  userLocation: LatLng | null;
  listings: FoodListing[];
  selectedId: string | null;
  connectionStatus: ConnectionStatus;
  pendingOfflineActions: OfflineAction[];
  lastSyncTime: string | null;
  activeNotification: string | null;

  setUserLocation: (loc: LatLng | null) => void;
  setListings: (listings: FoodListing[]) => void;
  selectListing: (id: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  addListing: (listing: FoodListing) => void;
  updateListingStatus: (id: string, status: ListingStatus) => void;
  setPendingOfflineActions: (actions: OfflineAction[]) => void;
  addOfflineAction: (action: OfflineAction) => void;
  removeOfflineAction: (id: string) => void;
  setActiveNotification: (notif: string | null) => void;
}

function withDistances(listings: FoodListing[], user: LatLng | null): FoodListing[] {
  if (!user) return listings.map((l) => ({ ...l, distanceKm: undefined }));
  return listings.map((l) => ({
    ...l,
    distanceKm: haversineDistanceKm(user, l.location),
  }));
}

export const useAppStore = create<AppState>((set, get) => ({
  userLocation: null,
  listings: [],
  selectedId: null,
  connectionStatus: 'connected',
  pendingOfflineActions: [],
  lastSyncTime: null,
  activeNotification: null,

  setUserLocation: (loc) =>
    set({ userLocation: loc, listings: withDistances(get().listings, loc) }),

  setListings: (listings) =>
    set({
      listings: withDistances(listings, get().userLocation),
      lastSyncTime: new Date().toISOString(),
    }),

  selectListing: (id) => set({ selectedId: id }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  addListing: (listing) => {
    const user = get().userLocation;
    const distanceKm = user ? haversineDistanceKm(user, listing.location) : undefined;
    const itemWithDist: FoodListing = { ...listing, distanceKm };
    set({
      listings: [itemWithDist, ...get().listings.filter((l) => l.id !== listing.id)],
      lastSyncTime: new Date().toISOString(),
    });
  },

  updateListingStatus: (id, status) => {
    set({
      listings: get().listings.map((l) => (l.id === id ? { ...l, status } : l)),
    });
  },

  setPendingOfflineActions: (actions) => set({ pendingOfflineActions: actions }),

  addOfflineAction: (action) =>
    set({ pendingOfflineActions: [...get().pendingOfflineActions, action] }),

  removeOfflineAction: (id) =>
    set({
      pendingOfflineActions: get().pendingOfflineActions.filter((a) => a.id !== id),
    }),

  setActiveNotification: (notif) => set({ activeNotification: notif }),
}));
