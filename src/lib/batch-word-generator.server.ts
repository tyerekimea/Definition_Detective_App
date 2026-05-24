'use server';

import { generateBatchWords } from '@/ai/flows/generate-batch-word-flow';
import { generateBatchHints } from '@/ai/flows/generate-batch-hint-flow';
import { getFirestore, FieldValue } from '@/lib/firebase-admin';
import {
  levelToConstraints,
  normalizeWord,
  isValidWord,
  getFallbackWord,
  isThemeMatch,
  type WordConstraints,
} from './word-utils';
import { GenerateHintInput } from '@/ai/schemas/hint';

/**
 * Batch Processing System for Game AI
 * 
 * Features:
 * - Generate multiple words efficiently in a single batch
 * - Generate multiple hints in parallel
 * - Automatic deduplication and validation
 * - Fallback support for failed generations
 * - Performance metrics tracking
 */

export interface BatchWordGenerationResult {
  success: boolean;
  words?: Array<{ word: string; definition: string }>;
  generatedCount?: number;
  totalRequested?: number;
  message?: string;
  performanceMs?: number;
}

export interface BatchHintGenerationResult {
  success: boolean;
  hints?: Array<{
    word: string;
    hint: string;
    reasoning: string;
    chosenLetters: string[];
  }>;
  generatedCount?: number;
  totalRequested?: number;
  failedIndices?: number[];
  message?: string;
  performanceMs?: number;
}

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  modelCallTime?: number;
  validationTime?: number;
  durationMs?: number;
}

interface PerformanceReport {
  totalSingleCall: number;
  totalBatch: number;
  metricsCount: number;
  successRate: number;
}

const performanceState = {
  singleCallTotalMs: 0,
  singleCallCount: 0,
  batchTotalMs: 0,
  batchCount: 0,
  successCount: 0,
  totalRuns: 0,
};

function recordBatchMetrics(durationMs: number, success: boolean): void {
  performanceState.batchTotalMs += Math.max(0, durationMs);
  performanceState.batchCount += 1;
  performanceState.totalRuns += 1;
  if (success) {
    performanceState.successCount += 1;
  }
}

function recordSingleCallMetrics(durationMs: number, success: boolean): void {
  performanceState.singleCallTotalMs += Math.max(0, durationMs);
  performanceState.singleCallCount += 1;
  performanceState.totalRuns += 1;
  if (success) {
    performanceState.successCount += 1;
  }
}

export async function getPerformanceReport(): Promise<PerformanceReport> {
  const averageSingleCallMs =
    performanceState.singleCallCount > 0
      ? Math.round(performanceState.singleCallTotalMs / performanceState.singleCallCount)
      : 0;
  const averageBatchMs =
    performanceState.batchCount > 0
      ? Math.round(performanceState.batchTotalMs / performanceState.batchCount)
      : 0;
  const successRate =
    performanceState.totalRuns > 0
      ? Math.round((performanceState.successCount / performanceState.totalRuns) * 100)
      : 0;

  return {
    totalSingleCall: averageSingleCallMs,
    totalBatch: averageBatchMs,
    metricsCount: performanceState.totalRuns,
    successRate,
  };
}

// Get recent used words from Firebase (last 80)
async function getRecentUsedWords(userId: string | null): Promise<string[]> {
  if (!userId) {
    return [];
  }
  
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);

    const usedWordsRef = userProfileRef.collection('usedWords');
    const snapshot = await usedWordsRef
      .orderBy('createdAt', 'desc')
      .limit(80)
      .get();

    if (!snapshot.empty) {
      const recentWords = snapshot.docs
        .map(doc => doc.data()?.word)
        .map(word => (typeof word === 'string' ? normalizeWord(word) : ''))
        .filter(Boolean)
        .reverse();

      console.log('[getRecentUsedWords] Returning last', recentWords.length, 'words');
      return recentWords;
    }

    const userDoc = await userProfileRef.get();
    const usedWordsRaw = userDoc.data()?.usedWords;
    const usedWords = Array.isArray(usedWordsRaw)
      ? usedWordsRaw
          .map(word => (typeof word === 'string' ? normalizeWord(word) : ''))
          .filter(Boolean)
      : [];
    console.log('[getRecentUsedWords] Total used words in DB (legacy array):', usedWords.length);

    const recentWords = usedWords.slice(-80);
    console.log('[getRecentUsedWords] Returning last', recentWords.length, 'words (legacy)');

    if (usedWords.length > 100) {
      const trimmed = usedWords.slice(-100);
      await userProfileRef.set({ usedWords: trimmed }, { merge: true });
      console.log('[getRecentUsedWords] Trimmed usedWords to', trimmed.length);
    }

    return recentWords;
  } catch (error) {
    console.warn('[getRecentUsedWords] Error:', error);
    return [];
  }
}

// Save words to used words list
async function saveUsedWords(userId: string | null, words: string[]): Promise<void> {
  if (!userId) return;
  
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    const usedWordsRef = userProfileRef.collection('usedWords');

    const batch = firestore.batch();
    
    for (const word of words) {
      const normalizedWord = normalizeWord(word);
      if (!normalizedWord) continue;

      const docRef = usedWordsRef.doc();
      batch.set(docRef, {
        word: normalizedWord,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log('[saveUsedWords] Saved', words.length, 'words to subcollection');

    // Cleanup old documents
    await pruneUsedWordsCollection(usedWordsRef, 100);
  } catch (error) {
    console.warn('[saveUsedWords] Error:', error);
  }
}

async function pruneUsedWordsCollection(
  usedWordsRef: FirebaseFirestore.CollectionReference,
  keepCount: number
): Promise<void> {
  const pageSize = 50;
  while (true) {
    const snapshot = await usedWordsRef
      .orderBy('createdAt', 'desc')
      .offset(keepCount)
      .limit(pageSize)
      .get();

    if (snapshot.empty) {
      return;
    }

    const batch = usedWordsRef.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
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
 * Generate a batch of unique words efficiently
 * 
 * @param params - Configuration for batch generation
 * @returns Array of generated words with definitions and performance metrics
 */
export async function generateBatchUniqueWords(params: {
  batchSize: number;
  level: number;
  theme?: string;
  userId?: string | null;
  previousWords?: string[];
}): Promise<BatchWordGenerationResult> {
  const { batchSize, level, theme, userId, previousWords = [] } = params;
  const metrics: PerformanceMetrics = { startTime: Date.now() };
  let wasSuccessful = false;

  try {
    // Get deterministic constraints based on level
    const constraints = levelToConstraints(level);
    if (theme) {
      constraints.theme = theme;
    }
    
    console.log('[generateBatchUniqueWords] Batch size:', batchSize, 'Level:', level, 'Theme:', theme);
    
    // Get recent used words
    const recentUsedWords = await getRecentUsedWords(userId || null);
    const usedWordsSet = new Set(recentUsedWords.map(w => w.toLowerCase()));
    
    // Add previous words to avoid repeats
    for (const word of previousWords) {
      usedWordsSet.add(word.toLowerCase());
    }
    
    console.log('[generateBatchUniqueWords] Excluding', usedWordsSet.size, 'recent words');
    
    metrics.modelCallTime = Date.now();
    
    let batchResult: any = null;
    const maxAttempts = 2;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        batchResult = await generateBatchWords({
          batchSize,
          difficulty: constraints.difficulty,
          theme: theme as any || 'current',
          excludeWords: Array.from(usedWordsSet),
        });
        if (batchResult?.words?.length > 0) break;
      } catch (e: any) {
        const message = e?.message || '';
        if (shouldAbortAiRetries(message)) {
          console.warn('[generateBatchUniqueWords] Aborting retries due to terminal error:', message);
          throw e;
        }
        if (attempt === maxAttempts - 1) throw e;
        console.warn(`[generateBatchUniqueWords] AI Batch attempt ${attempt + 1} failed, retrying...`);
      }
    }

    metrics.modelCallTime = Date.now() - metrics.modelCallTime!;
    metrics.validationTime = Date.now();

    // Validate and filter results
    const validatedWords: Array<{ word: string; definition: string }> = [];
    const invalidWords: string[] = [];

    if (batchResult?.words) {
      for (const item of batchResult.words) {
        const normalized = normalizeWord(item.word);
        
        // Validate word
        if (!isValidWord(normalized, constraints)) {
          console.warn('[generateBatchUniqueWords] Invalid word:', item.word);
          invalidWords.push(item.word);
          continue;
        }

        // Check theme match
        if (!isThemeMatch(normalized, item.definition || '', theme)) {
          console.warn('[generateBatchUniqueWords] Word does not match theme:', theme, 'word:', normalized);
          invalidWords.push(item.word);
          continue;
        }
        
        // Check if already used
        if (usedWordsSet.has(normalized)) {
          console.warn('[generateBatchUniqueWords] Word already used:', normalized);
          invalidWords.push(item.word);
          continue;
        }
        
        // Add to result
        validatedWords.push({
          word: normalized,
          definition: item.definition,
        });
        usedWordsSet.add(normalized);
      }
    }

    metrics.validationTime = Date.now() - metrics.validationTime!;
    metrics.endTime = Date.now();
    metrics.durationMs = metrics.endTime - metrics.startTime;

    // If we need more words and have some validated ones, use fallback for the rest
    let finalWords = validatedWords;
    if (validatedWords.length < batchSize) {
      console.log('[generateBatchUniqueWords] Generated', validatedWords.length, '/', batchSize, 'words. Using fallback for rest.');
      
      const needed = batchSize - validatedWords.length;
      for (let i = 0; i < needed; i++) {
        const fallback = getFallbackWord(constraints, usedWordsSet, theme || 'current');
        finalWords.push(fallback);
        usedWordsSet.add(fallback.word);
      }
    }

    // Save all valid words
    await saveUsedWords(userId || null, finalWords.map(w => w.word));

    wasSuccessful = true;
    return {
      success: true,
      words: finalWords,
      generatedCount: finalWords.length,
      totalRequested: batchSize,
      performanceMs: metrics.durationMs,
    };

  } catch (error: any) {
    const message = error?.message || String(error);
    console.error('[generateBatchUniqueWords] Error:', message);
    
    metrics.endTime = Date.now();
    metrics.durationMs = metrics.endTime - metrics.startTime;

    return {
      success: false,
      message: `Batch generation failed: ${message}`,
      generatedCount: 0,
      totalRequested: batchSize,
      performanceMs: metrics.durationMs,
    };
  } finally {
    recordBatchMetrics(metrics.durationMs || 0, wasSuccessful);
  }
}

/**
 * Generate a batch of hints for multiple words efficiently
 * 
 * @param hints - Array of hint generation requests
 * @returns Array of generated hints with performance metrics
 */
export async function generateBatchHintsOptimized(params: {
  hints: GenerateHintInput[];
}): Promise<BatchHintGenerationResult> {
  const { hints } = params;
  const metrics: PerformanceMetrics = { startTime: Date.now() };
  let wasSuccessful = false;

  try {
    console.log('[generateBatchHintsOptimized] Generating', hints.length, 'hints');
    
    metrics.modelCallTime = Date.now();
    
    // Request batch from AI
    const batchResult = await generateBatchHints({
      hints,
    });

    metrics.modelCallTime = Date.now() - metrics.modelCallTime!;
    metrics.endTime = Date.now();
    metrics.durationMs = metrics.endTime - metrics.startTime;

    // Enrich hints with word information
    const enrichedHints = (batchResult.hints || []).map((hint, index) => ({
      word: hints[index]?.word || 'unknown',
      hint: hint.hint,
      reasoning: hint.reasoning,
      chosenLetters: hint.chosenLetters,
    }));

    wasSuccessful = true;
    return {
      success: true,
      hints: enrichedHints,
      generatedCount: batchResult.generatedCount,
      totalRequested: batchResult.totalRequested,
      failedIndices: batchResult.failedIndices,
      performanceMs: metrics.durationMs,
    };

  } catch (error: any) {
    const message = error?.message || String(error);
    console.error('[generateBatchHintsOptimized] Error:', message);
    
    metrics.endTime = Date.now();
    metrics.durationMs = metrics.endTime - metrics.startTime;

    return {
      success: false,
      message: `Batch hint generation failed: ${message}`,
      generatedCount: 0,
      totalRequested: hints.length,
      performanceMs: metrics.durationMs,
    };
  } finally {
    recordBatchMetrics(metrics.durationMs || 0, wasSuccessful);
  }
}

/**
 * Performance analysis helper - Compare single-call vs batch performance
 */
export interface PerformanceAnalysis {
  operationType: 'single-call' | 'batch';
  totalItems: number;
  totalDurationMs: number;
  averagePerItemMs: number;
  modelCallMs?: number;
  validationMs?: number;
}

function analyzePerformance(
  metrics: PerformanceMetrics,
  itemCount: number,
  operationType: 'single-call' | 'batch' = 'single-call'
): PerformanceAnalysis {
  return {
    operationType,
    totalItems: itemCount,
    totalDurationMs: metrics.durationMs || 0,
    averagePerItemMs: Math.round((metrics.durationMs || 0) / itemCount),
    modelCallMs: metrics.modelCallTime,
    validationMs: metrics.validationTime,
  };
}
