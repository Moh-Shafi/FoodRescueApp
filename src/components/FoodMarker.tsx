// [MILESTONE 1] Custom marker view for surplus-food pins on the map.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FoodMarkerProps {
  label: string;
  selected?: boolean;
  claimed?: boolean;
}

export function FoodMarker({ label, selected, claimed }: FoodMarkerProps) {
  return (
    <View
      style={[
        styles.pin,
        claimed && styles.pinClaimed,
        selected && styles.pinSelected,
      ]}
    >
      <Text style={styles.pinText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2E7D32',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  pinSelected: {
    backgroundColor: '#1565C0',
    transform: [{ scale: 1.25 }],
  },
  pinClaimed: {
    backgroundColor: '#9E9E9E',
  },
  pinText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
