'use server';

import { generateWord as aiGenerateWord } from '@/ai/flows/generate-word-flow';
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  levelToConstraints,
  normalizeWord,
  isValidWord,
  getFallbackWord,
  type WordConstraints,
} from './word-utils';

// Initialize Firebase Admin
function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

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
  if (!userId) return [];
  
  try {
    initAdminApp();
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    const userDoc = await userProfileRef.get();
    
    if (!userDoc.exists) return [];
    
    const usedWords = userDoc.data()?.usedWords || [];
    // Keep only last 80 words for prompt efficiency
    return usedWords.slice(-80);
  } catch (error) {
    console.warn('[getRecentUsedWords] Error:', error);
    return [];
  }
}

// Save word to used words list
async function saveUsedWord(userId: string | null, word: string): Promise<void> {
  if (!userId) return;
  
  try {
    initAdminApp();
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    
    const userDoc = await userProfileRef.get();
    const currentUsedWords = userDoc.exists ? (userDoc.data()?.usedWords || []) : [];
    
    // Add new word and keep only last 100 words
    const updatedUsedWords = [...currentUsedWords, word.toLowerCase()].slice(-100);
    
    await userProfileRef.update({
      usedWords: updatedUsedWords,
    });
    
    console.log('[saveUsedWord] Saved word, total used:', updatedUsedWords.length);
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
      
      // Call AI with constraints and exclusions
      const result = await aiGenerateWord({
        difficulty: constraints.difficulty,
        theme: theme as any || 'current',
        excludeWords: Array.from(usedWordsSet),
      });
      
      if (!result || !result.word) {
        console.warn('[generateUniqueWord] AI returned no word');
        continue;
      }
      
      const normalized = normalizeWord(result.word);
      
      // Validate word
      if (!isValidWord(normalized, constraints)) {
        console.warn('[generateUniqueWord] Invalid word:', result.word, 'normalized:', normalized);
        continue;
      }
      
      // Check if already used
      if (usedWordsSet.has(normalized)) {
        console.warn('[generateUniqueWord] Word already used:', normalized);
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
  
  const fallback = getFallbackWord(constraints, usedWordsSet);
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
    initAdminApp();
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
