'use server';

import { generateWord as aiGenerateWord } from '@/ai/flows/generate-word-flow.server';
import { getFirestore, FieldValue } from '@/lib/firebase-admin';
import {
  levelToConstraints,
  normalizeWord,
  isValidWord,
  getFallbackWord,
  isThemeMatch,
} from './word-utils';

/**
 * Optimized Single-Call Generation
 * 
 * Fast, reliable single-word generation with built-in caching and validation.
 * Use this for real-time gameplay when you need one word at a time.
 */

export interface SingleCallGenerationOptions {
  level: number;
  theme?: string;
  userId?: string | null;
  previousWord?: string;
  useCache?: boolean;
  timeoutMs?: number;
}

export interface SingleCallGenerationResult {
  success: boolean;
  word?: string;
  definition?: string;
  cached?: boolean;
  message?: string;
  durationMs?: number;
}

// In-memory recent-word history to reduce repeats for anonymous/local sessions.
// This is process-local and complements Firestore history for logged-in users.
const generationCache = new Map<string, { words: string[]; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_HISTORY_LIMIT = 120;

function invalidateCache(): void {
  const now = Date.now();
  for (const [key, value] of generationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      generationCache.delete(key);
    }
  }
}

function getHistoryKey(params: {
  userId: string | null;
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
}): string {
  if (params.userId) return `user:${params.userId}`;
  return `anon:${params.theme}:${params.difficulty}`;
}

function getCachedRecentWords(historyKey: string): string[] {
  const cached = generationCache.get(historyKey);
  if (!cached) return [];
  return cached.words.map(word => normalizeWord(word)).filter(Boolean);
}

function cacheUsedWord(historyKey: string, word: string): void {
  const normalized = normalizeWord(word);
  if (!normalized) return;

  const cached = generationCache.get(historyKey);
  if (!cached) {
    generationCache.set(historyKey, {
      words: [normalized],
      timestamp: Date.now(),
    });
    return;
  }

  const deduped = [normalized, ...cached.words.filter(w => w !== normalized)];
  generationCache.set(historyKey, {
    words: deduped.slice(0, CACHE_HISTORY_LIMIT),
    timestamp: Date.now(),
  });
}

async function getRecentUsedWords(userId: string | null): Promise<string[]> {
  if (!userId) return [];
  
  const MAX_WORDS = 80;

  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    const usedWordsRef = userProfileRef.collection('usedWords');
    
    // Try to get from subcollection first (faster and more scalable)
    const snapshot = await usedWordsRef
      .orderBy('createdAt', 'desc')
      .limit(MAX_WORDS)
      .get();

    if (!snapshot.empty) {
      const words = snapshot.docs
        .map(doc => doc.data()?.word)
        .map(word => (typeof word === 'string' ? normalizeWord(word) : ''))
        .filter(Boolean);
      return words;
    }

    // Only fall back to parent doc if subcollection is empty (Legacy support)
    const userDoc = await userProfileRef.get();
    const userData = userDoc.data();
    const usedWordsRaw = userData?.usedWords;
    
    const usedWords = Array.isArray(usedWordsRaw)
      ? usedWordsRaw
          .map(word => (typeof word === 'string' ? normalizeWord(word) : ''))
          .filter(Boolean)
      : [];

    return usedWords.slice(-MAX_WORDS);
  } catch (error) {
    console.error('[getRecentUsedWords] Firestore fetch failed:', error);
    return [];
  }
}

async function saveUsedWord(userId: string | null, word: string): Promise<void> {
  if (!userId) return;
  
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    const normalizedWord = normalizeWord(word);
    
    if (!normalizedWord) return;

    const usedWordsRef = userProfileRef.collection('usedWords');
    await usedWordsRef.add({
      word: normalizedWord,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Cleanup old documents
    const pageSize = 50;
    while (true) {
      const snapshot = await usedWordsRef
        .orderBy('createdAt', 'desc')
        .offset(100)
        .limit(pageSize)
        .get();

      if (snapshot.empty) break;

      const batch = usedWordsRef.firestore.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  } catch (error) {
    console.warn('[saveUsedWord] Error:', error);
  }
}

function shouldAbortAiRetries(message: string): boolean {
  // If the model orchestration already failed across candidates or 
  // there is a configuration/quota issue, retrying is counter-productive.
  return /AI model request failed|No usable AI model candidates|quota|429|authentication|invalid api key|forbidden|denied access|not found for API version|insufficient balance|out of credit/i.test(
    message.toLowerCase()
  );
}

/**
 * Generate a single word optimized for performance
 * Use for real-time gameplay, preloading, or when you need one word at a time
 */
export async function generateOptimizedWord(
  options: SingleCallGenerationOptions
): Promise<SingleCallGenerationResult> {
  const startTime = Date.now();
  const defaultTimeoutMs = Math.max(6000, Number(process.env.OPTIMIZED_WORD_TIMEOUT_MS || 15000));
  const { level, theme = 'current', userId, previousWord, useCache = true, timeoutMs = defaultTimeoutMs } = options;

  try {
    void useCache; // Reserved for future toggles; keep API stable.
    invalidateCache();

    const constraints = levelToConstraints(level);
    if (theme) constraints.theme = theme;

    const historyKey = getHistoryKey({
      userId: userId || null,
      theme,
      difficulty: constraints.difficulty,
    });

    const recentUsedWords = await getRecentUsedWords(userId || null);
    const cachedUsedWords = getCachedRecentWords(historyKey);
    const usedWordsSet = new Set(
      [...recentUsedWords, ...cachedUsedWords].map(w => normalizeWord(w)).filter(Boolean)
    );
    
    if (previousWord) {
      const normalizedPrevious = normalizeWord(previousWord);
      if (normalizedPrevious) {
        usedWordsSet.add(normalizedPrevious);
      }
    }

    // Try AI a few times before deterministic fallback.
    let fallbackReason = 'unknown';
    const maxAiAttempts = Math.max(1, Number(process.env.OPTIMIZED_WORD_AI_ATTEMPTS || 3));

    for (let attempt = 1; attempt <= maxAiAttempts; attempt++) {
      try {
        let timeoutId: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Generation timeout')), timeoutMs);
        });

        const generatePromise = aiGenerateWord({
          difficulty: constraints.difficulty,
          theme: theme as any,
          excludeWords: Array.from(usedWordsSet),
          minLen: constraints.minLen,
          maxLen: constraints.maxLen,
        });

        const result = await Promise.race([generatePromise, timeoutPromise]) as any;
        if (timeoutId) clearTimeout(timeoutId);

        if (!result?.word) {
          fallbackReason = 'ai-no-output';
          continue;
        }

        const word = normalizeWord(result.word);
        const definition = result.definition;

        // Validate
        if (!word) {
          fallbackReason = 'ai-empty-word';
          continue;
        }
        if (!isValidWord(word, constraints)) {
          fallbackReason = 'ai-invalid-word';
          console.warn(
            '[generateOptimizedWord] AI word failed validation:',
            result.word,
            constraints,
            `attempt=${attempt}/${maxAiAttempts}`
          );
          usedWordsSet.add(word);
          continue;
        }
        if (!isThemeMatch(word, definition || '', theme)) {
          fallbackReason = 'ai-theme-mismatch';
          console.warn(
            '[generateOptimizedWord] AI word failed theme validation:',
            word,
            theme,
            `attempt=${attempt}/${maxAiAttempts}`
          );
          usedWordsSet.add(word);
          continue;
        }
        if (usedWordsSet.has(word)) {
          fallbackReason = 'ai-duplicate-word';
          console.warn(
            '[generateOptimizedWord] AI repeated a previously used word:',
            word,
            `attempt=${attempt}/${maxAiAttempts}`
          );
          continue;
        }

        await saveUsedWord(userId || null, word);
        cacheUsedWord(historyKey, word);
        console.log('[generateOptimizedWord] source=ai word=', word, `attempt=${attempt}/${maxAiAttempts}`);
        return {
          success: true,
          word,
          definition,
          durationMs: Date.now() - startTime,
        };
      } catch (error: any) {
        fallbackReason = `ai-error:${error?.message || 'unknown'}`;
        console.warn(
          '[generateOptimizedWord] AI generation failed; retrying:',
          error?.message || error,
          `attempt=${attempt}/${maxAiAttempts}`
        );

        // Determine if we should stop trying AI entirely for this request
        if (
          error?.message === 'Generation timeout' || 
          error?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
          shouldAbortAiRetries(error?.message || '')
        ) {
          fallbackReason = `terminal-error:${error?.message || 'network'}`;
          console.warn('[generateOptimizedWord] Aborting retries due to terminal error');
          break; // Exit loop early and use fallback word
        }
      }
    }

    // Fallback to deterministic word
    const fallback = getFallbackWord(constraints, usedWordsSet, theme);
    // Note: We avoid saveUsedWord here if the network is dead to prevent more timeouts
    // but we still cache it locally for the current session.
    cacheUsedWord(historyKey, fallback.word);
    console.warn(
      `[generateOptimizedWord] source=fallback word=${fallback.word} reason=${fallbackReason} excluded=${usedWordsSet.size}`
    );

    return {
      success: true,
      word: fallback.word,
      definition: fallback.definition,
      durationMs: Date.now() - startTime,
    };

  } catch (error: any) {
    const message = error?.message || String(error);
    console.error('[generateOptimizedWord] Error:', message);

    return {
      success: false,
      message,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Preload multiple words for smoother gameplay
 * Faster than generating individually
 */
export async function preloadWords(params: {
  count: number;
  level: number;
  theme?: string;
  userId?: string | null;
}): Promise<Array<{ word: string; definition: string }>> {
  try {
    const { count, level, theme = 'current', userId } = params;
    const { generateBatchUniqueWords } = await import('./batch-word-generator.server');

    const result = await generateBatchUniqueWords({
      batchSize: count,
      level,
      theme,
      userId,
    });

    if (result.success && result.words) {
      console.log('[preloadWords] Batch preloaded', result.words.length, 'words');
      return result.words;
    }

    return [];
  } catch (error) {
    console.error('[preloadWords] Error:', error);
    return [];
  }
}
