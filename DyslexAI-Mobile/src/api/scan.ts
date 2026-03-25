import { API_BASE_URL } from '../constants/config';

export type ErrorRegion = {
  bbox: [number, number, number, number]; // [x_min, y_min, x_max, y_max] in image pixels
  original?: string;
  corrected?: string;
};

export type ScanResponse = {
  raw_text: string;
  cleaned_text: string;
  corrected_text: string;
  line_count: number;
  lines: Array<{ line_number: number; text: string }>;
  image_width?: number;
  image_height?: number;
  error_regions?: ErrorRegion[];
};

/**
 * Upload a handwriting image to the backend.
 * Backend runs: DocTR (line detection) + TrOCR (recognition) + optional Groq (context correction).
 */
/** Backend can take 1–3+ minutes per scan (TrOCR per line on CPU). */
const SCAN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /network|failed to fetch|connection|ECONNREFUSED|ETIMEDOUT/i.test(msg);
}

export async function scanImage(imageUri: string): Promise<ScanResponse> {
  const formData = new FormData();
  // @ts-ignore - React Native FormData accepts { uri, type, name }
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'handwriting.jpg',
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/scan`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        // Do not set Content-Type; browser/RN sets multipart boundary
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Scan failed: ${response.status}`);
    }

    return response.json() as Promise<ScanResponse>;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        'Scan timed out (5 min). Use a smaller image or check that the scan backend is running on port 8000.'
      );
    }
    if (isNetworkError(e)) {
      throw new Error(
        'Cannot reach the scan server. Check: (1) Scan backend is running on port 8000. (2) App URL is correct (emulator: 10.0.2.2:8000). (3) Firewall allows port 8000. First scan can take 1–2 minutes.'
      );
    }
    throw e;
  }
}
