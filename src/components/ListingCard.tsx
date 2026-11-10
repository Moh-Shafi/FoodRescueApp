// [PERF / 16ms mandate] Memoized listing card — re-renders only when props change.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { formatDistanceKm } from '../utils/geo';
import type { FoodListing } from '../types';

interface ListingCardProps {
  listing: FoodListing;
  selected?: boolean;
}

function ListingCardInner({ listing, selected }: ListingCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.id}`)}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.distance}>{formatDistanceKm(listing.distanceKm)}</Text>
      </View>
      <Text style={styles.meta}>
        {listing.donorName} · {listing.servings} servings · {listing.category}
      </Text>
      <Text style={styles.meta}>
        {listing.status === 'claimed' ? 'Claimed' : `Until ${new Date(listing.availableUntil).toLocaleTimeString()}`}
      </Text>
    </Pressable>
  );
}

export const ListingCard = React.memo(ListingCardInner);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#E3F2FD',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  distance: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    marginLeft: 8,
  },
  meta: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
});
