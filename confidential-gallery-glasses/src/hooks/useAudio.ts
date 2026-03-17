import { useState, useCallback } from 'react';
import { playArtworkAudio, stopAudio } from '../services/audio';

interface AudioState {
  playing: boolean;
  loading: boolean;
  error: string | null;
}

export function useAudio() {
  const [state, setState] = useState<AudioState>({
    playing: false,
    loading: false,
    error: null,
  });

  const play = useCallback(
    async (artworkId: string, type: 'quick' | 'full' | 'artist_story' = 'quick') => {
      setState({ playing: false, loading: true, error: null });

      try {
        await playArtworkAudio(artworkId, type);
        setState({ playing: true, loading: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Audio playback failed';
        setState({ playing: false, loading: false, error: message });
      }
    },
    []
  );

  const stop = useCallback(async () => {
    await stopAudio();
    setState({ playing: false, loading: false, error: null });
  }, []);

  return { ...state, play, stop };
}
