// Listing detail — shows Haversine distance, donor info, and a reserve action
// that supports both real-time reservation and Graceful Offline Queue fallback.

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { NetworkStatusBar } from '../../components/NetworkStatusBar';
import { saveReportJson } from '../../services/fileStorage';
import { cacheListings, enqueueOfflineAction } from '../../services/offlineCache';
import { useAppStore } from '../../store/useAppStore';
import { formatDistanceKm } from '../../utils/geo';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const listing = useAppStore((s) => s.listings.find((l) => l.id === id));
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const updateListingStatus = useAppStore((s) => s.updateListingStatus);
  const addOfflineAction = useAppStore((s) => s.addOfflineAction);
  const setActiveNotification = useAppStore((s) => s.setActiveNotification);

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Listing not found.</Text>
      </View>
    );
  }

  const isConnected = connectionStatus === 'connected';

  const reserve = async () => {
    setIsSubmitting(true);
    try {
      const reservationData = {
        listingId: listing.id,
        title: listing.title,
        donor: listing.donorName,
        reservedAt: new Date().toISOString(),
        isOfflineMode: !isConnected,
      };

      // 1. Scoped local document storage (Deliverable M2)
      await saveReportJson(`rescue-${listing.id}.json`, reservationData);

      // 2. Optimistic UI update in global state
      updateListingStatus(listing.id, 'claimed');

      if (isConnected) {
        // Online reservation
        setActiveNotification(`✅ Reserved "${listing.title}" successfully`);
        Alert.alert(
          'Reservation Confirmed',
          `You have successfully reserved "${listing.title}". Please proceed to ${listing.address} for pickup.`,
          [{ text: 'OK' }],
        );
      } else {
        // 3. Graceful Offline Fallback: Queue action into AsyncStorage (Deliverable M3)
        const queuedAction = await enqueueOfflineAction({
          type: 'RESERVE_LISTING',
          listingId: listing.id,
          data: reservationData,
        });

        addOfflineAction(queuedAction);
        setActiveNotification(
          `💾 Offline Reservation Queued for "${listing.title}" (will sync online)`,
        );

        Alert.alert(
          'Saved to Offline Queue',
          'You are currently in Offline Mode. Your reservation has been recorded in local storage and will automatically synchronize when connection is restored.',
          [{ text: 'OK' }],
        );
      }

      // Persist latest state into cache
      await cacheListings(useAppStore.getState().listings);
    } catch (err) {
      console.warn('Reservation error:', err);
      Alert.alert('Error', 'Failed to process reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <NetworkStatusBar />

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
          <Row label="Status" value={listing.status.toUpperCase()} />
        </View>

        {!isConnected && listing.status === 'available' && (
          <View style={styles.offlineWarningBox}>
            <Text style={styles.offlineWarningText}>
              ⚡ Offline Mode active: Reserving now will store your pickup request in the local offline queue and sync automatically upon reconnection.
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.button,
            (listing.status !== 'available' || isSubmitting) && styles.buttonDisabled,
          ]}
          onPress={reserve}
          disabled={listing.status !== 'available' || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {listing.status === 'available'
              ? isConnected
                ? 'Reserve pickup'
                : 'Reserve pickup (Offline Queue)'
              : 'No longer available'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
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
  wrapper: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
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
  offlineWarningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
    padding: 10,
    marginTop: 14,
  },
  offlineWarningText: {
    fontSize: 12,
    color: '#E65100',
    lineHeight: 16,
    fontWeight: '500',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#BDBDBD' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
