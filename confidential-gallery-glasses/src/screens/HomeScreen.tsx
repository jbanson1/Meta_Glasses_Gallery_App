import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGlassesConnection } from '../hooks/useGlassesConnection';

interface Props {
  onNavigateToScan: () => void;
  onNavigateToHistory: () => void;
  onNavigateToSettings: () => void;
}

export function HomeScreen({ onNavigateToScan, onNavigateToHistory, onNavigateToSettings }: Props) {
  const { status, deviceName, connect, disconnect } = useGlassesConnection();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confidential Gallery</Text>
      <Text style={styles.subtitle}>AR Art Guide</Text>

      {/* Glasses Connection Status */}
      <View style={styles.connectionCard}>
        <Text style={styles.connectionLabel}>Meta Glasses</Text>
        <Text style={[styles.connectionStatus, styles[status]]}>
          {status === 'connected' ? deviceName : status}
        </Text>
        <TouchableOpacity
          style={styles.connectionButton}
          onPress={status === 'connected' ? disconnect : connect}
        >
          <Text style={styles.connectionButtonText}>
            {status === 'connected' ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Actions */}
      <TouchableOpacity style={styles.scanButton} onPress={onNavigateToScan}>
        <Text style={styles.scanButtonText}>Scan Artwork</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onNavigateToHistory}>
        <Text style={styles.secondaryButtonText}>View History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onNavigateToSettings}>
        <Text style={styles.secondaryButtonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  connectionCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  connectionLabel: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  connectionStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
  },
  disconnected: { color: '#666' },
  connecting: { color: '#f0ad4e' },
  connected: { color: '#4caf50' },
  error: { color: '#f44336' },
  connectionButton: {
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  scanButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
