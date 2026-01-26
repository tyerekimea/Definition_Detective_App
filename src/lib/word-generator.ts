'use server';

import { generateWord as aiGenerateWord } from '@/ai/flows/generate-word-flow';
import { initAdminApp } from '@/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Robust Word Generator with Deterministic Control
 * 
 * Features:
 * - Tracks used words per user
 * - Multiple retry attempts with fallback
 * - Deterministic difficulty progression
 * - Validation and normalization
 */

interface WordConstraints {
  minLen: number;
  maxLen: number;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: string;
}

interface GenerateWordResult {
  success: boolean;
  word?: string;
  definition?: string;
  message?: string;
}

// Deterministic difficulty mapping based on level
export function levelToConstraints(level: number): WordConstraints {
  if (level <= 5) {
    return { minLen: 4, maxLen: 6, difficulty: 'easy' };
  }
  if (level <= 10) {
    return { minLen: 5, maxLen: 7, difficulty: 'easy' };
  }
  if (level <= 15) {
    return { minLen: 6, maxLen: 8, difficulty: 'medium' };
  }
  if (level <= 20) {
    return { minLen: 7, maxLen: 9, difficulty: 'medium' };
  }
  if (level <= 30) {
    return { minLen: 8, maxLen: 10, difficulty: 'hard' };
  }
  return { minLen: 9, maxLen: 12, difficulty: 'hard' };
}

// Normalize word (lowercase, trim, remove special chars)
function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-z]/g, '');
}

// Validate word meets constraints
function isValidWord(word: string, constraints: WordConstraints): boolean {
  if (!word || typeof word !== 'string') return false;
  
  const normalized = normalizeWord(word);
  if (normalized.length < constraints.minLen) return false;
  if (normalized.length > constraints.maxLen) return false;
  if (!/^[a-z]+$/.test(normalized)) return false; // Only letters
  
  return true;
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

// Fallback word list (deterministic backup)
const FALLBACK_WORDS: Record<string, { word: string; definition: string }[]> = {
  easy: [
    { word: 'apple', definition: 'A round fruit with red or green skin and crisp flesh.' },
    { word: 'beach', definition: 'A sandy or pebbly shore by the ocean or lake.' },
    { word: 'cloud', definition: 'A visible mass of water droplets suspended in the atmosphere.' },
    { word: 'dance', definition: 'To move rhythmically to music.' },
    { word: 'eagle', definition: 'A large bird of prey with keen vision.' },
    { word: 'flame', definition: 'A hot glowing body of ignited gas.' },
    { word: 'grape', definition: 'A small round fruit that grows in clusters.' },
    { word: 'house', definition: 'A building for human habitation.' },
    { word: 'island', definition: 'A piece of land surrounded by water.' },
    { word: 'jungle', definition: 'A dense tropical forest.' },
  ],
  medium: [
    { word: 'balance', definition: 'An even distribution of weight or amount.' },
    { word: 'capture', definition: 'To take into custody or gain control of.' },
    { word: 'deliver', definition: 'To bring and hand over to the proper recipient.' },
    { word: 'embrace', definition: 'To hold closely in one\'s arms.' },
    { word: 'fortune', definition: 'Chance or luck as an external force.' },
    { word: 'genuine', definition: 'Truly what it is said to be; authentic.' },
    { word: 'harmony', definition: 'Agreement or concord in feeling or action.' },
    { word: 'inspire', definition: 'To fill with the urge or ability to do something.' },
    { word: 'journey', definition: 'An act of traveling from one place to another.' },
    { word: 'kingdom', definition: 'A country ruled by a king or queen.' },
  ],
  hard: [
    { word: 'abundance', definition: 'A very large quantity of something.' },
    { word: 'benevolent', definition: 'Well-meaning and kindly.' },
    { word: 'catastrophe', definition: 'A sudden disaster or misfortune.' },
    { word: 'diligent', definition: 'Having or showing care in one\'s work.' },
    { word: 'eloquent', definition: 'Fluent or persuasive in speaking or writing.' },
    { word: 'formidable', definition: 'Inspiring fear or respect through being powerful.' },
    { word: 'gratitude', definition: 'The quality of being thankful.' },
    { word: 'hypothesis', definition: 'A proposed explanation based on limited evidence.' },
    { word: 'illuminate', definition: 'To light up or make clear.' },
    { word: 'jubilant', definition: 'Feeling or expressing great happiness.' },
  ],
};

// Get fallback word (deterministic)
function getFallbackWord(
  constraints: WordConstraints,
  usedWords: Set<string>
): { word: string; definition: string } {
  const pool = FALLBACK_WORDS[constraints.difficulty] || FALLBACK_WORDS.easy;
  
  // Find first unused word in fallback pool
  for (const item of pool) {
    if (!usedWords.has(item.word.toLowerCase())) {
      return item;
    }
  }
  
  // If all fallback words used, return random one (rare case)
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
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
  const recentUsedWords = await getRecentUsedWords(userId);
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
      await saveUsedWord(userId, normalized);
      
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
  await saveUsedWord(userId, fallback.word);
  
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
