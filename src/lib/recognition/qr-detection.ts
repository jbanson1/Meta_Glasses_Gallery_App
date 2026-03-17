import jsQR from 'jsqr';

interface QRResult {
  found: boolean;
  markerCode?: string; // CG-XXXXXX format
  rawData?: string;
}

/**
 * Detect QR codes in an image buffer.
 * Looks for Confidential Gallery marker codes (CG-XXXXXX format)
 * or URLs containing marker codes.
 */
export async function detectQRCode(imageBuffer: Buffer): Promise<QRResult> {
  // Use canvas to decode image data for jsQR
  const { createCanvas, loadImage } = await import('canvas');
  const image = await loadImage(imageBuffer);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const code = jsQR(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  if (!code) {
    return { found: false };
  }

  const rawData = code.data;

  // Check for direct marker code (CG-XXXXXX)
  const markerMatch = rawData.match(/CG-[A-Z0-9]{6}/i);
  if (markerMatch) {
    return { found: true, markerCode: markerMatch[0].toUpperCase(), rawData };
  }

  // Check for URL containing marker code (e.g., theconfidential.gallery/scan?code=CG-XXXXXX)
  const urlMarkerMatch = rawData.match(/[?&]code=(CG-[A-Z0-9]{6})/i);
  if (urlMarkerMatch) {
    return { found: true, markerCode: urlMarkerMatch[1].toUpperCase(), rawData };
  }

  return { found: false, rawData };
}
