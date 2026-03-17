import { recognizeImage } from './api';
import type { RecognizeResponse } from '../types';

/**
 * Capture and recognize an artwork from a camera photo.
 * Handles base64 conversion and API call.
 */
export async function recognizeFromPhoto(
  photoUri: string,
  deviceType: 'meta_glasses' | 'phone' = 'phone'
): Promise<RecognizeResponse> {
  // Read the photo file and convert to base64
  const response = await fetch(photoUri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const result = await recognizeImage(base64, deviceType);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
