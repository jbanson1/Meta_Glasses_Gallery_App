import { supabase } from '@/lib/supabase';
import type {
  RecognizeResponse,
  AudioResponse,
  Artwork3DAsset,
  ArtistAvatar,
} from './types';

const API_BASE = 'https://theconfidential.gallery';

export async function recognizeArtwork(
  base64Image: string,
): Promise<RecognizeResponse> {
  const res = await fetch(`${API_BASE}/api/recognize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Type': 'webxr_headset',
    },
    body: JSON.stringify({ image: base64Image }),
  });
  return res.json() as Promise<RecognizeResponse>;
}

export async function fetchAudio(
  artworkId: string,
  type: 'quick' | 'full' | 'artist_story',
): Promise<AudioResponse> {
  const res = await fetch(
    `${API_BASE}/api/audio/${encodeURIComponent(artworkId)}?type=${type}&lang=en`,
  );
  return res.json() as Promise<AudioResponse>;
}

export async function fetchArtwork3DAssets(
  artworkId: string,
): Promise<Artwork3DAsset | null> {
  const { data, error } = await supabase
    .from('artwork_3d_assets')
    .select('info_panel_url, artist_avatar_id, creation_animation_url')
    .eq('artwork_id', artworkId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Artwork3DAsset;
}

export async function fetchArtistAvatar(
  avatarId: string,
): Promise<ArtistAvatar | null> {
  const { data, error } = await supabase
    .from('artist_avatars')
    .select('model_url, voice_id, greeting_text, bio')
    .eq('id', avatarId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ArtistAvatar;
}

export async function fetchRecentArtworks(
  limit: number = 6,
): Promise<
  Array<{
    id: string;
    title: string;
    artist_name: string;
    year: string | null;
    description: string;
    compact_description: string;
    audio_url: string | null;
    image_url: string | null;
  }>
> {
  const { data, error } = await supabase
    .from('artworks')
    .select(
      'id, title, artist_name, year, description, compact_description, audio_url, image_url',
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}

export function logRecognitionEvent(
  artworkId: string,
  method: string,
  confidence: number,
  sessionId: string,
): void {
  // Fire-and-forget — swallow errors silently
  supabase
    .from('recognition_events')
    .insert({
      artwork_id: artworkId,
      device_type: 'webxr_headset',
      method,
      confidence,
      session_id: sessionId,
    })
    .then(() => {});
}
