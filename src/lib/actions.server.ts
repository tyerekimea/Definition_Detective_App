
'use server';

import { getFirestore } from '@/lib/firebase-admin';
import { generateHint } from '@/ai/flows/generate-hints.server';
import type { GenerateHintInput } from '@/ai/schemas/hint';
import type { WordTheme } from '@/lib/game-data';
import { hasPremiumAccess } from '@/lib/subscription';

export async function useHintAction(data: GenerateHintInput & { userId?: string | null, isFree?: boolean }): Promise<{ success: boolean; message?: string; hint?: string; }> {
  try {
    // Only check Firebase for paid hints (not free hints)
    if (!data.isFree && data.userId) {
      try {
        const firestore = getFirestore();
        const userProfileRef = firestore.collection('userProfiles').doc(data.userId);

        const transactionResult = await firestore.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userProfileRef);

          if (!userDoc.exists) {
            throw new Error('User profile not found.');
          }

          const userData = userDoc.data() || {};
          const isPremium = hasPremiumAccess(userData);

          // Premium users have unlimited hints, do not decrement.
          if (isPremium) {
            return { success: true };
          }

          const currentHints = userData.hints ?? 0;

          if (currentHints <= 0) {
            return { success: false, message: "You don't have any hints left." };
          }

          transaction.update(userProfileRef, { hints: currentHints - 1 });
          
          return { success: true };
        });

        if (!transactionResult.success) {
          return { success: false, message: transactionResult.message };
        }
      } catch (firebaseError: any) {
        console.error('Firebase error in useHintAction:', firebaseError);
        // If Firebase fails, we can still generate the hint but log the error
        // This prevents Firebase issues from blocking hint generation
        console.warn('Continuing with hint generation despite Firebase error');
      }
    }

    // Generate the hint (works for both free and paid hints)
    const hintResult = await generateHint({
      ...data,
      wordLength: data.word.length,
    });
    
    if (hintResult && hintResult.hint) {
      return { success: true, ...hintResult };
    }
    
    throw new Error('AI did not return a valid hint format.');

  } catch (error: any) {
    console.error('Error in useHintAction:', error);
    const rawMessage = error?.message || 'An unexpected error occurred while getting a hint.';
    const isProviderError = /AI hint generation failed|tried models|generateContent|Forbidden|API key|quota|authentication|timed out/i.test(rawMessage);
    return {
      success: false,
      message: isProviderError
        ? 'Hint service is temporarily unavailable. Please try again shortly.'
        : rawMessage,
    };
  }
}

// Generate word with theme and exclude used words
// Uses the optimized single-call generator for real-time gameplay
export async function generateWordWithTheme(params: {
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: WordTheme;
  userId?: string | null;
  level?: number;
  previousWord?: string;
}): Promise<{ success: boolean; word?: string; definition?: string; message?: string }> {
  try {
    // Import the optimized generator
    const { generateOptimizedWord } = await import('./optimized-word-generator.server');
    
    // Use level-based constraints if level provided, otherwise map difficulty
    const level = params.level || (
      params.difficulty === 'easy' ? 3 :
      params.difficulty === 'medium' ? 10 :
      20
    );
    
    console.log('[generateWordWithTheme] Generating word for level:', level, 'theme:', params.theme);
    
    const result = await generateOptimizedWord({
      level,
      theme: (params.theme as any) || 'current',
      userId: params.userId,
      previousWord: params.previousWord,
    });

    console.log(
      '[generateWordWithTheme] Generation result:',
      result.success ? `success word=${result.word ?? 'n/a'}` : `failed message=${result.message ?? 'n/a'}`
    );
    
    return result;
  } catch (error: any) {
    console.error('Error in generateWordWithTheme:', error);
    return {
      success: false,
      message: error.message || 'Failed to generate word',
    };
  }
}

// Clear used words (useful if user gets stuck with same words)
async function deleteUsedWordsSubcollection(
  userProfileRef: FirebaseFirestore.DocumentReference
): Promise<void> {
  const usedWordsRef = userProfileRef.collection('usedWords');
  const pageSize = 50;
  while (true) {
    const snapshot = await usedWordsRef.limit(pageSize).get();
    if (snapshot.empty) return;

    const batch = usedWordsRef.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

export async function clearUsedWords(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);

    await userProfileRef.update({
      usedWords: [],
    });
    await deleteUsedWordsSubcollection(userProfileRef);

    return {
      success: true,
      message: 'Used words cleared successfully',
    };
  } catch (error: any) {
    console.error('Error clearing used words:', error);
    return {
      success: false,
      message: error.message || 'Failed to clear used words',
    };
  }
}

// Update user's selected theme
export async function updateUserTheme(params: {
  userId: string;
  theme: WordTheme;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(params.userId);

    await userProfileRef.update({
      selectedTheme: params.theme,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateUserTheme:', error);
    return {
      success: false,
      message: error.message || 'Failed to update theme',
    };
  }
}

// Get user's theme preference
export async function getUserTheme(userId: string): Promise<{ theme: WordTheme; isPremium: boolean }> {
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    const userDoc = await userProfileRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        theme: (userData?.selectedTheme as WordTheme) || 'current',
        isPremium: hasPremiumAccess(userData),
      };
    }

    return { theme: 'current', isPremium: false };
  } catch (error: any) {
    console.error('Error in getUserTheme:', error);
    return { theme: 'current', isPremium: false };
  }
}

// Initialize a level with batch-preloaded words for smooth gameplay
// Generates 5-10 words upfront during level start
export async function initializeLevelWithBatch(params: {
  level: number;
  theme?: WordTheme;
  userId?: string | null;
  preloadCount?: number;
}): Promise<{ success: boolean; words?: Array<{ word: string; definition: string }>; message?: string; performanceMs?: number }> {
  try {
    const { generateBatchUniqueWords } = await import('./batch-word-generator.server');
    
    const count = Math.min(params.preloadCount || 8, 10); // Max 10 per batch
    console.log('[initializeLevelWithBatch] Preloading', count, 'words for level', params.level);
    
    const result = await generateBatchUniqueWords({
      batchSize: count,
      level: params.level,
      theme: (params.theme as any) || 'current',
      userId: params.userId,
    });
    
    if (result.success && result.words) {
      console.log('[initializeLevelWithBatch] Successfully preloaded', result.generatedCount, 'words in', result.performanceMs, 'ms');
      return {
        success: true,
        words: result.words,
        performanceMs: result.performanceMs,
      };
    }
    
    return {
      success: false,
      message: result.message || 'Failed to preload words',
    };
  } catch (error: any) {
    console.error('Error in initializeLevelWithBatch:', error);
    return {
      success: false,
      message: error.message || 'Failed to initialize level',
    };
  }
}

// Background preloading function - call this while player is active
// Returns preloaded words to queue for smoother gameplay
export async function preloadNextWordsInBackground(params: {
  level: number;
  theme?: WordTheme;
  userId?: string | null;
  count?: number;
}): Promise<{ success: boolean; words?: Array<{ word: string; definition: string }>; performanceMs?: number }> {
  try {
    const { generateBatchUniqueWords } = await import('./batch-word-generator.server');
    
    const count = Math.min(params.count || 3, 5); // Smaller batch for background
    
    const result = await generateBatchUniqueWords({
      batchSize: count,
      level: params.level,
      theme: (params.theme as any) || 'current',
      userId: params.userId,
    });
    
    if (result.success && result.words) {
      console.log('[preloadNextWordsInBackground] Preloaded', result.generatedCount, 'words');
      return {
        success: true,
        words: result.words,
        performanceMs: result.performanceMs,
      };
    }
    
    return {
      success: false,
    };
  } catch (error: any) {
    console.warn('[preloadNextWordsInBackground] Background preload failed (non-critical):', error.message);
    return {
      success: false,
    };
  }
}

// Get performance metrics for AI generation (for optimization monitoring)
export async function getGenerationMetrics(): Promise<{
  success: boolean;
  metrics?: {
    timestamp: number;
    averageSingleCallMs: number;
    averageBatchMs: number;
    totalGenerations: number;
    successRate: number;
  };
  message?: string;
}> {
  try {
    const { getPerformanceReport } = await import('./batch-word-generator.server');
    
    const report = await getPerformanceReport();
    
    return {
      success: true,
      metrics: {
        timestamp: Date.now(),
        averageSingleCallMs: report.totalSingleCall,
        averageBatchMs: report.totalBatch,
        totalGenerations: report.metricsCount,
        successRate: report.successRate,
      },
    };
  } catch (error: any) {
    console.error('Error getting generation metrics:', error);
    return {
      success: false,
      message: error.message || 'Failed to get metrics',
    };
  }
}

// Generate batch hints for multiplayer or rapid hint requests
export async function generateBatchHintsAction(params: {
  hints: Array<{
    word: string;
    incorrectGuesses: string;
    lettersToReveal: number;
  }>;
}): Promise<{ success: boolean; hints?: any[]; message?: string; performanceMs?: number }> {
  try {
    const { generateBatchHintsOptimized } = await import('./batch-word-generator.server');
    
    const hintRequests = params.hints.map((h) => ({
      word: h.word,
      wordLength: h.word.length,
      incorrectGuesses: h.incorrectGuesses,
      lettersToReveal: h.lettersToReveal,
    }));
    
    const result = await generateBatchHintsOptimized({
      hints: hintRequests,
    });
    
    if (result.success && result.hints) {
      console.log('[generateBatchHintsAction] Generated', result.generatedCount, 'hints in', result.performanceMs, 'ms');
      return {
        success: true,
        hints: result.hints,
        performanceMs: result.performanceMs,
      };
    }
    
    return {
      success: false,
      message: result.message || 'Failed to generate hints',
    };
  } catch (error: any) {
    console.error('Error in generateBatchHintsAction:', error);
    return {
      success: false,
      message: error.message || 'Failed to generate batch hints',
    };
  }
}
