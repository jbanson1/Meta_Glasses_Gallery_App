import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props) {
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [audioType, setAudioType] = useState<'quick' | 'full'>('quick');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Audio Settings */}
      <Text style={styles.sectionTitle}>Audio</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Auto-play audio on recognition</Text>
        <Switch
          value={autoPlayAudio}
          onValueChange={setAutoPlayAudio}
          trackColor={{ true: '#4caf50', false: '#333' }}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Default audio type</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleOption, audioType === 'quick' && styles.toggleActive]}
            onPress={() => setAudioType('quick')}
          >
            <Text style={[styles.toggleText, audioType === 'quick' && styles.toggleTextActive]}>
              Quick
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, audioType === 'full' && styles.toggleActive]}
            onPress={() => setAudioType('full')}
          >
            <Text style={[styles.toggleText, audioType === 'full' && styles.toggleTextActive]}>
              Full
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Version</Text>
        <Text style={styles.value}>1.0.0</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Website</Text>
        <Text style={styles.value}>theconfidential.gallery</Text>
      </View>
    </View>
  );
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
    marginBottom: 32,
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
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  value: {
    color: '#666',
    fontSize: 16,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 8,
  },
  toggleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#333',
  },
  toggleText: {
    color: '#666',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#fff',
  },
});
