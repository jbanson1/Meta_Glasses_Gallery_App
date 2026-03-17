import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAudio } from '../hooks/useAudio';
import type { Artwork } from '../types';

interface Props {
  artwork: Artwork;
  method: string;
  confidence: number;
  onBack: () => void;
}

export function ArtworkScreen({ artwork, method, confidence, onBack }: Props) {
  const { playing, loading: audioLoading, play, stop } = useAudio();

  // Auto-play quick audio when artwork is displayed
  useEffect(() => {
    play(artwork.id, 'quick');
  }, [artwork.id, play]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{artwork.title}</Text>
      <Text style={styles.artist}>
        {artwork.artist_name}
        {artwork.year ? ` · ${artwork.year}` : ''}
      </Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {method.toUpperCase()} · {Math.round(confidence * 100)}% match
        </Text>
      </View>

      <Text style={styles.compactDescription}>{artwork.compact_description}</Text>

      <View style={styles.divider} />

      <Text style={styles.description}>{artwork.description}</Text>

      {/* Audio Controls */}
      <View style={styles.audioControls}>
        <TouchableOpacity
          style={styles.audioButton}
          onPress={() => play(artwork.id, 'quick')}
          disabled={audioLoading}
        >
          <Text style={styles.audioButtonText}>
            {playing ? 'Playing...' : 'Quick Audio'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.audioButton}
          onPress={() => play(artwork.id, 'full')}
          disabled={audioLoading}
        >
          <Text style={styles.audioButtonText}>Full Description</Text>
        </TouchableOpacity>

        {playing && (
          <TouchableOpacity style={styles.stopButton} onPress={stop}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#888',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  artist: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  badgeText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
  },
  compactDescription: {
    fontSize: 18,
    color: '#ddd',
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 16,
  },
  description: {
    fontSize: 16,
    color: '#bbb',
    lineHeight: 24,
    marginBottom: 32,
  },
  audioControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  audioButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  audioButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  stopButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});
