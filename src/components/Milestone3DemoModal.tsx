// [MILESTONE 3 / Sub-CPMK 9] Presentation & Defense Interactive Controller
// Provides a live demo panel for showcasing:
// 1. RxJS Pipeline (debounceTime, distinctUntilChanged, switchMap)
// 2. Real-Time Data Pipeline (WebSocket / Live Event Broadcasts)
// 3. Graceful Offline Fallbacks & Sync Queue

import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { realtimeSync } from '../services/realtimeSync';
import { useAppStore } from '../store/useAppStore';

interface Milestone3DemoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function Milestone3DemoModal({ visible, onClose }: Milestone3DemoModalProps) {
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const listingsCount = useAppStore((s) => s.listings.length);
  const pendingActions = useAppStore((s) => s.pendingOfflineActions);
  const activeNotification = useAppStore((s) => s.activeNotification);

  const isConnected = connectionStatus === 'connected';

  const handleBroadcastNewListing = () => {
    realtimeSync.simulateIncomingListing();
  };

  const handleBroadcastClaimed = () => {
    realtimeSync.simulateListingClaimed();
  };

  const handleToggleConnection = () => {
    realtimeSync.toggleConnection();
  };

  const handleSyncQueue = async () => {
    await realtimeSync.syncOfflineQueue();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Milestone 3 Live Demo</Text>
              <Text style={styles.subtitle}>
                Real-Time Data Pipeline & Offline Fallbacks (Sub-CPMK 9)
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
            {/* Live Status Overview */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>System State</Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusPill,
                    isConnected ? styles.pillGreen : styles.pillOrange,
                  ]}
                >
                  <Text style={styles.pillText}>
                    {isConnected ? '🟢 Real-time: CONNECTED' : `🔴 Network: ${connectionStatus.toUpperCase()}`}
                  </Text>
                </View>
                <View style={styles.counterPill}>
                  <Text style={styles.counterText}>{listingsCount} Listings</Text>
                </View>
                <View style={styles.counterPill}>
                  <Text style={styles.counterText}>
                    {pendingActions.length} Queued Offline
                  </Text>
                </View>
              </View>

              {activeNotification && (
                <View style={styles.notifBox}>
                  <Text style={styles.notifText}>{activeNotification}</Text>
                </View>
              )}
            </View>

            {/* Deliverable 1 Explanation */}
            <View style={styles.card}>
              <Text style={styles.deliverableTag}>DELIVERABLE 1</Text>
              <Text style={styles.cardTitle}>RxJS Reactive Search & Filter Pipeline</Text>
              <Text style={styles.cardDesc}>
                Implemented in <Text style={styles.codeText}>src/services/searchPipeline.ts</Text> using:
              </Text>
              <View style={styles.operatorList}>
                <Text style={styles.operatorItem}>
                  • <Text style={styles.bold}>debounceTime(300)</Text>: Prevents wasteful execution while typing.
                </Text>
                <Text style={styles.operatorItem}>
                  • <Text style={styles.bold}>distinctUntilChanged()</Text>: Suppresses duplicate query emissions.
                </Text>
                <Text style={styles.operatorItem}>
                  • <Text style={styles.bold}>switchMap()</Text>: Cancels previous async search promises when a new query arrives.
                </Text>
              </View>
            </View>

            {/* Deliverable 2 Demo Actions */}
            <View style={styles.card}>
              <Text style={styles.deliverableTag}>DELIVERABLE 2</Text>
              <Text style={styles.cardTitle}>Real-Time Data Simulation</Text>
              <Text style={styles.cardDesc}>
                Broadcast live WebSocket / Supabase-style events to update map markers and listings instantaneously:
              </Text>

              <Pressable
                style={[styles.actionButton, styles.btnBlue]}
                onPress={handleBroadcastNewListing}
              >
                <Text style={styles.btnText}>📡 Broadcast New Surplus Food Listing</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.btnPurple]}
                onPress={handleBroadcastClaimed}
              >
                <Text style={styles.btnText}>🏷️ Broadcast Food Claimed (Status Update)</Text>
              </Pressable>
            </View>

            {/* Deliverable 3 Demo Actions */}
            <View style={styles.card}>
              <Text style={styles.deliverableTag}>DELIVERABLE 3</Text>
              <Text style={styles.cardTitle}>Graceful Offline Fallbacks & Sync</Text>
              <Text style={styles.cardDesc}>
                Simulate network outage. App seamlessly serves cached listings from AsyncStorage and queues offline reservations:
              </Text>

              <Pressable
                style={[
                  styles.actionButton,
                  isConnected ? styles.btnOrange : styles.btnGreen,
                ]}
                onPress={handleToggleConnection}
              >
                <Text style={styles.btnText}>
                  {isConnected ? '🔌 Simulate Network Disconnect (Offline Mode)' : '🟢 Reconnect to Real-Time Server'}
                </Text>
              </Pressable>

              {pendingActions.length > 0 && (
                <Pressable
                  style={[styles.actionButton, styles.btnTeal]}
                  onPress={handleSyncQueue}
                >
                  <Text style={styles.btnText}>
                    🔄 Flush & Sync Offline Queue ({pendingActions.length} items)
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Return to App</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F9FBE7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1B5E20',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#E8F5E9',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  body: {
    padding: 14,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pillGreen: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pillOrange: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  counterPill: {
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  counterText: {
    fontSize: 12,
    color: '#455A64',
    fontWeight: '600',
  },
  notifBox: {
    backgroundColor: '#E0F2F1',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  notifText: {
    fontSize: 12,
    color: '#004D40',
    fontWeight: '600',
  },
  deliverableTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  cardDesc: {
    fontSize: 12,
    color: '#616161',
    marginVertical: 6,
    lineHeight: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#1565C0',
    fontWeight: '600',
  },
  operatorList: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  operatorItem: {
    fontSize: 12,
    color: '#424242',
  },
  bold: {
    fontWeight: '700',
    color: '#1B5E20',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 4,
  },
  btnBlue: {
    backgroundColor: '#1976D2',
  },
  btnPurple: {
    backgroundColor: '#7B1FA2',
  },
  btnOrange: {
    backgroundColor: '#E65100',
  },
  btnGreen: {
    backgroundColor: '#2E7D32',
  },
  btnTeal: {
    backgroundColor: '#00695C',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  doneBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
