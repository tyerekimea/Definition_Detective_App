'use server';

import { ai } from '../genkit';
import {
  type BatchGenerateHintInput,
  type BatchGenerateHintOutput,
  BatchGenerateHintInputSchema,
  BatchGenerateHintOutputSchema,
} from '../schemas/batch-hint';
import { GenerateHintInput } from '../schemas/hint';

export async function generateBatchHints(
  input: BatchGenerateHintInput
): Promise<BatchGenerateHintOutput> {
  return generateBatchHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBatchHintsPrompt',
  input: { schema: BatchGenerateHintInputSchema },
  output: { schema: BatchGenerateHintOutputSchema, format: 'json' },
  prompt: `You are a hint generator for a word puzzle game. Generate hints for multiple words in a batch.

You will receive an array of hint generation requests. For each request, follow the exact algorithm:

ALGORITHM FOR EACH HINT:
1. List all unique letters in the word that are NOT in incorrectGuesses
2. Select EXACTLY lettersToReveal letters from that list
3. For each position in the word:
   - If word[i] is in your selected letters: hint[i] = word[i]
   - Otherwise: hint[i] = "_"
4. Verify: hint.length === wordLength and unique_letters_in_hint === lettersToReveal

CRITICAL RULES:
- Hint MUST be EXACTLY wordLength characters long
- When you reveal a letter, show ALL its occurrences
- Replace all other positions with "_"
- Choose EXACTLY lettersToReveal unique letters (not more, not less)

Return a JSON object with:
- hints: array of hint objects, each containing:
  - reasoning: explain which letters you chose and why
  - chosenLetters: array of the unique letters you chose
  - hint: the partially revealed word
- generatedCount: number of hints successfully generated
- totalRequested: total hints requested
- failedIndices: array of indices that failed (if any)`,
});

const generateBatchHintFlow = ai.defineFlow(
  {
    name: 'generateBatchHintFlow',
    inputSchema: BatchGenerateHintInputSchema,
    outputSchema: BatchGenerateHintOutputSchema,
  },
  async input => {
    const hasDeepSeekKey = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
    const hasGoogleAIKey = Boolean(
      process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENAI_API_KEY?.trim()
    );
    const perModelTimeoutMs = Math.max(2000, Number(process.env.HINT_MODEL_TIMEOUT_MS || 12000));
    const totalFlowTimeoutMs = Math.max(
      perModelTimeoutMs,
      Number(process.env.HINT_FLOW_TIMEOUT_MS || 35000)
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
      throw new Error('No usable AI model candidates are configured for generateBatchHintFlow.');
    }

    for (const candidate of candidates) {
      if (Date.now() - startedAt > totalFlowTimeoutMs) {
        lastErr = new Error(`Batch hint flow timeout exceeded (${totalFlowTimeoutMs}ms)`);
        break;
      }

      const provider = getProviderFromModel(candidate);
      if (provider && blockedProviders.has(provider)) {
        continue;
      }

      try {
        console.debug('[generateBatchHintFlow] trying model candidate:', candidate);
        
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
        console.debug('[generateBatchHintFlow] model worked:', candidate);
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
          console.warn(`[generateBatchHintFlow] model "${candidate}" failed: ${msg} — trying next`);
          continue;
        }
        
        console.warn(`[generateBatchHintFlow] model "${candidate}" error: ${msg} — trying next`);
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
  if (model.startsWith('openai/') && !model.startsWith('openai/deepseek-') && model !== 'deepseek-chat' && model !== 'deepseek-reasoner') {
    return '';
  }

  return model;
}

function getProviderFromModel(model: string): string | null {
  if (model.startsWith('deepseek-')) return 'deepseek';
  if (model.startsWith('openai/deepseek-')) return 'deepseek';
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
  if (provider === 'deepseek') return hasDeepSeek;
  if (provider === 'googleai') return hasGoogleAI;
  return false;
}
