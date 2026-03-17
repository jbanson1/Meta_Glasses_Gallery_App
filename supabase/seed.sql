-- ============================================================
-- Sample seed data for development/testing
-- ============================================================

-- Sample Gallery
INSERT INTO galleries (id, name, location) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Confidential Gallery', 'Los Angeles, CA');

-- Sample Exhibition
INSERT INTO exhibitions (id, gallery_id, title, start_date, end_date) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Opening Exhibition', '2025-01-01', '2025-12-31');

-- Sample Artworks
INSERT INTO artworks (id, exhibition_id, title, artist_name, year, description, compact_description, recognition_enabled) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Ephemeral Bloom',
    'Maya Torres',
    '2024',
    'Ephemeral Bloom is a mixed-media installation that explores the transient nature of beauty through layered projections of flowering plants onto sculpted glass forms. Torres uses time-lapse photography and algorithmic distortion to create a mesmerizing cycle of growth and decay.',
    'Mixed-media installation exploring beauty''s transience through projected flowers on sculpted glass.',
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Urban Frequencies',
    'Jamal Washington',
    '2023',
    'Urban Frequencies translates the electromagnetic signals of city infrastructure into visual patterns. Using custom receivers and real-time data visualization, Washington maps the invisible energy fields that surround us daily, revealing the hidden rhythm of urban life.',
    'Data visualization art translating city electromagnetic signals into visual patterns.',
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'Memory Palace',
    'Sofia Chen',
    '2024',
    'Memory Palace is an immersive photography series that reconstructs the artist''s childhood home from fragments of memory. Each image layers multiple exposures of domestic objects, creating dreamlike interiors that exist only in the space between recollection and imagination.',
    'Immersive photo series reconstructing childhood memories through layered exposures.',
    true
  );

-- Sample Markers (QR codes)
INSERT INTO markers (artwork_id, code) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'CG-EB2401'),
  ('c0000000-0000-0000-0000-000000000002', 'CG-UF2301'),
  ('c0000000-0000-0000-0000-000000000003', 'CG-MP2401');

-- Sample Audio
INSERT INTO artwork_audio (artwork_id, audio_type, duration_seconds, audio_url, language) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'quick', 15, '/audio/ephemeral-bloom-quick.mp3', 'en'),
  ('c0000000-0000-0000-0000-000000000001', 'full', 60, '/audio/ephemeral-bloom-full.mp3', 'en'),
  ('c0000000-0000-0000-0000-000000000002', 'quick', 12, '/audio/urban-frequencies-quick.mp3', 'en'),
  ('c0000000-0000-0000-0000-000000000003', 'quick', 14, '/audio/memory-palace-quick.mp3', 'en');
