import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryItem, Artwork } from '../types';

const HISTORY_KEY = 'artwork_history';

interface Props {
  onSelectArtwork: (artwork: Artwork) => void;
  onBack: () => void;
}

export function HistoryScreen({ onSelectArtwork, onBack }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    if (data) {
      setHistory(JSON.parse(data));
    }
  }

  async function clearHistory() {
    await AsyncStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No artworks scanned yet.</Text>
          <Text style={styles.emptySubtext}>Scan an artwork to see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => `${item.artwork.id}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => onSelectArtwork(item.artwork)}
            >
              <Text style={styles.itemTitle}>{item.artwork.title}</Text>
              <Text style={styles.itemArtist}>{item.artwork.artist_name}</Text>
              <Text style={styles.itemMeta}>
                {new Date(item.scannedAt).toLocaleDateString()} · {item.method}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

/** Save a recognized artwork to local history. */
export async function addToHistory(
  artwork: Artwork,
  method: string,
  confidence: number
): Promise<void> {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  const history: HistoryItem[] = data ? JSON.parse(data) : [];

  history.unshift({
    artwork,
    scannedAt: new Date().toISOString(),
    method,
    confidence,
  });

  // Keep only last 100 entries
  const trimmed = history.slice(0, 100);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  backText: {
    color: '#888',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearText: {
    color: '#f44336',
    fontSize: 14,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 8,
  },
  item: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  itemTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  itemArtist: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  itemMeta: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
  },
});
