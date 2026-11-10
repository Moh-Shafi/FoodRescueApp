// [MILESTONE 1 / Sub-CPMK 7] Interactive map + LBS screen.
// Deliverables covered here:
//  - react-native-maps + expo-location integration
//  - useLocationTracking custom hook (adaptive distanceInterval)
//  - custom markers + Haversine distance to every listing
//  - nearest-first sorting + permission flow (Just-In-Time)

import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_LISTINGS } from '../data/listings';
import { FoodMarker } from '../components/FoodMarker';
import { ListingCard } from '../components/ListingCard';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { useAppStore } from '../store/useAppStore';
import { formatDistanceKm } from '../utils/geo';
import type { LatLng } from '../types';

const JAKARTA: LatLng = { latitude: -6.2088, longitude: 106.8456 };

export default function MapScreen() {
  const { location, status, error, start } = useLocationTracking();

  // Zustand selectors — components only re-render when their slice changes.
  const userLocation = useAppStore((s) => s.userLocation);
  const listings = useAppStore((s) => s.listings);
  const selectedId = useAppStore((s) => s.selectedId);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const setListings = useAppStore((s) => s.setListings);
  const selectListing = useAppStore((s) => s.selectListing);

  // Load mock inventory once, then keep distances fresh as GPS updates.
  useEffect(() => {
    setListings(MOCK_LISTINGS);
  }, [setListings]);

  useEffect(() => {
    if (location) {
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  }, [location, setUserLocation]);

  const nearest = useMemo(
    () =>
      [...listings]
        .filter((l) => l.status === 'available')
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
        .slice(0, 5),
    [listings],
  );

  const region = useMemo(() => {
    const c = userLocation ?? JAKARTA;
    return {
      latitude: c.latitude,
      longitude: c.longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }, [userLocation]);

  const tracking = status === 'tracking';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />

      {Platform.OS !== 'web' ? (
        <MapView style={styles.map} initialRegion={region} region={region}>
          {/* User position marker */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="You"
              pinColor="#1565C0"
            />
          )}
          {/* Custom surplus-food markers */}
          {listings.map((l) => (
            <Marker
              key={l.id}
              coordinate={l.location}
              title={l.title}
              description={`${formatDistanceKm(l.distanceKm)} away`}
              onPress={() => selectListing(l.id)}
            >
              <FoodMarker
                label={l.title[0]}
                selected={selectedId === l.id}
                claimed={l.status === 'claimed'}
              />
            </Marker>
          ))}
        </MapView>
      ) : (
        <View style={styles.webFallback}>
          <Text style={styles.webText}>Map needs a physical device (react-native-maps).</Text>
        </View>
      )}

      {/* Permission / status bar — Just-In-Time permission request */}
      <View style={styles.statusBar}>
        {status === 'requesting' && <ActivityIndicator color="#fff" />}
        <Text style={styles.statusText}>
          {tracking
            ? `Tracking · accuracy updates adaptive`
            : status === 'denied'
              ? 'Location permission denied'
              : status === 'services-off'
                ? 'Turn on device location services'
                : error ?? 'Location not started'}
        </Text>
        {!tracking && (
          <Pressable style={styles.trackButton} onPress={start}>
            <Text style={styles.trackButtonText}>Enable Tracking</Text>
          </Pressable>
        )}
      </View>

      {/* Nearest listings */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Nearest surplus</Text>
        <Pressable onPress={() => router.push('/search')}>
          <Text style={styles.searchLink}>Search all</Text>
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={nearest}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ListingCard listing={item} selected={selectedId === item.id} />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  map: { flex: 1 },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webText: { textAlign: 'center', color: '#616161' },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1B5E20',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: { color: '#fff', fontSize: 12, flex: 1 },
  trackButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  trackButtonText: { color: '#1B5E20', fontWeight: '700', fontSize: 12 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  listTitle: { fontSize: 15, fontWeight: '700', color: '#212121' },
  searchLink: { color: '#1565C0', fontWeight: '600', fontSize: 13 },
  listContent: { paddingVertical: 8 },
  cardWrap: { width: 260 },
});
