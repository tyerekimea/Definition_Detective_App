import { z } from 'zod';

export const GenerateWordInputSchema = z.object({
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level for the word to be generated.'),
});
export type GenerateWordInput = z.infer<typeof GenerateWordInputSchema>;

export const GenerateWordOutputSchema = z.object({
  word: z.string().describe('The generated word.'),
  definition: z.string().describe('The definition of the generated word.'),
});
export type GenerateWordOutput = z.infer<typeof GenerateWordOutputSchema>;
