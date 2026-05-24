// Mock implementation for actions.ts - used during mobile builds
// Real implementation requires Server Actions which aren't available in static export

import type { GenerateHintInput } from '@/ai/schemas/hint';
import type { WordTheme } from '@/lib/game-data';
import { wordList } from '@/lib/game-data';
import { THEME_FALLBACK_WORDS } from '@/lib/word-utils';

function assertMobileBuildOnly(functionName: string): void {
  if (process.env.MOBILE_BUILD === 'true') return;

  // Fail loudly in non-mobile contexts so we don't silently run offline mocks
  // when the server-action wiring is expected to be active.
  throw new Error(
    `[MockGuard] ${functionName} called while MOBILE_BUILD is not true. This indicates server-action aliasing/import routing is incorrect for web/dev runtime.`
  );
}

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
  assertMobileBuildOnly('useHintAction');
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
  assertMobileBuildOnly('generateWordWithTheme');
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
  assertMobileBuildOnly('updateUserTheme');
  console.warn('[Mobile] Theme update not available in offline mode');
  return { success: false, message: 'Theme update not available offline' };
}

export async function getUserTheme(
  userId: string | null
): Promise<{ theme: WordTheme; isPremium: boolean }> {
  assertMobileBuildOnly('getUserTheme');
  // Silently return default — no warning needed, this is expected offline behaviour
  return { theme: 'current' as WordTheme, isPremium: false };
}

// Batch initialization not available in offline mode
export async function initializeLevelWithBatch(params: {
  level: number;
  theme?: WordTheme;
  userId?: string | null;
  preloadCount?: number;
}): Promise<{ success: boolean; words?: any[]; message?: string }> {
  assertMobileBuildOnly('initializeLevelWithBatch');
  console.warn('[Mobile] Level batch initialization not available in offline mode');
  return { success: false, message: 'Batch initialization not available offline' };
}

// Background preloading not available in offline mode
export async function preloadNextWordsInBackground(params: {
  level: number;
  theme?: WordTheme;
  userId?: string | null;
  count?: number;
}): Promise<{ success: boolean; words?: any[] }> {
  assertMobileBuildOnly('preloadNextWordsInBackground');
  console.warn('[Mobile] Background preloading not available in offline mode');
  return { success: false };
}

// Performance metrics not available in offline mode
export async function getGenerationMetrics(): Promise<{
  success: boolean;
  metrics?: any;
  message?: string;
}> {
  assertMobileBuildOnly('getGenerationMetrics');
  console.warn('[Mobile] Performance metrics not available in offline mode');
  return { success: false, message: 'Metrics not available offline' };
}

// Batch hints not available in offline mode
export async function generateBatchHintsAction(params: {
  hints: Array<{
    word: string;
    incorrectGuesses: string;
    lettersToReveal: number;
  }>;
}): Promise<{ success: boolean; hints?: any[]; message?: string }> {
  assertMobileBuildOnly('generateBatchHintsAction');
  console.warn('[Mobile] Batch hint generation not available in offline mode');
  return { success: false, message: 'Batch hints not available offline' };
}
