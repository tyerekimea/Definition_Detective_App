'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Input Schema
 */
const SmartHintInputSchema = z.object({
  word: z.string(),
  incorrectGuesses: z.string(),
  lettersToReveal: z.number(),
});

export type SmartHintInput = z.infer<typeof SmartHintInputSchema>;

/**
 * Output Schema
 */
const SmartHintOutputSchema = z.object({
  hint: z.string(),
});

export type SmartHintOutput = z.infer<typeof SmartHintOutputSchema>;

/**
 * Prompt
 */
const smartHintPrompt = ai.definePrompt({
  name: 'smartHintPrompt',
  input: { schema: SmartHintInputSchema },
  output: { schema: SmartHintOutputSchema },
  prompt: `
You are an AI assistant helping with smart word puzzle hints.

Word: "{{{word}}}"
Incorrect guesses: "{{{incorrectGuesses}}}"
Letters to reveal: "{{{lettersToReveal}}}"

Rules:
- Reveal ONLY the requested number of letters.
- Do NOT reveal letters in incorrect guesses.
- Other letters must remain "_".
- Return ONLY valid JSON:

{ "hint": "e_a__p_e" }

Produce the hint now.
  `,
});

/**
 * Flow
 */
export const smartHint = ai.defineFlow(
  {
    name: 'smartHint',
    inputSchema: SmartHintInputSchema,
    outputSchema: SmartHintOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await smartHintPrompt(input);

      if (output?.hint) return output;

      // If Gemini returns raw string instead of object
      if (typeof output === 'string') {
        try {
          const parsed = JSON.parse(output);
          return { hint: parsed.hint ?? '' };
        } catch {
          throw new Error('AI returned invalid JSON.');
        }
      }

      throw new Error('AI did not return a valid hint.');
    } catch (err) {
      console.error('❌ Smart Hint Flow Error:', err);
      throw new Error('Hint is not available right now.');
    }
  }
);
