// Listing detail — shows Haversine distance, donor info, and a reserve action
// that writes a confirmation record into scoped storage (expo-file-system).

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { saveReportJson } from '../../services/fileStorage';
import { formatDistanceKm } from '../../utils/geo';
import { useAppStore } from '../../store/useAppStore';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = useAppStore((s) => s.listings.find((l) => l.id === id));

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Listing not found.</Text>
      </View>
    );
  }

  const reserve = async () => {
    const uri = await saveReportJson(`rescue-${listing.id}.json`, {
      listingId: listing.id,
      title: listing.title,
      donor: listing.donorName,
      reservedAt: new Date().toISOString(),
    });
    // TODO: replace with real backend call + expo-secure-store auth token.
    console.log('Reservation record saved to scoped storage:', uri);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.distance}>
        {formatDistanceKm(listing.distanceKm)} away
      </Text>

      <View style={styles.card}>
        <Row label="Donor" value={`${listing.donorName} (${listing.donorType})`} />
        <Row label="Address" value={listing.address} />
        <Row label="Servings" value={String(listing.servings)} />
        <Row label="Category" value={listing.category} />
        <Row
          label="Available until"
          value={new Date(listing.availableUntil).toLocaleString()}
        />
        <Row label="Status" value={listing.status} />
      </View>

      <Pressable
        style={[styles.button, listing.status !== 'available' && styles.buttonDisabled]}
        onPress={reserve}
        disabled={listing.status !== 'available'}
      >
        <Text style={styles.buttonText}>
          {listing.status === 'available' ? 'Reserve pickup' : 'No longer available'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { color: '#757575' },
  title: { fontSize: 20, fontWeight: '800', color: '#212121' },
  distance: { fontSize: 14, color: '#2E7D32', fontWeight: '600', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  rowLabel: { color: '#757575', fontSize: 13 },
  rowValue: { color: '#212121', fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  button: {
    marginTop: 20,
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#BDBDBD' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
