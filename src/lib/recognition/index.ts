import { getServiceClient } from '@/lib/supabase';
import { detectQRCode } from './qr-detection';
import { generateImageHash, findBestHashMatch } from './image-hash';
import { identifyWithAIVision, matchAIResultToArtwork } from './ai-vision';
import type { Artwork, RecognizeResponse } from '@/types';

interface RecognitionOptions {
  imageBuffer: Buffer;
  imageBase64: string;
  deviceType?: 'meta_glasses' | 'phone';
  sessionId?: string;
}

/**
 * Main recognition pipeline. Tries methods in order of speed/reliability:
 * 1. QR code detection (fastest, most reliable)
 * 2. Perceptual image hash matching
 * 3. AI Vision fallback (slowest, least reliable)
 */
export async function recognizeArtwork(
  options: RecognitionOptions
): Promise<RecognizeResponse> {
  const { imageBuffer, imageBase64, deviceType, sessionId } = options;
  const supabase = getServiceClient();

  // --- Step 1: QR Code Detection ---
  try {
    const qrResult = await detectQRCode(imageBuffer);
    if (qrResult.found && qrResult.markerCode) {
      const { data: marker } = await supabase
        .from('markers')
        .select('artwork_id')
        .eq('code', qrResult.markerCode)
        .single();

      if (marker) {
        const artwork = await fetchArtwork(marker.artwork_id);
        if (artwork) {
          await logRecognitionEvent(marker.artwork_id, 'qr', 1.0, deviceType, sessionId);
          return buildResponse(artwork, 1.0, 'qr');
        }
      }
    }
  } catch (error) {
    console.error('QR detection error:', error);
  }

  // --- Step 2: Image Hash Matching ---
  try {
    const queryHash = await generateImageHash(imageBuffer);

    const { data: artworks } = await supabase
      .from('artworks')
      .select('id, image_hash')
      .eq('recognition_enabled', true)
      .not('image_hash', 'is', null);

    if (artworks && artworks.length > 0) {
      const threshold = parseInt(process.env.IMAGE_HASH_THRESHOLD || '10', 10);
      const match = findBestHashMatch(queryHash, artworks, threshold);

      if (match) {
        const artwork = await fetchArtwork(match.id);
        if (artwork) {
          await logRecognitionEvent(match.id, 'image_hash', match.confidence, deviceType, sessionId);
          return buildResponse(artwork, match.confidence, 'image_hash');
        }
      }
    }
  } catch (error) {
    console.error('Image hash matching error:', error);
  }

  // --- Step 3: AI Vision Fallback ---
  const aiConfidenceThreshold = parseFloat(
    process.env.AI_VISION_CONFIDENCE_THRESHOLD || '0.7'
  );

  try {
    const aiResult = await identifyWithAIVision(imageBase64);

    if (aiResult.found && aiResult.confidence >= aiConfidenceThreshold) {
      const { data: allArtworks } = await supabase
        .from('artworks')
        .select('id, title, artist_name')
        .eq('recognition_enabled', true);

      if (allArtworks) {
        const match = matchAIResultToArtwork(aiResult, allArtworks);
        if (match && match.confidence >= aiConfidenceThreshold) {
          const artwork = await fetchArtwork(match.id);
          if (artwork) {
            await logRecognitionEvent(match.id, 'ai_vision', match.confidence, deviceType, sessionId);
            return buildResponse(artwork, match.confidence, 'ai_vision');
          }
        }
      }
    }
  } catch (error) {
    console.error('AI Vision error:', error);
  }

  // No match found
  return {
    success: false,
    confidence: 0,
    error: 'No artwork recognized. Try getting closer or ensuring the artwork is well-lit.',
  };
}

async function fetchArtwork(artworkId: string): Promise<Artwork | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('artworks')
    .select('*')
    .eq('id', artworkId)
    .single();
  return data;
}

function buildResponse(
  artwork: Artwork,
  confidence: number,
  method: 'qr' | 'image_hash' | 'ai_vision'
): RecognizeResponse {
  return {
    success: true,
    artwork: {
      id: artwork.id,
      title: artwork.title,
      artist_name: artwork.artist_name,
      year: artwork.year,
      description: artwork.description,
      compact_description: artwork.compact_description,
      audio_url: artwork.audio_url,
    },
    confidence,
    method,
  };
}

async function logRecognitionEvent(
  artworkId: string,
  method: string,
  confidence: number,
  deviceType?: string,
  sessionId?: string
) {
  try {
    const supabase = getServiceClient();
    await supabase.from('recognition_events').insert({
      artwork_id: artworkId,
      method,
      confidence,
      device_type: deviceType || 'phone',
      session_id: sessionId,
    });
  } catch (error) {
    console.error('Failed to log recognition event:', error);
  }
}
