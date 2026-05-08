// Mock implementation for word-generator.ts - used during mobile builds

import { wordList } from '@/lib/game-data';

export async function generateUniqueWord(params: any) {
  // Return a random word from the word list for fallback
  const randomIndex = Math.floor(Math.random() * wordList.length);
  const word = wordList[randomIndex];
  console.warn('[Mobile] Using offline word fallback:', word);
  return {
    success: true,
    word: word.word,
    definition: word.definition || 'Word from offline database',
  };
}

export async function clearUserWordHistory(userId: string): Promise<{ success: boolean }> {
  console.warn('[Mobile] Word history clearing not available in offline mode');
  return { success: false };
}

export async function getUserWordHistory(userId: string): Promise<any[]> {
  console.warn('[Mobile] Word history retrieval not available in offline mode');
  return [];
}

