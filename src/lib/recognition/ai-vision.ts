import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AIVisionResult {
  found: boolean;
  title?: string;
  artist?: string;
  description?: string;
  confidence: number;
}

/**
 * Use OpenAI Vision API to identify an artwork from an image.
 * This is the fallback method when QR and image hash don't match.
 */
export async function identifyWithAIVision(
  imageBase64: string
): Promise<AIVisionResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an art identification expert for Confidential Gallery.
Analyze the image and identify the artwork. Respond in JSON format:
{
  "found": true/false,
  "title": "artwork title",
  "artist": "artist name",
  "description": "brief description of the artwork",
  "confidence": 0.0-1.0
}
If you cannot identify the artwork, set found to false and confidence to 0.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Identify this artwork. What is the title and artist?',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { found: false, confidence: 0 };
    }

    const result = JSON.parse(content) as AIVisionResult;
    return result;
  } catch (error) {
    console.error('AI Vision identification failed:', error);
    return { found: false, confidence: 0 };
  }
}

/**
 * Match AI Vision result against database artworks by title/artist similarity.
 */
export function matchAIResultToArtwork(
  aiResult: AIVisionResult,
  artworks: Array<{ id: string; title: string; artist_name: string }>
): { id: string; confidence: number } | null {
  if (!aiResult.found || !aiResult.title) return null;

  const normalizedTitle = aiResult.title.toLowerCase().trim();
  const normalizedArtist = (aiResult.artist || '').toLowerCase().trim();

  let bestMatch: { id: string; score: number } | null = null;

  for (const artwork of artworks) {
    let score = 0;
    const dbTitle = artwork.title.toLowerCase().trim();
    const dbArtist = artwork.artist_name.toLowerCase().trim();

    // Title matching
    if (dbTitle === normalizedTitle) {
      score += 0.6;
    } else if (dbTitle.includes(normalizedTitle) || normalizedTitle.includes(dbTitle)) {
      score += 0.3;
    }

    // Artist matching
    if (dbArtist === normalizedArtist) {
      score += 0.4;
    } else if (dbArtist.includes(normalizedArtist) || normalizedArtist.includes(dbArtist)) {
      score += 0.2;
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: artwork.id, score };
    }
  }

  if (!bestMatch) return null;

  const finalConfidence = Math.min(bestMatch.score * aiResult.confidence, 1.0);
  return {
    id: bestMatch.id,
    confidence: Math.round(finalConfidence * 100) / 100,
  };
}
