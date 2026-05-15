// Mock implementation for actions.ts - used during mobile builds
// Real implementation requires Server Actions which aren't available in static export

import type { GenerateHintInput } from '@/ai/schemas/hint';
import type { WordTheme } from '@/lib/game-data';
import { wordList } from '@/lib/game-data';
import { THEME_FALLBACK_WORDS } from '@/lib/word-utils';

// Build a local word pool from the existing offline data
function getOfflineWord(params: {
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: WordTheme;
  previousWord?: string;
}): { word: string; definition: string } | null {
  const theme = params.theme ?? 'current';

  // Try theme-specific fallback words first
  const themePool = THEME_FALLBACK_WORDS[theme]?.[params.difficulty] ?? [];

  // Fall back to the general wordList filtered by difficulty
  const generalPool = wordList.filter((w) => w.difficulty === params.difficulty);

  const combined = [...themePool, ...generalPool];

  if (combined.length === 0) return null;

  // Avoid repeating the previous word
  const filtered = params.previousWord
    ? combined.filter((w) => w.word.toLowerCase() !== params.previousWord!.toLowerCase())
    : combined;

  const pool = filtered.length > 0 ? filtered : combined;
  const entry = pool[Math.floor(Math.random() * pool.length)];
  return { word: entry.word, definition: entry.definition };
}

export async function useHintAction(
  data: GenerateHintInput & { userId?: string | null; isFree?: boolean }
): Promise<{ success: boolean; message?: string; hint?: string }> {
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
  const entry = getOfflineWord(params);

  if (!entry) {
    console.warn('[Mobile] No offline words available for', params.difficulty, params.theme);
    return { success: false, message: 'No offline words available' };
  }

  return { success: true, word: entry.word, definition: entry.definition };
}

export async function updateUserTheme(params: {
  userId: string;
  theme: WordTheme;
}): Promise<{ success: boolean; message?: string }> {
  console.warn('[Mobile] Theme update not available in offline mode');
  return { success: false, message: 'Theme update not available offline' };
}

export async function getUserTheme(
  userId: string | null
): Promise<{ theme: WordTheme; isPremium: boolean }> {
  // Silently return default — no warning needed, this is expected offline behaviour
  return { theme: 'current' as WordTheme, isPremium: false };
}