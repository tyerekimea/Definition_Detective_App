import { GenerationCommonConfigSchema, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import openAI from 'genkitx-openai';

const hasDeepSeekKey = Boolean(process.env.DEEPSEEK_API_KEY?.trim());

export const ai = genkit({
  plugins: [
    // googleAI() will automatically use GEMINI_API_KEY from environment
    googleAI(),
    // DeepSeek is exposed via an OpenAI-compatible API.
    ...(hasDeepSeekKey
      ? [
          openAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com/v1',
            models: [
              {
                name: 'deepseek-chat',
                info: {
                  label: 'DeepSeek - Chat',
                  supports: {
                    multiturn: true,
                    tools: true,
                    media: false,
                    systemRole: true,
                    output: ['text', 'json'],
                  },
                },
                configSchema: GenerationCommonConfigSchema,
              },
              {
                name: 'deepseek-reasoner',
                info: {
                  label: 'DeepSeek - Reasoner',
                  supports: {
                    multiturn: true,
                    tools: true,
                    media: false,
                    systemRole: true,
                    output: ['text', 'json'],
                  },
                },
                configSchema: GenerationCommonConfigSchema,
              },
            ],
          }),
        ]
      : []),
  ],
});
