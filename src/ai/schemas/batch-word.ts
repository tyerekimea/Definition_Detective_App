import { z } from 'zod';
import { GenerateWordInputSchema, GenerateWordOutputSchema } from './word';

export const BatchGenerateWordInputSchema = z.object({
  batchSize: z
    .number()
    .min(1)
    .max(10)
    .describe('Number of words to generate (1-10)'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level for words to be generated.'),
  theme: z
    .enum(['current', 'science-safari', 'history-quest', 'geo-genius'])
    .optional()
    .describe('The theme for word generation. Defaults to "current" (general vocabulary).'),
  excludeWords: z
    .array(z.string())
    .optional()
    .describe('Array of words to exclude (words the user has already seen).'),
  excludeWordsString: z
    .string()
    .optional()
    .describe('Comma-separated list of words to exclude (prompt helper).'),
});
export type BatchGenerateWordInput = z.infer<typeof BatchGenerateWordInputSchema>;

export const BatchGenerateWordOutputSchema = z.object({
  words: z
    .array(GenerateWordOutputSchema)
    .describe('Array of generated words with their definitions'),
  generatedCount: z
    .number()
    .describe('Number of words successfully generated'),
  totalRequested: z
    .number()
    .describe('Total words that were requested'),
});
export type BatchGenerateWordOutput = z.infer<typeof BatchGenerateWordOutputSchema>;
