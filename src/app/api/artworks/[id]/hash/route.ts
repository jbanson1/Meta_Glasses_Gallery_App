import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { generateImageHash } from '@/lib/recognition/image-hash';

/**
 * POST /api/artworks/:id/hash
 * Generate and store a perceptual hash for an artwork's image.
 * Used during artwork setup to enable image hash matching.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    let imageBuffer: Buffer;

    if (body.image) {
      const base64 = body.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64, 'base64');
    } else if (body.imageUrl) {
      const response = await fetch(body.imageUrl);
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch image.' },
          { status: 400 }
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json(
        { success: false, error: 'Either image (base64) or imageUrl required.' },
        { status: 400 }
      );
    }

    const imageHash = await generateImageHash(imageBuffer);

    const supabase = getServiceClient();
    const { error } = await supabase
      .from('artworks')
      .update({ image_hash: imageHash })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update artwork hash.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, image_hash: imageHash });
  } catch (error) {
    console.error('Hash generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
