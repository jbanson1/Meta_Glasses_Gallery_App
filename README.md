# Confidential Gallery — Meta Glasses Art Recognition

A dual-platform AR art recognition system for the Confidential Gallery. Visitors scan physical artworks using Meta Ray-Ban smart glasses or a Meta Quest headset and receive real-time audio narration, artwork details, and immersive XR previews.

## Architecture

```
Meta_Glasses_Gallery_App/
├── src/                          # Next.js 14 backend API
│   ├── app/
│   │   ├── api/
│   │   │   ├── recognize/        # POST — artwork recognition
│   │   │   ├── audio/[artworkId] # GET  — audio narration
│   │   │   └── artworks/[id]/hash # POST — image hash generation
│   │   └── ar-preview/
│   │       ├── page.tsx          # AR preview mode selector
│   │       └── xr/              # WebXR experience (Quest 2/3/Pro)
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── audio.ts             # Audio pipeline (pre-recorded + ElevenLabs TTS)
│   │   └── recognition/         # 3-tier recognition pipeline
│   └── types/                   # Shared TypeScript interfaces
├── confidential-gallery-glasses/ # Expo/React Native companion app
│   ├── src/
│   │   ├── screens/             # Home, Scan, Artwork, History, Settings
│   │   ├── hooks/               # useRecognition, useAudio, useGlassesConnection
│   │   └── services/            # API client, Meta Glasses SDK (simulated)
│   └── App.tsx                  # Entry point
└── supabase/                    # Database migrations and seed data
```

## Recognition Pipeline

Artworks are identified using a three-tier strategy (fastest first):

1. **QR Code Detection** — Scans for `CG-XXXXXX` marker codes using jsQR
2. **Perceptual Image Hashing** — 16x16 grayscale DCT hash with Hamming distance matching
3. **AI Vision Fallback** — OpenAI GPT-4o vision API for unrecognised works

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/recognize` | Recognise artwork from base64 image or URL |
| GET | `/api/audio/:artworkId` | Get audio narration (quick, full, artist_story) |
| POST | `/api/artworks/:id/hash` | Generate perceptual image hash |

## WebXR Experience (`/ar-preview/xr`)

Immersive art placement for Meta Quest headsets:

- **Quest 3 / Pro** — Mixed Reality mode with passthrough, hit-test surface detection, scan-to-recognise
- **Quest 2** — VR mode with gallery menu, artwork placement at 2m
- Frame styles: none, thin black, gold, mat white
- Audio narration with quick/full/artist story controls
- Recognition event logging (`device_type: webxr_headset`)

## Tech Stack

- **Backend**: Next.js 14 (App Router), TypeScript
- **Database**: Supabase (PostgreSQL)
- **Mobile App**: Expo / React Native
- **AI**: OpenAI GPT-4o (vision), ElevenLabs (TTS)
- **XR**: Native WebXR API, WebGL, Web Audio API
- **Image Processing**: sharp, jsQR, blockhash-core

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project (or local Supabase CLI)

### Backend Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in Supabase, OpenAI, and ElevenLabs keys

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The API runs at `http://localhost:3000`.

### Mobile App Setup

```bash
cd confidential-gallery-glasses
npm install

# Start Expo dev server
npm start

# Run on device
npm run android
npm run ios
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o vision fallback) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key (TTS fallback) |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID |
| `IMAGE_HASH_THRESHOLD` | Hamming distance threshold (default: 10) |
| `AI_VISION_CONFIDENCE_THRESHOLD` | AI vision confidence threshold (default: 0.7) |

## Database Schema

Core tables: `galleries`, `exhibitions`, `artworks`, `markers`, `artwork_audio`, `recognition_events`

Future/XR tables: `artwork_3d_assets`, `artist_avatars`

See `supabase/migrations/001_initial_schema.sql` for the full schema.

## License

Private — Confidential Gallery.
