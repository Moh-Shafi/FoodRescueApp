import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ListingCard } from '../components/ListingCard';
import { NetworkStatusBar } from '../components/NetworkStatusBar';
import { MOCK_LISTINGS } from '../data/listings';
import { realtimeSync } from '../services/realtimeSync';
import { useAppStore } from '../store/useAppStore';

export default function WebHomeScreen() {
  const listings = useAppStore((state) => state.listings);

  useEffect(() => {
    realtimeSync.initialize(MOCK_LISTINGS);
  }, []);

  const availableListings = listings.filter((listing) => listing.status === 'available');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <NetworkStatusBar />

      <View style={styles.intro}>
        <Text style={styles.eyebrow}>FOOD RESCUE</Text>
        <Text style={styles.title}>Good food, shared nearby.</Text>
        <Text style={styles.description}>
          Find surplus food from local restaurants, cafes, and grocers.
        </Text>
      </View>

      <View style={styles.mapFallback}>
        <Text style={styles.mapTitle}>Map preview is available in the mobile app</Text>
        <Text style={styles.mapDescription}>
          Browse available food below, or enable location tracking on your device.
        </Text>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Available listings</Text>
        <Pressable onPress={() => router.push('/search')} accessibilityRole="link">
          <Text style={styles.searchLink}>Search all</Text>
        </Pressable>
      </View>

      {availableListings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 32, width: '100%', maxWidth: 760, alignSelf: 'center' },
  intro: { paddingHorizontal: 8, paddingVertical: 16 },
  eyebrow: { color: '#2E7D32', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#212121', fontSize: 28, fontWeight: '800', marginTop: 6 },
  description: { color: '#616161', fontSize: 15, marginTop: 6 },
  mapFallback: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  mapTitle: { color: '#1B5E20', fontSize: 15, fontWeight: '700' },
  mapDescription: { color: '#4E6350', fontSize: 13, marginTop: 4 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  sectionTitle: { color: '#212121', fontSize: 17, fontWeight: '700' },
  searchLink: { color: '#1565C0', fontSize: 14, fontWeight: '600' },
});
