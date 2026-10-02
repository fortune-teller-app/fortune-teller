import { buildMockPalmReading } from '../mock-backend/palm';

const ANALYZE_DELAY = 3200;
const SAVE_DELAY = 600;

export const PALM_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PALM_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const PALM_HANDS = {
  left:  { label: 'Left Hand',  note: 'What you were born with' },
  right: { label: 'Right Hand', note: 'What you have made of it' },
};

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Returns a user-facing message, or null when the file is acceptable.
export function validatePalmImage(file) {
  if (!file) return 'Choose an image of your palm to continue.';
  if (!PALM_IMAGE_TYPES.includes(file.type)) {
    return 'That file type is not supported. Use a JPG, PNG, or WebP image.';
  }
  if (file.size > PALM_IMAGE_MAX_BYTES) {
    return 'That image is too large. Choose one under 10 MB.';
  }
  return null;
}

export async function analyzePalm({ hand, image }) {
  // TODO: Replace with http.post('/palm/readings', formData) once the backend and AI exist.
  // `image` is the browser File; the real call will upload it as multipart form data.
  void image;
  await wait(ANALYZE_DELAY);
  return buildMockPalmReading({ hand });
}

export async function savePalmReading(reading) {
  // TODO: Replace with http.post('/palm/readings/:id/save').
  await wait(SAVE_DELAY);
  return { id: reading.id, saved: true };
}
