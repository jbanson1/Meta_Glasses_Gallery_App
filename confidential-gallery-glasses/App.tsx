import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { ArtworkScreen } from './src/screens/ArtworkScreen';
import { HistoryScreen, addToHistory } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { Artwork } from './src/types';

type Screen = 'home' | 'scan' | 'artwork' | 'history' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentArtwork, setCurrentArtwork] = useState<Artwork | null>(null);
  const [recognitionMethod, setRecognitionMethod] = useState('');
  const [recognitionConfidence, setRecognitionConfidence] = useState(0);

  const handleArtworkFound = async (artwork: Artwork, method: string, confidence: number) => {
    setCurrentArtwork(artwork);
    setRecognitionMethod(method);
    setRecognitionConfidence(confidence);
    setScreen('artwork');
    await addToHistory(artwork, method, confidence);
  };

  return (
    <>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen
          onNavigateToScan={() => setScreen('scan')}
          onNavigateToHistory={() => setScreen('history')}
          onNavigateToSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'scan' && (
        <ScanScreen
          onArtworkFound={handleArtworkFound}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'artwork' && currentArtwork && (
        <ArtworkScreen
          artwork={currentArtwork}
          method={recognitionMethod}
          confidence={recognitionConfidence}
          onBack={() => setScreen('scan')}
        />
      )}
      {screen === 'history' && (
        <HistoryScreen
          onSelectArtwork={(artwork) => {
            setCurrentArtwork(artwork);
            setRecognitionMethod('history');
            setRecognitionConfidence(1);
            setScreen('artwork');
          }}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen onBack={() => setScreen('home')} />
      )}
    </>
  );
}
