// Mock implementation for actions.ts - used during mobile builds
// Real implementation requires Server Actions which aren't available in static export

import type { GenerateHintInput } from '@/ai/schemas/hint';
import type { WordTheme } from '@/lib/game-data';

export async function useHintAction(data: GenerateHintInput & { userId?: string | null, isFree?: boolean }): Promise<{ success: boolean; message?: string; hint?: string; }> {
  console.warn('[Mobile] Hint action not available in offline mode');
  return { success: false, message: 'Hints not available in offline mode' };
}

export async function generateWordWithTheme(params: {
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: WordTheme;
  userId?: string | null;
  level?: number;
  previousWord?: string;
}): Promise<{ success: boolean; word?: string; definition?: string; message?: string }> {
  console.warn('[Mobile] Word generation not available in offline mode');
  return { success: false, message: 'Word generation not available in offline mode' };
}

export async function updateUserTheme(params: { userId: string; theme: WordTheme }): Promise<{ success: boolean; message?: string }> {
  console.warn('[Mobile] Theme update not available in offline mode');
  return { success: false, message: 'Theme update not available offline' };
}

export async function getUserTheme(userId: string | null): Promise<{ theme: WordTheme; isPremium: boolean }> {
  console.warn('[Mobile] Theme retrieval not available in offline mode');
  return { theme: 'current' as WordTheme, isPremium: false };
}
