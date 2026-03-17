import { NextRequest, NextResponse } from 'next/server';
import { getArtworkAudio } from '@/lib/audio';

export async function GET(
  request: NextRequest,
  { params }: { params: { artworkId: string } }
) {
  try {
    const { artworkId } = params;
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') as 'quick' | 'full' | 'artist_story') || 'quick';
    const language = searchParams.get('lang') || 'en';

    const result = await getArtworkAudio(artworkId, type, language);

    return NextResponse.json(result, {
      status: result.success ? 200 : 404,
    });
  } catch (error) {
    console.error('Audio API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
