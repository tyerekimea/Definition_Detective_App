// Mock implementation for generate-hints.ts - used during mobile builds

export async function generateHint(data: any) {
  console.warn('[Mobile] AI hint generation not available in offline mode');
  // Return a deterministic hint - reveal first letter
  const word = data.word || '';
  const hint = word.length > 0 ? word.charAt(0) + '_'.repeat(word.length - 1) : '';
  return {
    reasoning: 'Offline mode - revealing first letter',
    chosenLetters: word.length > 0 ? [word.charAt(0)] : [],
    hint,
  };
}
