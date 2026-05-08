// Mock implementation for game-sounds-flow.ts - used during mobile builds

export async function generateGameSounds(params: any) {
  console.warn('[Mobile] AI sound generation not available in offline mode');
  return { success: false, message: 'Sound generation not available offline' };
}
