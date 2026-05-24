/**
 * AI Generation Integration Examples
 * 
 * Practical examples showing how to use both single-call and batch generation
 * in your game logic.
 */

'use server';

import { generateOptimizedWord } from '@/lib/optimized-word-generator.server';
import { generateBatchUniqueWords, generateBatchHintsOptimized } from '@/lib/batch-word-generator.server';
import { GenerateHintInput } from '@/ai/schemas/hint';

// ============================================================================
// EXAMPLE 1: Real-time Gameplay (Single-Call)
// ============================================================================

interface GameState {
  currentWord?: string;
  definition?: string;
  preloadedWord?: string;
  preloadedDefinition?: string;
  level: number;
  theme: string;
  userId: string;
}

/**
 * Get the next word for gameplay (uses preloaded word if available)
 */
export async function getNextWord(gameState: GameState) {
  // If we have a preloaded word, use it immediately
  if (gameState.preloadedWord) {
    return {
      word: gameState.preloadedWord,
      definition: gameState.preloadedDefinition,
      type: 'preloaded', // Instant
    };
  }

  // Otherwise, generate a new word (this causes a slight delay)
  const result = await generateOptimizedWord({
    level: gameState.level,
    theme: gameState.theme as any,
    userId: gameState.userId,
    previousWord: gameState.currentWord,
  });

  if (result.success) {
    return {
      word: result.word,
      definition: result.definition,
      type: 'fresh',
      generatedIn: result.durationMs,
    };
  }

  throw new Error(`Failed to generate word: ${result.message}`);
}

/**
 * Preload the next word while player is solving current puzzle
 */
export async function preloadNextWord(gameState: GameState) {
  // This happens in the background, not blocking gameplay
  const result = await generateOptimizedWord({
    level: gameState.level,
    theme: gameState.theme as any,
    userId: gameState.userId,
    previousWord: gameState.currentWord,
    timeoutMs: 8000, // Slightly shorter timeout for background task
  });

  return {
    preloadedWord: result.success ? result.word : undefined,
    preloadedDefinition: result.success ? result.definition : undefined,
  };
}

// ============================================================================
// EXAMPLE 2: Level Initialization (Batch Generation)
// ============================================================================

interface LevelSetup {
  wordQueue: Array<{ word: string; definition: string }>;
  hintCache: Map<string, string>;
}

/**
 * Initialize a level with pregenerated content
 * Much faster than generating words one-by-one
 */
export async function initializeLevelContent(params: {
  level: number;
  theme: string;
  userId: string;
  wordsNeeded: number;
}): Promise<LevelSetup> {
  console.log(`[initializeLevel] Preparing ${params.wordsNeeded} words for level ${params.level}`);

  // Batch generate all words at once (3-10 recommended)
  const batchSize = Math.min(params.wordsNeeded, 8); // Max 8 per batch
  const wordResult = await generateBatchUniqueWords({
    batchSize,
    level: params.level,
    theme: params.theme as any,
    userId: params.userId,
  });

  if (!wordResult.success || !wordResult.words) {
    throw new Error(`Failed to initialize level: ${wordResult.message}`);
  }

  console.log(
    `[initializeLevel] Generated ${wordResult.generatedCount}/${wordResult.totalRequested} words in ${wordResult.performanceMs}ms`
  );

  return {
    wordQueue: wordResult.words,
    hintCache: new Map(), // Will be populated on-demand
  };
}

// ============================================================================
// EXAMPLE 3: Hint Generation (Batch Processing)
// ============================================================================

/**
 * Generate hints for the current word
 */
export async function generateHintForWord(params: {
  word: string;
  wordLength: number;
  incorrectGuesses: string;
  lettersToReveal: number;
}) {
  // Single hint - use single-call for speed
  const result = await generateBatchHintsOptimized({
    hints: [
      {
        word: params.word,
        wordLength: params.wordLength,
        incorrectGuesses: params.incorrectGuesses,
        lettersToReveal: params.lettersToReveal,
      },
    ],
  });

  if (result.success && result.hints?.[0]) {
    return result.hints[0];
  }

  throw new Error(`Failed to generate hint: ${result.message}`);
}

/**
 * Generate multiple hints for multiplayer or batch processing
 */
export async function generateMultipleHints(params: {
  words: Array<{ word: string; wordLength: number; incorrectGuesses: string; lettersToReveal: number }>;
}) {
  const hintRequests: GenerateHintInput[] = params.words.map((w) => ({
    word: w.word,
    wordLength: w.wordLength,
    incorrectGuesses: w.incorrectGuesses,
    lettersToReveal: w.lettersToReveal,
  }));

  const result = await generateBatchHintsOptimized({
    hints: hintRequests,
  });

  if (result.success && result.hints) {
    console.log(
      `[generateMultipleHints] Generated ${result.generatedCount} hints in ${result.performanceMs}ms`
    );
    return result.hints;
  }

  throw new Error(`Failed to generate hints: ${result.message}`);
}

// ============================================================================
// EXAMPLE 4: Adaptive Preloading Strategy
// ============================================================================

interface PreloadStrategy {
  singleCallThreshold: number; // Use single-call if queue < this
  batchSize: number;
  preloadTarget: number;
}

const PRELOAD_STRATEGY: PreloadStrategy = {
  singleCallThreshold: 3, // If < 3 words in queue, preload 1
  batchSize: 5, // Batch generate 5 at once
  preloadTarget: 8, // Try to keep 8 words queued
};

/**
 * Adaptive preloading: use single-call for small batches, batch for larger
 */
export async function adaptivePreload(params: {
  currentQueueSize: number;
  level: number;
  theme: string;
  userId: string;
}): Promise<Array<{ word: string; definition: string }>> {
  const needed = PRELOAD_STRATEGY.preloadTarget - params.currentQueueSize;

  if (needed <= 0) {
    return []; // Queue is full
  }

  // For small needs, use single-call (faster for 1-2 items)
  if (needed <= PRELOAD_STRATEGY.singleCallThreshold) {
    console.log(`[adaptivePreload] Using single-call for ${needed} word(s)`);
    const words = [];

    for (let i = 0; i < needed; i++) {
      const result = await generateOptimizedWord({
        level: params.level,
        theme: params.theme as any,
        userId: params.userId,
      });

      if (result.success && result.word) {
        words.push({
          word: result.word,
          definition: result.definition || '',
        });
      }
    }

    return words;
  }

  // For larger needs, use batch generation (more efficient)
  console.log(`[adaptivePreload] Using batch generation for ${needed} word(s)`);
  const batchSize = Math.min(needed, PRELOAD_STRATEGY.batchSize);
  const result = await generateBatchUniqueWords({
    batchSize,
    level: params.level,
    theme: params.theme as any,
    userId: params.userId,
  });

  return result.words || [];
}

// ============================================================================
// EXAMPLE 5: Bulk Content Generation (For Admins/Developers)
// ============================================================================

/**
 * Generate content for all themes and difficulties
 * Perfect for initial data seeding or monthly refreshes
 */
export async function generateBulkMonthlyContent(params: {
  wordsPerLevelTheme: number;
}) {
  const themes = ['current', 'science-safari', 'history-quest', 'geo-genius'] as const;
  const difficulties = ['easy', 'medium', 'hard'] as const;
  const allContent: Array<{ word: string; definition: string; level: number; theme: string }> = [];

  console.log(`[generateBulkContent] Starting bulk generation...`);

  for (const theme of themes) {
    for (const difficulty of difficulties) {
      const level = difficulties.indexOf(difficulty) + 1;

      try {
        const result = await generateBatchUniqueWords({
          batchSize: params.wordsPerLevelTheme,
          level,
          theme: theme as any,
        });

        if (result.success && result.words) {
          result.words.forEach((w) => {
            allContent.push({
              word: w.word,
              definition: w.definition,
              level,
              theme,
            });
          });

          console.log(
            `[generateBulkContent] ${theme} / ${difficulty}: Generated ${result.generatedCount} words in ${result.performanceMs}ms`
          );
        }
      } catch (error) {
        console.error(`[generateBulkContent] Failed for ${theme}/${difficulty}:`, error);
      }
    }
  }

  console.log(`[generateBulkContent] Total content generated: ${allContent.length} items`);
  return allContent;
}

// ============================================================================
// EXAMPLE 6: Error Recovery
// ============================================================================

/**
 * Graceful fallback if generation fails
 */
export async function getWordWithFallback(params: {
  level: number;
  theme: string;
  userId: string;
  fallbackWord: string; // Hardcoded fallback
}): Promise<{ word: string; definition: string }> {
  try {
    const result = await generateOptimizedWord({
      level: params.level,
      theme: params.theme as any,
      userId: params.userId,
      timeoutMs: 5000, // Shorter timeout for fallback path
    });

    if (result.success && result.word) {
      return {
        word: result.word,
        definition: result.definition || '',
      };
    }
  } catch (error) {
    console.error('[getWordWithFallback] Generation failed, using hardcoded fallback');
  }

  // Fallback to hardcoded word
  return {
    word: params.fallbackWord,
    definition: 'A word that means to fall back to when generation fails.',
  };
}

// ============================================================================
// EXAMPLE 7: Performance Monitoring
// ============================================================================

interface GenerationMetrics {
  timestamp: number;
  method: 'single-call' | 'batch' | 'fallback';
  itemCount: number;
  durationMs: number;
  success: boolean;
}

const metricsLog: GenerationMetrics[] = [];

export function recordMetric(metric: GenerationMetrics) {
  metricsLog.push(metric);

  // Keep only last 1000 metrics
  if (metricsLog.length > 1000) {
    metricsLog.shift();
  }
}

export function getAveragePerformance(method: 'single-call' | 'batch'): number {
  const relevant = metricsLog.filter((m) => m.method === method && m.success);
  if (relevant.length === 0) return 0;

  const totalMs = relevant.reduce((sum, m) => sum + m.durationMs, 0);
  return Math.round(totalMs / relevant.length);
}

export function getPerformanceReport() {
  return {
    totalSingleCall: getAveragePerformance('single-call'),
    totalBatch: getAveragePerformance('batch'),
    metricsCount: metricsLog.length,
    successRate: (metricsLog.filter((m) => m.success).length / metricsLog.length) * 100,
  };
}

// ============================================================================
// USAGE IN YOUR GAME COMPONENT
// ============================================================================

/*
// In your React component or server action:

'use server';

export async function playGameRound(userId: string, level: number) {
  // Get current word (either preloaded or fresh)
  const word = await getNextWord({
    level,
    theme: 'current',
    userId,
    currentWord: undefined,
    preloadedWord: undefined,
  });

  // Start preloading next word in background
  // (Don't await - let it run in background)
  preloadNextWord({
    level,
    theme: 'current',
    userId,
    currentWord: word.word,
  }).catch(err => console.error('Preload failed:', err));

  return word;
}

// For level initialization:
export async function startLevel(userId: string, level: number) {
  const levelContent = await initializeLevelContent({
    level,
    theme: 'current',
    userId,
    wordsNeeded: 8,
  });

  return levelContent;
}

// For getting a hint:
export async function requestHint(word: string, incorrectGuesses: string) {
  const hint = await generateHintForWord({
    word: word.toUpperCase(),
    wordLength: word.length,
    incorrectGuesses: incorrectGuesses.toUpperCase(),
    lettersToReveal: 2,
  });

  return hint;
}
*/
