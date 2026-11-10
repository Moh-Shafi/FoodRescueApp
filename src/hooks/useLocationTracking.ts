// [MILESTONE 1 / Sub-CPMK 7] Custom Hook — live location tracking.
// Wraps expo-location watchPositionAsync with an *adaptive* distanceInterval:
// the sampling distance is recomputed from the reported ground speed and the
// subscription is re-created when the movement regime changes.
// Cleanup on unmount keeps the subscription leak-free (zero memory leak).

import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { distanceIntervalForSpeed } from '../utils/geo';

export type TrackingStatus =
  | 'idle'
  | 'requesting'
  | 'tracking'
  | 'denied'
  | 'services-off'
  | 'error';

export interface UseLocationTracking {
  location: Location.LocationObject | null;
  status: TrackingStatus;
  error: string | null;
  start: () => Promise<boolean>;
  stop: () => void;
}

export function useLocationTracking(): UseLocationTracking {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const subscription = useRef<Location.LocationSubscription | null>(null);
  const activeInterval = useRef<number>(10);
  const wantTracking = useRef(false);
  const subscribeRef = useRef<(interval: number) => Promise<void>>(async () => {});

  const subscribe = useCallback(async (distanceInterval: number) => {
    subscription.current?.remove();
    activeInterval.current = distanceInterval;

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 1000,
        distanceInterval,
      },
      (loc) => {
        setLocation(loc);

        // Adaptive interval: re-subscribe only when the speed regime changes.
        const next = distanceIntervalForSpeed(loc.coords.speed);
        if (next !== activeInterval.current && wantTracking.current) {
          void subscribeRef.current(next);
        }
      },
    );

    // Guard against stop() racing a pending watchPositionAsync.
    if (!wantTracking.current) {
      sub.remove();
      return;
    }
    subscription.current = sub;
  }, []);

  useEffect(() => {
    subscribeRef.current = subscribe;
  }, [subscribe]);

  const start = useCallback(async (): Promise<boolean> => {
    setStatus('requesting');
    setError(null);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return false;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setStatus('services-off');
        return false;
      }
      wantTracking.current = true;
      void subscribe(10);
      setStatus('tracking');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Location error');
      setStatus('error');
      return false;
    }
  }, [subscribe]);

  const stop = useCallback(() => {
    wantTracking.current = false;
    subscription.current?.remove();
    subscription.current = null;
    setStatus('idle');
  }, []);

  // Zero memory leak: always release the watcher on unmount.
  useEffect(() => stop, [stop]);

  return { location, status, error, start, stop };
}
