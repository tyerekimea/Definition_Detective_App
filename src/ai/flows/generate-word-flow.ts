
'use server';

import { ai } from '../genkit';
import {
  type GenerateWordInput,
  type GenerateWordOutput,
  GenerateWordInputSchema,
  GenerateWordOutputSchema,
} from '../schemas/word';

export async function generateWord(
  input: GenerateWordInput
): Promise<GenerateWordOutput> {
  // Convert excludeWords array to comma-separated string for the prompt
  const processedInput = {
    ...input,
    excludeWordsString: input.excludeWords?.join(', ') || '',
  };
  return generateWordFlow(processedInput as any);
}

const prompt = ai.definePrompt({
  name: 'generateWordPrompt',
  input: { schema: GenerateWordInputSchema },
  output: { schema: GenerateWordOutputSchema, format: 'json' },
  prompt: `You are an expert lexicographer and puzzle master for a word game.

Your task is to generate a single word and its corresponding definition based on the requested difficulty level and theme.

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
- The word MUST relate to the theme specified above
- If theme is not "current", choose a technical noun clearly tied to the theme (avoid emotions, virtues, or generic abstract nouns)
- The definition should be clear, concise, and dictionary-style
- Ensure the word is appropriate for the difficulty level
- Use only single words (no spaces, no hyphens)

Return a JSON object with:
- word: the target word (lowercase, no spaces, single word only)
- definition: a clear, concise definition`,
});

const generateWordFlow = ai.defineFlow(
  {
    name: 'generateWordFlow',
    inputSchema: GenerateWordInputSchema,
    outputSchema: GenerateWordOutputSchema,
  },
  async input => {
    const hasDeepSeekKey = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
    const hasGoogleAIKey = Boolean(
      process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENAI_API_KEY?.trim()
    );
    const perModelTimeoutMs = Math.max(1500, Number(process.env.WORD_MODEL_TIMEOUT_MS || 9000));
    const totalFlowTimeoutMs = Math.max(
      perModelTimeoutMs,
      Number(process.env.WORD_FLOW_TIMEOUT_MS || 25000)
    );

    // Build prioritized candidate list:
    // 1) explicit `GOOGLE_GENAI_MODEL`
    // 2) comma-separated `GOOGLE_GENAI_MODEL_CANDIDATES`
    // 3) sensible defaults (try common model ids)
    const explicit = sanitizeModelCandidate(process.env.GOOGLE_GENAI_MODEL);
    const listFromEnv = (process.env.GOOGLE_GENAI_MODEL_CANDIDATES || '')
      .split(',')
      .map(s => sanitizeModelCandidate(s))
      .filter(Boolean);
    const defaultCandidates = [
      ...(hasDeepSeekKey
        ? [
            // DeepSeek models (through OpenAI-compatible endpoint)
            'openai/deepseek-chat',
            'openai/deepseek-reasoner',
          ]
        : []),
      ...(hasGoogleAIKey
        ? [
            // Gemini models - fallback
            'googleai/gemini-2.5-flash',
            'googleai/gemini-2.5-pro',
            'googleai/gemini-2.5-flash-lite',
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
      throw new Error('No usable AI model candidates are configured for generateWordFlow.');
    }

    for (const candidate of candidates) {
      if (Date.now() - startedAt > totalFlowTimeoutMs) {
        lastErr = new Error(`Word flow timeout exceeded (${totalFlowTimeoutMs}ms)`);
        break;
      }

      const provider = getProviderFromModel(candidate);
      if (provider && blockedProviders.has(provider)) {
        continue;
      }

      try {
        console.debug('[generateWordFlow] trying model candidate:', candidate);
        
        // Add timeout to prevent hanging
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
        console.debug('[generateWordFlow] model worked:', candidate);
        return output;
      } catch (err: any) {
        const msg = err?.originalMessage ?? err?.message ?? String(err);
        lastErr = err;
        modelErrors.push(`${candidate}: ${msg}`);
        
        // Check for common errors that should trigger fallback
        const notFound = /not found/i.test(msg) || /NOT_FOUND/.test(msg);
        const authError = /401|403|Incorrect API key|Invalid API key|authentication|forbidden|denied access/i.test(msg);
        const rateLimitError = /429|rate limit|quota/i.test(msg);
        const providerUnavailable = /timed out|ECONN|fetch failed|network/i.test(msg);

        if (provider && (authError || providerUnavailable || notFound)) {
          blockedProviders.add(provider);
        }
        
        if (notFound || authError || rateLimitError) {
          console.warn(`[generateWordFlow] model "${candidate}" failed: ${msg} — trying next`);
          continue;
        }
        
        // For other errors, also try next model (more resilient)
        console.warn(`[generateWordFlow] model "${candidate}" error: ${msg} — trying next`);
        continue;
      }
    }

    // If we reach here, none of the candidates worked.
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

  // Known legacy/unsupported IDs for current generateContent usage.
  if (/^googleai\/gemini-2\.0-flash-exp$/i.test(model)) {
    return '';
  }
  // Drop non-DeepSeek OpenAI model IDs. DeepSeek models are OpenAI-compatible
  // but use `openai/deepseek-*` model names.
  if (model.startsWith('openai/') && !model.startsWith('openai/deepseek-')) {
    return '';
  }

  return model;
}

function getProviderFromModel(modelId: string): string | null {
  if (modelId.startsWith('openai/deepseek-')) return 'deepseek';
  if (modelId.startsWith('openai/')) return 'openai-compat';
  if (modelId.startsWith('googleai/')) return 'googleai';
  return null;
}

function isModelAllowedForConfiguredProviders(
  modelId: string,
  hasDeepSeekKey: boolean,
  hasGoogleAIKey: boolean
): boolean {
  if (!modelId) return false;
  if (modelId.startsWith('openai/deepseek-')) return hasDeepSeekKey;
  if (modelId.startsWith('openai/')) return false;
  if (modelId.startsWith('googleai/')) return hasGoogleAIKey;
  return true;
}
