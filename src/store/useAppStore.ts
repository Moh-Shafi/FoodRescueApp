// Global state — Zustand store (UDF / single source of truth).
// Only immutable updates through actions; components read via selectors.

import { create } from 'zustand';

import { haversineDistanceKm } from '../utils/geo';
import type { FoodListing, LatLng } from '../types';

interface AppState {
  userLocation: LatLng | null;
  listings: FoodListing[];
  selectedId: string | null;
  setUserLocation: (loc: LatLng | null) => void;
  setListings: (listings: FoodListing[]) => void;
  selectListing: (id: string | null) => void;
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

  setUserLocation: (loc) =>
    set({ userLocation: loc, listings: withDistances(get().listings, loc) }),

  setListings: (listings) =>
    set({ listings: withDistances(listings, get().userLocation) }),

  selectListing: (id) => set({ selectedId: id }),
}));
