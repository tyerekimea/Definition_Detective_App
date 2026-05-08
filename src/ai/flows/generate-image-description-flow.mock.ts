// Mock implementation for generate-image-description-flow.ts - used during mobile builds

export async function generateImageDescription(params: any) {
  console.warn('[Mobile] AI image description generation not available in offline mode');
  return { description: 'Offline mode - image generation unavailable' };
}
