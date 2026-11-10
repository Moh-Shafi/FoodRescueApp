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
