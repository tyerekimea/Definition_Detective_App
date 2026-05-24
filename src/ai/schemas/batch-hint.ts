import { z } from 'zod';
import { GenerateHintInputSchema, GenerateHintOutputSchema } from './hint';

export const BatchGenerateHintInputSchema = z.object({
  hints: z
    .array(GenerateHintInputSchema)
    .min(1)
    .max(10)
    .describe('Array of hint generation requests'),
});
export type BatchGenerateHintInput = z.infer<typeof BatchGenerateHintInputSchema>;

export const BatchGenerateHintOutputSchema = z.object({
  hints: z
    .array(GenerateHintOutputSchema)
    .describe('Array of generated hints'),
  generatedCount: z
    .number()
    .describe('Number of hints successfully generated'),
  totalRequested: z
    .number()
    .describe('Total hints that were requested'),
  failedIndices: z
    .array(z.number())
    .optional()
    .describe('Indices of hints that failed to generate'),
});
export type BatchGenerateHintOutput = z.infer<typeof BatchGenerateHintOutputSchema>;
