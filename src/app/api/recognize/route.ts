import { NextRequest, NextResponse } from 'next/server';
import { recognizeArtwork } from '@/lib/recognition';
import type { RecognizeRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecognizeRequest;

    if (!body.image && !body.imageUrl) {
      return NextResponse.json(
        { success: false, confidence: 0, error: 'Either image (base64) or imageUrl is required.' },
        { status: 400 }
      );
    }

    let imageBase64: string;
    let imageBuffer: Buffer;

    if (body.image) {
      // Remove data URL prefix if present
      imageBase64 = body.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(imageBase64, 'base64');
    } else {
      // Fetch image from URL
      const response = await fetch(body.imageUrl!);
      if (!response.ok) {
        return NextResponse.json(
          { success: false, confidence: 0, error: 'Failed to fetch image from URL.' },
          { status: 400 }
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      imageBase64 = imageBuffer.toString('base64');
    }

    // Validate image size (max 10MB)
    if (imageBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, confidence: 0, error: 'Image too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const result = await recognizeArtwork({
      imageBuffer,
      imageBase64,
      deviceType: body.deviceType,
      sessionId: body.sessionId,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 404,
    });
  } catch (error) {
    console.error('Recognition API error:', error);
    return NextResponse.json(
      { success: false, confidence: 0, error: 'Internal server error during recognition.' },
      { status: 500 }
    );
  }
}
