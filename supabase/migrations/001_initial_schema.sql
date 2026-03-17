-- ============================================================
-- Confidential Gallery - Meta Glasses App Database Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Core Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exhibitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID REFERENCES exhibitions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  year TEXT,
  description TEXT NOT NULL DEFAULT '',
  compact_description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  image_hash TEXT,
  recognition_enabled BOOLEAN DEFAULT true,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE, -- CG-XXXXXX format
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id),
  marker_code TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Recognition & Audio Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS artwork_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  audio_type TEXT NOT NULL CHECK (audio_type IN ('quick', 'full', 'artist_story')),
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recognition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id),
  method TEXT NOT NULL, -- 'qr', 'image_hash', 'ai_vision'
  confidence FLOAT,
  device_type TEXT, -- 'meta_glasses', 'phone'
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Future: 3D Assets & Hologram Content (Meta Orion / Quest 3)
-- ============================================================

CREATE TABLE IF NOT EXISTS artwork_3d_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'info_panel',
    'artist_avatar',
    'creation_animation'
  )),
  file_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artist_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  avatar_model_url TEXT,
  voice_id TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_artworks_exhibition ON artworks(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_artworks_image_hash ON artworks(image_hash) WHERE image_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artworks_recognition ON artworks(recognition_enabled) WHERE recognition_enabled = true;
CREATE INDEX IF NOT EXISTS idx_markers_code ON markers(code);
CREATE INDEX IF NOT EXISTS idx_recognition_events_artwork ON recognition_events(artwork_id);
CREATE INDEX IF NOT EXISTS idx_recognition_events_created ON recognition_events(created_at);
CREATE INDEX IF NOT EXISTS idx_artwork_audio_lookup ON artwork_audio(artwork_id, audio_type, language);
