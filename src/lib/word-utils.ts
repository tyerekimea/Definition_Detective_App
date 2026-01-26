/**
 * Word Generation Utilities
 * Pure functions that don't need 'use server'
 */

export interface WordConstraints {
  minLen: number;
  maxLen: number;
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: string;
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
export function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-z]/g, '');
}

// Validate word meets constraints
export function isValidWord(word: string, constraints: WordConstraints): boolean {
  if (!word || typeof word !== 'string') return false;
  
  const normalized = normalizeWord(word);
  if (normalized.length < constraints.minLen) return false;
  if (normalized.length > constraints.maxLen) return false;
  if (!/^[a-z]+$/.test(normalized)) return false; // Only letters
  
  return true;
}

// Fallback word list (deterministic backup)
export const FALLBACK_WORDS: Record<string, { word: string; definition: string }[]> = {
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
export function getFallbackWord(
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
