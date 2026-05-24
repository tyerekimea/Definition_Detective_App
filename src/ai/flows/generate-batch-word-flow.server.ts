'use server';

import { ai } from '../genkit';
import {
  type BatchGenerateWordInput,
  type BatchGenerateWordOutput,
  BatchGenerateWordInputSchema,
  BatchGenerateWordOutputSchema,
} from '../schemas/batch-word';

export async function generateBatchWords(
  input: BatchGenerateWordInput
): Promise<BatchGenerateWordOutput> {
  const processedInput = {
    ...input,
    excludeWordsString: input.excludeWords?.join(', ') || '',
  };
  return generateBatchWordFlow(processedInput as any);
}

const prompt = ai.definePrompt({
  name: 'generateBatchWordsPrompt',
  input: { schema: BatchGenerateWordInputSchema },
  output: { schema: BatchGenerateWordOutputSchema, format: 'json' },
  prompt: `You are an expert lexicographer and puzzle master for a word game.

Your task is to generate {{{batchSize}}} unique words and their definitions based on the requested difficulty level and theme.

Batch Size: {{{batchSize}}}
Difficulty: {{{difficulty}}}
Theme: {{{theme}}}

Theme Guidelines:
- current: General vocabulary EXCLUDING science, history, and geography topics. Focus on: everyday objects, emotions, actions, abstract concepts, arts, literature, business, technology, food, sports, entertainment, and general knowledge. DO NOT use scientific terms, historical terms, or geographical terms.
- science-safari: Biological sciences, space exploration, ecosystems, scientific terminology, natural phenomena, and scientific discoveries
- history-quest: Ancient civilizations (Egypt, Rome, Greece, Mesopotamia), historical figures, historical events, artifacts, and historical terminology
- geo-genius: Countries, capitals, cities, landmarks, geographical features, continents, oceans, and geographical terminology

{{#if excludeWordsString}}
IMPORTANT: Do NOT use any of these words (user has already seen them): {{{excludeWordsString}}}
{{/if}}

Difficulty Guidelines:
- For "easy": Use common words (5-7 letters) that most people know
- For "medium": Use moderately challenging words (7-10 letters)
- For "hard": Use advanced vocabulary words (10+ letters)

Requirements:
- Generate EXACTLY {{{batchSize}}} different words
- All words MUST relate to the theme specified above
- If theme is not "current", choose technical nouns clearly tied to the theme (avoid emotions, virtues, or generic abstract nouns)
- Each definition should be clear, concise, and dictionary-style
- Ensure each word is appropriate for the difficulty level
- Use only single words (no spaces, no hyphens)
- Words in the batch MUST be unique from each other

Return a JSON object with:
- words: array of objects, each containing:
  - word: the target word (lowercase, no spaces, single word only)
  - definition: a clear, concise definition
- generatedCount: number of words in the array
- totalRequested: {{{batchSize}}}`,
});

const generateBatchWordFlow = ai.defineFlow(
  {
    name: 'generateBatchWordFlow',
    inputSchema: BatchGenerateWordInputSchema,
    outputSchema: BatchGenerateWordOutputSchema,
  },
  async input => {
    const hasDeepSeekKey = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
    const hasGoogleAIKey = Boolean(
      process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENAI_API_KEY?.trim()
    );
    const perModelTimeoutMs = Math.max(2000, Number(process.env.WORD_MODEL_TIMEOUT_MS || 12000));
    const totalFlowTimeoutMs = Math.max(
      perModelTimeoutMs,
      Number(process.env.WORD_FLOW_TIMEOUT_MS || 35000)
    );

    const explicit = sanitizeModelCandidate(process.env.GOOGLE_GENAI_MODEL);
    const listFromEnv = (process.env.GOOGLE_GENAI_MODEL_CANDIDATES || '')
      .split(',')
      .map(s => sanitizeModelCandidate(s))
      .filter(Boolean);
    const defaultCandidates = [
      ...(hasDeepSeekKey
        ? [
            'openai/deepseek-chat',
            'openai/deepseek-reasoner',
          ]
        : []),
      ...(hasGoogleAIKey
        ? [
            'googleai/gemini-2.5-flash-lite',
            'googleai/gemini-2.5-flash',
            'googleai/gemini-2.5-pro',
          ]
        : []),
    ];
    const candidates = Array.from(new Set([
      ...(explicit ? [explicit] : []),
      ...listFromEnv,
      ...defaultCandidates,
    ])).filter((candidate) =>
      isModelAllowedForConfiguredProviders(candidate, hasDeepSeekKey, hasGoogleAIKey)
    );

    let lastErr: any = null;
    const modelErrors: string[] = [];
    const blockedProviders = new Set<string>();
    const startedAt = Date.now();

    if (candidates.length === 0) {
      throw new Error('No usable AI model candidates are configured for generateBatchWordFlow.');
    }

    for (const candidate of candidates) {
      if (Date.now() - startedAt > totalFlowTimeoutMs) {
        lastErr = new Error(`Batch word flow timeout exceeded (${totalFlowTimeoutMs}ms)`);
        break;
      }

      const provider = getProviderFromModel(candidate);
      if (provider && blockedProviders.has(provider)) {
        continue;
      }

      try {
        console.debug('[generateBatchWordFlow] trying model candidate:', candidate);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error(`Model request timed out after ${perModelTimeoutMs}ms`)),
            perModelTimeoutMs
          );
        });
        
        const promptPromise = prompt(input, { model: candidate });
        const { output } = await Promise.race([promptPromise, timeoutPromise]) as any;
        
        if (!output) {
          lastErr = new Error('AI returned no output.');
          continue;
        }
        console.debug('[generateBatchWordFlow] model worked:', candidate);
        return output;
      } catch (err: any) {
        const msg = err?.originalMessage ?? err?.message ?? String(err);
        lastErr = err;
        modelErrors.push(`${candidate}: ${msg}`);
        
        const notFound = /not found/i.test(msg) || /NOT_FOUND/.test(msg);
        const authError = /401|403|Incorrect API key|Invalid API key|authentication|forbidden|denied access/i.test(msg);
        const rateLimitError = /429|rate limit|quota/i.test(msg);
        const providerUnavailable = /ECONN|fetch failed|network/i.test(msg);

        if (provider && (authError || providerUnavailable || notFound)) {
          blockedProviders.add(provider);
        }
        
        if (notFound || authError || rateLimitError) {
          console.warn(`[generateBatchWordFlow] model "${candidate}" failed: ${msg} — trying next`);
          continue;
        }
        
        console.warn(`[generateBatchWordFlow] model "${candidate}" error: ${msg} — trying next`);
        continue;
      }
    }

    const tried = candidates.join(', ');
    const finalMsg = lastErr?.originalMessage ?? lastErr?.message ?? String(lastErr ?? 'no response');
    throw new Error(
      `AI model request failed — tried models: [${tried}]. Last error: ${finalMsg}. Errors: ${modelErrors.join(' | ')}`
    );
  }
);

function sanitizeModelCandidate(value: string | undefined | null): string {
  const model = (value || '').trim().replace(/^['"]|['"]$/g, '');
  if (!model) return '';

  if (/^googleai\/gemini-2\.0-flash-exp$/i.test(model)) {
    return '';
  }
  if (model.startsWith('openai/') && !model.startsWith('openai/deepseek-')) {
    return '';
  }

  return model;
}

function getProviderFromModel(model: string): string | null {
  if (model.startsWith('openai/')) return 'openai';
  if (model.startsWith('googleai/')) return 'googleai';
  return null;
}

function isModelAllowedForConfiguredProviders(
  model: string,
  hasDeepSeek: boolean,
  hasGoogleAI: boolean
): boolean {
  const provider = getProviderFromModel(model);
  if (!provider) return false;
  if (provider === 'openai') return hasDeepSeek;
  if (provider === 'googleai') return hasGoogleAI;
  return false;
}
