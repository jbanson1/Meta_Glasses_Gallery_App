import { getServiceClient } from '@/lib/supabase';
import type { ArtworkAudio, AudioResponse } from '@/types';

/**
 * Get audio for an artwork. Priority:
 * 1. Pre-recorded audio file from artwork_audio table
 * 2. Direct audio_url from artworks table
 * 3. Text-to-speech fallback via ElevenLabs
 */
export async function getArtworkAudio(
  artworkId: string,
  type: 'quick' | 'full' | 'artist_story' = 'quick',
  language: string = 'en'
): Promise<AudioResponse> {
  const supabase = getServiceClient();

  // Check artwork_audio table for pre-recorded audio
  const { data: audio } = await supabase
    .from('artwork_audio')
    .select('*')
    .eq('artwork_id', artworkId)
    .eq('audio_type', type)
    .eq('language', language)
    .single();

  if (audio) {
    return {
      success: true,
      audio_url: audio.audio_url,
      duration_seconds: audio.duration_seconds ?? undefined,
    };
  }

  // Fall back to artwork's direct audio_url
  const { data: artwork } = await supabase
    .from('artworks')
    .select('audio_url, compact_description, description')
    .eq('id', artworkId)
    .single();

  if (artwork?.audio_url) {
    return { success: true, audio_url: artwork.audio_url };
  }

  // Generate TTS as last resort
  if (artwork) {
    const text =
      type === 'quick'
        ? artwork.compact_description
        : artwork.description;

    if (text) {
      const ttsResult = await generateTTS(text);
      if (ttsResult) {
        return { success: true, audio_url: ttsResult.url, duration_seconds: ttsResult.duration };
      }
    }
  }

  return { success: false, error: 'No audio available for this artwork.' };
}

/**
 * Generate text-to-speech audio using ElevenLabs API.
 * Returns a data URL with the audio content.
 */
async function generateTTS(
  text: string
): Promise<{ url: string; duration: number } | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Default: Adam

  if (!apiKey) {
    console.warn('ELEVENLABS_API_KEY not set, TTS unavailable');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('ElevenLabs TTS failed:', response.status);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    // Estimate duration: ~1 second per 16KB of MP3 at 128kbps
    const estimatedDuration = Math.ceil(audioBuffer.byteLength / 16000);

    return { url: dataUrl, duration: estimatedDuration };
  } catch (error) {
    console.error('TTS generation failed:', error);
    return null;
  }
}
