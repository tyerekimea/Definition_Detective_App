'use server';

import { ai } from '@/ai/genkit';
import {
  GenerateImageDescriptionInput,
  GenerateImageDescriptionOutput,
  GenerateImageDescriptionInputSchema,
  GenerateImageDescriptionOutputSchema,
} from '@/ai/schemas/image-description';

export async function generateImageDescription(
  input: GenerateImageDescriptionInput
): Promise<GenerateImageDescriptionOutput> {
  return generateImageDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageDescriptionPrompt',
  input: { schema: GenerateImageDescriptionInputSchema },
  output: { schema: GenerateImageDescriptionOutputSchema, format: 'json' },
  prompt: `You are an expert visual designer for a game where players guess words from images.

Your task is to create a vivid, descriptive prompt that can be used to generate an image representing the word: "{{word}}".

The description should:
1. Be visual and detailed.
2. NOT contain the word "{{word}}" itself.
3. Focus on the physical appearance, setting, or metaphorical representation of the word.

Generate the JSON response with a single field "description".`,
});

export const generateImageDescriptionFlow = ai.defineFlow(
  {
    name: 'generateImageDescriptionFlow',
    inputSchema: GenerateImageDescriptionInputSchema,
    outputSchema: GenerateImageDescriptionOutputSchema,
  },
  async (input) => {
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.includes('your_actual_api_key')) {
      console.error('❌ GOOGLE_API_KEY is missing or invalid (placeholder detected).');
      throw new Error('Server configuration error: Invalid API Key.');
    }

    // We explicitly pass the model here to avoid the "Must supply a model" error
    const { output } = await prompt(input, { model: 'googleai/gemini-1.5-flash-latest' });
    if (!output) {
      throw new Error('Failed to generate image description.');
    }
    return output;
  }
);