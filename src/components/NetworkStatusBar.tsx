// [MILESTONE 3 / Sub-CPMK 9] Real-Time & Offline Status Bar
// Visual indicator of connection status (Connected, Reconnecting, Offline)
// and quick access to the Milestone 3 demo controls.

import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppStore } from '../store/useAppStore';
import { Milestone3DemoModal } from './Milestone3DemoModal';

export function NetworkStatusBar() {
  const [modalVisible, setModalVisible] = useState(false);

  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const pendingActions = useAppStore((s) => s.pendingOfflineActions);
  const activeNotification = useAppStore((s) => s.activeNotification);
  const setActiveNotification = useAppStore((s) => s.setActiveNotification);

  // Auto-clear notification after 4 seconds
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeNotification, setActiveNotification]);

  const isConnected = connectionStatus === 'connected';
  const isReconnecting = connectionStatus === 'reconnecting';

  const statusLabel = isConnected
    ? '🟢 Real-time Connected'
    : isReconnecting
      ? '🟡 Reconnecting...'
      : '🔴 Offline Mode (Cached Data)';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bar,
          isConnected
            ? styles.barConnected
            : isReconnecting
              ? styles.barReconnecting
              : styles.barOffline,
        ]}
      >
        <Pressable
          style={styles.statusSection}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.statusText}>{statusLabel}</Text>
          {pendingActions.length > 0 && (
            <View style={styles.queuePill}>
              <Text style={styles.queueText}>
                {pendingActions.length} queued
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={styles.demoButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.demoButtonText}>⚡ Demo M3</Text>
        </Pressable>
      </View>

      {/* Real-time alert banner */}
      {activeNotification && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>{activeNotification}</Text>
          <Pressable onPress={() => setActiveNotification(null)}>
            <Text style={styles.alertDismiss}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Presentation Demo Modal */}
      <Milestone3DemoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  barConnected: {
    backgroundColor: '#1B5E20',
  },
  barReconnecting: {
    backgroundColor: '#F57F17',
  },
  barOffline: {
    backgroundColor: '#C62828',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  queuePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  queueText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  demoButtonText: {
    color: '#1B5E20',
    fontSize: 11,
    fontWeight: '800',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  alertText: {
    color: '#1B5E20',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  alertDismiss: {
    color: '#558B2F',
    fontSize: 14,
    fontWeight: '700',
    paddingLeft: 8,
  },
});
