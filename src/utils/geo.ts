// [MILESTONE 1 / Sub-CPMK 7] Spatial computation utilities.
// Haversine formula + adaptive distance interval for location tracking.

import type { LatLng } from '../types';

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two coordinates, in kilometres. */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistanceKm(km: number | undefined): string {
  if (km == null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Adaptive `distanceInterval` (metres) for Location.watchPositionAsync.
 * Faster movement -> larger interval to save battery; slower -> finer updates.
 */
export function distanceIntervalForSpeed(speedMps: number | null | undefined): number {
  if (speedMps == null || !Number.isFinite(speedMps)) return 10; // unknown -> balanced
  if (speedMps >= 8) return 100; // vehicle
  if (speedMps >= 2) return 25; // cycling / running
  return 5; // walking / stationary
}
