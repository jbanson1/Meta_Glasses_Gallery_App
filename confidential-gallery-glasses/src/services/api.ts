import type { RecognizeResponse, AudioResponse } from '../types';

// Configure this to point to your Next.js backend
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://theconfidential.gallery';

export async function recognizeImage(
  imageBase64: string,
  deviceType: 'meta_glasses' | 'phone' = 'phone'
): Promise<RecognizeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/recognize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageBase64,
      deviceType,
    }),
  });

  return response.json();
}

export async function getArtworkAudio(
  artworkId: string,
  type: 'quick' | 'full' | 'artist_story' = 'quick'
): Promise<AudioResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/audio/${artworkId}?type=${type}`
  );

  return response.json();
}
