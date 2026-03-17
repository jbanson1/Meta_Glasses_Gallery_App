// ============================================================
// Core Domain Types for Confidential Gallery - Meta Glasses App
// ============================================================

export interface Gallery {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export interface Exhibition {
  id: string;
  gallery_id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Artwork {
  id: string;
  exhibition_id: string;
  title: string;
  artist_name: string;
  year: string | null;
  description: string;
  compact_description: string;
  image_url: string | null;
  image_hash: string | null;
  recognition_enabled: boolean;
  audio_url: string | null;
  created_at: string;
}

export interface Marker {
  id: string;
  artwork_id: string;
  code: string; // CG-XXXXXX format
  created_at: string;
}

export interface ArtworkAudio {
  id: string;
  artwork_id: string;
  audio_type: 'quick' | 'full' | 'artist_story';
  audio_url: string;
  duration_seconds: number | null;
  language: string;
  created_at: string;
}

export interface RecognitionEvent {
  id: string;
  artwork_id: string | null;
  method: 'qr' | 'image_hash' | 'ai_vision';
  confidence: number;
  device_type: 'meta_glasses' | 'phone';
  session_id: string | null;
  created_at: string;
}

// Future-proofing types
export interface Artwork3DAsset {
  id: string;
  artwork_id: string;
  asset_type: 'info_panel' | 'artist_avatar' | 'creation_animation';
  file_url: string | null;
  thumbnail_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ArtistAvatar {
  id: string;
  artist_name: string;
  avatar_model_url: string | null;
  voice_id: string | null;
  bio: string | null;
  created_at: string;
}

// API types
export interface RecognizeRequest {
  image?: string;     // base64 encoded image
  imageUrl?: string;  // URL to image
  deviceType?: 'meta_glasses' | 'phone';
  sessionId?: string;
}

export interface RecognizeResponse {
  success: boolean;
  artwork?: {
    id: string;
    title: string;
    artist_name: string;
    year: string | null;
    description: string;
    compact_description: string;
    audio_url: string | null;
  };
  confidence: number;
  method?: 'qr' | 'image_hash' | 'ai_vision';
  error?: string;
}

export interface AudioResponse {
  success: boolean;
  audio_url?: string;
  duration_seconds?: number;
  error?: string;
}
