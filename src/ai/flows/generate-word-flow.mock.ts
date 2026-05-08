// Mock implementation for generate-word-flow.ts - used during mobile builds

import { wordList } from '@/lib/game-data';

export async function generateWord(params: any) {
  console.warn('[Mobile] AI word generation not available in offline mode');
  // Return a random word from the word list as fallback
  if (wordList.length > 0) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const wordData = wordList[randomIndex];
    return {
      word: wordData.word,
      definition: wordData.definition || 'Word from offline database',
    };
  }
  return { word: 'offline', definition: 'Device is in offline mode' };
}
