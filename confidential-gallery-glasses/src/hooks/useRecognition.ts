import { useState, useCallback } from 'react';
import { recognizeFromPhoto } from '../services/recognition';
import type { Artwork, RecognizeResponse } from '../types';

interface RecognitionState {
  loading: boolean;
  artwork: Artwork | null;
  confidence: number;
  method: string | null;
  error: string | null;
}

export function useRecognition() {
  const [state, setState] = useState<RecognitionState>({
    loading: false,
    artwork: null,
    confidence: 0,
    method: null,
    error: null,
  });

  const recognize = useCallback(async (photoUri: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result: RecognizeResponse = await recognizeFromPhoto(photoUri);

      setState({
        loading: false,
        artwork: result.artwork ?? null,
        confidence: result.confidence,
        method: result.method ?? null,
        error: result.success ? null : (result.error ?? 'Recognition failed'),
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Recognition failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      artwork: null,
      confidence: 0,
      method: null,
      error: null,
    });
  }, []);

  return { ...state, recognize, reset };
}
