'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

/**
 * Convert Gemini PCM → WAV
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const buffers: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => buffers.push(d));
    writer.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

/**
 * Main sound generation flow
 */
export const gameSoundsFlow = ai.defineFlow(
  {
    name: 'gameSoundsFlow',
    inputSchema: z.string(),
    outputSchema: z.any(),
  },
  async (query) => {
    console.log('🎮 Requesting sound for:', query);

    const response = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'),
      prompt: query,
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    });

    const { media } = response ?? {};

    if (!media?.url) {
      console.error('⚠️ Missing audio media URL:', response);
      throw new Error('Gemini did not return audio content.');
    }

    const base64 = media.url.split(',')[1];
    const pcm = Buffer.from(base64, 'base64');

    const wavBase64 = await toWav(pcm);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

/**
 * Optional direct helper
 */
export async function getSoundAction(input: { soundType: string }) {
  return gameSoundsFlow(input.soundType);
}
