// Mock implementation for generate-batch-hint-flow.ts - used during mobile builds

export async function generateBatchHints(params: {
  hints: Array<{
    word: string;
    incorrectGuesses: string;
    lettersToReveal: number;
  }>;
}) {
  console.warn('[Mobile] AI batch hint generation not available in offline mode');
  
  const hints = (params.hints || []).map(h => ({
    word: h.word,
    hint: h.word.charAt(0) + '_'.repeat(h.word.length - 1),
    reasoning: 'Offline mode - revealing first letter',
    chosenLetters: [h.word.charAt(0)],
  }));

  return {
    hints,
    generatedCount: hints.length,
    totalRequested: params.hints?.length || 0,
    failedIndices: [],
  };
}