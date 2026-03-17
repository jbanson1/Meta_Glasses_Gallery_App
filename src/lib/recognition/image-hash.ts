import sharp from 'sharp';

/**
 * Generate a perceptual hash (pHash) for an image.
 * Uses a simplified DCT-based approach:
 * 1. Resize to small grayscale image
 * 2. Compute average pixel value
 * 3. Generate binary hash based on above/below average
 */
export async function generateImageHash(imageBuffer: Buffer): Promise<string> {
  // Resize to 16x16 grayscale for perceptual hashing
  const resized = await sharp(imageBuffer)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  const pixels = Array.from(resized);
  const average = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;

  // Generate binary hash: 1 if pixel > average, 0 otherwise
  const bits = pixels.map((pixel) => (pixel > average ? '1' : '0'));

  // Convert to hex string
  let hash = '';
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = bits.slice(i, i + 4).join('');
    hash += parseInt(nibble, 2).toString(16);
  }

  return hash;
}

/**
 * Calculate Hamming distance between two hex hashes.
 * Lower distance = more similar images.
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    return Infinity;
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const val1 = parseInt(hash1[i], 16);
    const val2 = parseInt(hash2[i], 16);
    // Count differing bits
    let xor = val1 ^ val2;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }

  return distance;
}

/**
 * Find the best matching artwork by comparing image hashes.
 * Returns null if no match is found within the threshold.
 */
export function findBestHashMatch(
  queryHash: string,
  candidates: Array<{ id: string; image_hash: string }>,
  threshold: number = 10
): { id: string; distance: number; confidence: number } | null {
  let bestMatch: { id: string; distance: number } | null = null;

  for (const candidate of candidates) {
    if (!candidate.image_hash) continue;

    const distance = hammingDistance(queryHash, candidate.image_hash);
    if (distance <= threshold && (!bestMatch || distance < bestMatch.distance)) {
      bestMatch = { id: candidate.id, distance };
    }
  }

  if (!bestMatch) return null;

  // Convert distance to confidence (0-1 scale)
  // Max possible distance for a 64-char hex hash is 256 bits
  const maxDistance = queryHash.length * 4;
  const confidence = Math.max(0, 1 - bestMatch.distance / maxDistance);

  return {
    id: bestMatch.id,
    distance: bestMatch.distance,
    confidence: Math.round(confidence * 100) / 100,
  };
}
