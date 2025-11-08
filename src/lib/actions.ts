
'use server';

import { getSmartHint as getSmartHintFlow, SmartHintInput } from '@/ai/flows/smart-word-hints';
import { getGameSound as getGameSoundFlow, GameSoundInput } from '@/ai/flows/game-sounds-flow';
import { useHint as useHintFlow, UseHintInput } from '@/ai/flows/use-hint-flow';
import { auth } from 'firebase-admin';

export async function getHintAction(data: {
  word: string;
  incorrectGuesses: string;
  lettersToReveal: number;
}) {
  try {
    const input: SmartHintInput = {
      word: data.word,
      incorrectGuesses: data.incorrectGuesses,
      lettersToReveal: data.lettersToReveal, 
    };
    const result = await getSmartHintFlow(input);
    if (!result || !result.hint) {
        throw new Error("Invalid hint response from AI.");
    }
    return { hint: result.hint, error: null };
  } catch (error) {
    console.error("Error getting hint:", error);
    return { hint: null, error: 'Failed to get a hint. Please try again.' };
  }
}

export async function getSoundAction(sound: string) {
    try {
        const input: GameSoundInput = sound;
        const result = await getGameSoundFlow(input);
        if (!result || !result.soundDataUri) {
            throw new Error('Invalid sound response from AI.');
        }
        return { soundDataUri: result.soundDataUri, error: null };
    } catch (error) {
        console.error(`Error getting sound for "${sound}":`, error);
        return { soundDataUri: null, error: `Failed to get sound: ${sound}` };
    }
}

export async function useHintAction(data: { userId: string }) {
  try {
    const input: UseHintInput = { userId: data.userId };
    const result = await useHintFlow(input);
    return { success: result.success, message: result.message, error: null };
  } catch (error: any) {
    console.error('Error using hint:', error);
    return { success: false, message: error.message || 'Failed to use a hint.', error: 'Failed to use a hint. Please try again.' };
  }
}
