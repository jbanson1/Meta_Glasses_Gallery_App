export interface Artwork {
  id: string;
  title: string;
  artist_name: string;
  year: string | null;
  description: string;
  compact_description: string;
  audio_url: string | null;
}

export interface RecognizeResponse {
  success: boolean;
  artwork?: Artwork;
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

export interface HistoryItem {
  artwork: Artwork;
  scannedAt: string;
  method: string;
  confidence: number;
}
