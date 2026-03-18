// ============================================================
// Local WebXR type definitions — mirrors companion API types
// ============================================================

export interface RecognizeResponse {
  success: boolean;
  artwork?: {
    id: string;
    title: string;
    artist_name: string;
    year: string;
    description: string;
    compact_description: string;
    audio_url: string;
  };
  confidence: number;
  method?: 'qr' | 'image_hash' | 'ai_vision';
  error?: string;
}

export interface AudioResponse {
  success: boolean;
  audio_url?: string;
  audio_type?: 'quick' | 'full' | 'artist_story';
  duration?: number;
  language?: string;
  is_generated?: boolean;
  error?: string;
}

export interface Artwork3DAsset {
  info_panel_url?: string;
  artist_avatar_id?: string;
  creation_animation_url?: string;
}

export interface ArtistAvatar {
  model_url?: string;
  voice_id?: string;
  greeting_text?: string;
  bio?: string;
}

export type XRMode = 'immersive-ar' | 'immersive-vr';

export type FrameStyle = 'none' | 'thin' | 'gold' | 'mat';

export type AppState =
  | 'loading'
  | 'unsupported'
  | 'pre-session'
  | 'scan'
  | 'recognizing'
  | 'place'
  | 'placed'
  | 'vr-menu';

export interface PlacedArtwork {
  id: string;
  title: string;
  artist_name: string;
  year: string;
  description: string;
  compact_description: string;
  audio_url: string;
  image_url?: string;
  frameStyle: FrameStyle;
  position: { x: number; y: number; z: number };
  rotation: number;
  scale: number;
}
