'use server';

import { generateWord as aiGenerateWord } from '@/ai/flows/generate-word-flow';
import { getFirestore, FieldValue } from '@/lib/firebase-admin';
import {
  levelToConstraints,
  normalizeWord,
  isValidWord,
  getFallbackWord,
  isThemeMatch,
  type WordConstraints,
} from './word-utils';

/**
 * Robust Word Generator with Deterministic Control
 * 
 * Features:
 * - Tracks used words per user
 * - Multiple retry attempts with fallback
 * - Deterministic difficulty progression
 * - Validation and normalization
 */

interface GenerateWordResult {
  success: boolean;
  word?: string;
  definition?: string;
  message?: string;
}

// Get recent used words from Firebase (last 80)
async function getRecentUsedWords(userId: string | null): Promise<string[]> {
  if (!userId) {
    return [];
  }
  
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    const userDoc = await userProfileRef.get();
    
    // New storage: subcollection userProfiles/{userId}/usedWords
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
        .reverse(); // keep chronological order

      console.log('[getRecentUsedWords] Returning last', recentWords.length, 'words');
      console.log('[getRecentUsedWords] Recent words:', recentWords.slice(-10)); // Show last 10
      return recentWords;
    }

    // Fallback: legacy array on user profile
    const usedWordsRaw = userDoc.data()?.usedWords;
    const usedWords = Array.isArray(usedWordsRaw)
      ? usedWordsRaw
          .map(word => (typeof word === 'string' ? normalizeWord(word) : ''))
          .filter(Boolean)
      : [];
    console.log('[getRecentUsedWords] Total used words in DB (legacy array):', usedWords.length);

    // Keep only last 80 words for prompt efficiency
    const recentWords = usedWords.slice(-80);
    console.log('[getRecentUsedWords] Returning last', recentWords.length, 'words (legacy)');
    console.log('[getRecentUsedWords] Recent words:', recentWords.slice(-10)); // Show last 10

    // If the legacy array is oversized, trim it to reduce document bloat.
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

// Save word to used words list
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

    await pruneUsedWordsCollection(usedWordsRef, 100);
    console.log('[saveUsedWord] Saved word to subcollection');
  } catch (error) {
    console.warn('[saveUsedWord] Error:', error);
  }
}



/**
 * Generate a unique word with robust retry logic
 */
export async function generateUniqueWord(params: {
  level: number;
  theme?: string;
  userId?: string | null;
  previousWord?: string;
}): Promise<GenerateWordResult> {
  const { level, theme, userId, previousWord } = params;
  
  // Get deterministic constraints based on level
  const constraints = levelToConstraints(level);
  if (theme) {
    constraints.theme = theme;
  }
  
  console.log('[generateUniqueWord] Level:', level, 'Constraints:', constraints);
  
  // Get recent used words
  const recentUsedWords = await getRecentUsedWords(userId || null);
  const usedWordsSet = new Set(recentUsedWords.map(w => w.toLowerCase()));
  
  // Add previous word to avoid immediate repeat
  if (previousWord) {
    usedWordsSet.add(previousWord.toLowerCase());
  }
  
  console.log('[generateUniqueWord] Excluding', usedWordsSet.size, 'recent words');
  
  // Retry loop: 5 attempts with AI
  const maxAttempts = 5;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`[generateUniqueWord] Attempt ${attempt + 1}/${maxAttempts}`);
      console.log(`[generateUniqueWord] Excluding ${usedWordsSet.size} words from AI`);
      
      // Call AI with constraints and exclusions
      const result = await aiGenerateWord({
        difficulty: constraints.difficulty,
        theme: theme as any || 'current',
        excludeWords: Array.from(usedWordsSet),
      });
      
      console.log('[generateUniqueWord] AI returned:', result);
      
      if (!result || !result.word) {
        console.warn('[generateUniqueWord] AI returned no word');
        continue;
      }
      
      const normalized = normalizeWord(result.word);
      console.log('[generateUniqueWord] Normalized word:', normalized);
      
      // Validate word
      if (!isValidWord(normalized, constraints)) {
        console.warn('[generateUniqueWord] Invalid word:', result.word, 'normalized:', normalized, 'constraints:', constraints);
        continue;
      }

      // Ensure word matches the selected theme
      if (!isThemeMatch(normalized, result.definition || '', theme)) {
        console.warn('[generateUniqueWord] Word does not match theme:', theme, 'word:', normalized);
        continue;
      }
      
      // Check if already used
      if (usedWordsSet.has(normalized)) {
        console.warn('[generateUniqueWord] Word already used:', normalized);
        console.warn('[generateUniqueWord] Used words set contains:', Array.from(usedWordsSet).slice(-20));
        continue;
      }
      
      // Success! Save and return
      console.log('[generateUniqueWord] Success! Word:', normalized);
      await saveUsedWord(userId || null, normalized);
      
      return {
        success: true,
        word: normalized,
        definition: result.definition,
      };
      
    } catch (error: any) {
      console.error(`[generateUniqueWord] Attempt ${attempt + 1} error:`, error.message);
      
      // Continue to next attempt
      if (attempt < maxAttempts - 1) {
        continue;
      }
    }
  }
  
  // All AI attempts failed - use deterministic fallback
  console.warn('[generateUniqueWord] All AI attempts failed, using fallback');
  
  const fallback = getFallbackWord(constraints, usedWordsSet, theme || 'current');
  await saveUsedWord(userId || null, fallback.word);
  
  return {
    success: true,
    word: fallback.word,
    definition: fallback.definition,
  };
}

/**
 * Clear used words for a user (useful for testing or reset)
 */
export async function clearUserWordHistory(userId: string): Promise<{ success: boolean }> {
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    
    await userProfileRef.update({
      usedWords: [],
    });
    
    return { success: true };
  } catch (error) {
    console.error('[clearUserWordHistory] Error:', error);
    return { success: false };
  }
}
