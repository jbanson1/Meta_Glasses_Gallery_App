import { Audio } from 'expo-av';
import { getArtworkAudio } from './api';

let currentSound: Audio.Sound | null = null;

/**
 * Play audio description for an artwork.
 * Handles loading, playback, and cleanup.
 */
export async function playArtworkAudio(
  artworkId: string,
  type: 'quick' | 'full' | 'artist_story' = 'quick'
): Promise<void> {
  // Stop any currently playing audio
  await stopAudio();

  const audioResponse = await getArtworkAudio(artworkId, type);
  if (!audioResponse.success || !audioResponse.audio_url) {
    throw new Error(audioResponse.error || 'No audio available');
  }

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri: audioResponse.audio_url },
    { shouldPlay: true }
  );

  currentSound = sound;

  // Auto-cleanup when playback finishes
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
      currentSound = null;
    }
  });
}

export async function stopAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
}

export function isPlaying(): boolean {
  return currentSound !== null;
}
