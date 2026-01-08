
'use server';

import { ai } from '@/ai/genkit';
import {
  GenerateHintInput,
  GenerateHintOutput,
  GenerateHintInputSchema,
  GenerateHintOutputSchema,
} from '@/ai/schemas/hint';

export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: { schema: GenerateHintInputSchema },
  output: { schema: GenerateHintOutputSchema, format: 'json' },
  prompt: `You are an AI assistant for a word puzzle game. Your task is to provide a "smart hint".
The user gives you a secret word, a string of letters they have already guessed incorrectly, and a number of letters to reveal.

Rules:
1. Your response MUST adhere to the provided JSON schema.
2. The value of "hint" should be a string representing the secret word.
3. In this string, exactly {{lettersToReveal}} letters of the secret word should be revealed.
4. All other letters MUST be represented by an underscore "_".
5. You MUST NOT reveal any letters that the user has already guessed incorrectly ("{{incorrectGuesses}}"). Choose other letters to reveal.

Here is the data for this request:
- Secret Word: "{{word}}"
- Incorrect Guesses: "{{incorrectGuesses}}"
- Letters to Reveal: {{lettersToReveal}}

Produce the JSON response now.`,
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async input => {
    // Try multiple model candidates
    const defaultCandidates = [
      'googleai/gemini-2.0-flash-exp',      // Working! (Experimental)
      'googleai/gemini-1.5-flash',          // Try without -latest
      'googleai/gemini-1.5-pro',            // Try without -latest
      'googleai/gemini-pro'                 // Stable fallback
    ];

    let lastErr: any = null;
    for (const candidate of defaultCandidates) {
      try {
        console.debug('[generateHintFlow] trying model candidate:', candidate);
        const { output } = await prompt(input, { model: candidate });
        if (!output) {
          lastErr = new Error('AI returned no output.');
          continue;
        }
        console.debug('[generateHintFlow] model worked:', candidate);
        return output;
      } catch (err: any) {
        lastErr = err;
        const msg = err?.originalMessage ?? err?.message ?? String(err);
        const notFound = /not found/i.test(msg) || /NOT_FOUND/.test(msg);
        if (notFound) {
          console.debug('[generateHintFlow] model not found:', candidate, '— trying next');
          continue;
        }
        // For other errors, throw immediately
        throw new Error(`AI hint generation failed for model "${candidate}": ${msg}`);
      }
    }

    // If we get here, all models failed
    const tried = defaultCandidates.join(', ');
    const finalMsg = lastErr?.originalMessage ?? lastErr?.message ?? String(lastErr ?? 'no response');
    throw new Error(
      `AI hint generation failed — tried models: [${tried}]. Last error: ${finalMsg}`
    );
  }
);
