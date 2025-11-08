
'use server';
/**
 * @fileOverview A flow to securely decrement a user's hint count.
 * This flow should be called from a server action.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirestore } from '@/lib/firebase-admin';

const UseHintInputSchema = z.object({
  userId: z.string().describe('The ID of the user using the hint.'),
});
export type UseHintInput = z.infer<typeof UseHintInputSchema>;

const UseHintOutputSchema = z.object({
  success: z.boolean().describe('Whether the hint was successfully used.'),
  message: z.string().describe('A message describing the result.'),
});
export type UseHintOutput = z.infer<typeof UseHintOutputSchema>;

export async function useHint(input: UseHintInput): Promise<UseHintOutput> {
  return useHintFlow(input);
}

const useHintFlow = ai.defineFlow(
  {
    name: 'useHintFlow',
    inputSchema: UseHintInputSchema,
    outputSchema: UseHintOutputSchema,
  },
  async ({ userId }) => {
    try {
      initFirestore();
      const firestore = getFirestore();
      const userProfileRef = firestore.collection('userProfiles').doc(userId);
      
      const result = await firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userProfileRef);

        if (!userDoc.exists) {
          return { success: false, message: 'User profile not found.' };
        }

        const currentHints = userDoc.data()?.hints ?? 0;

        if (currentHints <= 0) {
          return { success: false, message: "You don't have any hints left." };
        }

        transaction.update(userProfileRef, { hints: currentHints - 1 });
        return { success: true, message: 'Hint used successfully.' };
      });

      return result;

    } catch (error) {
      console.error('Error in useHintFlow:', error);
      throw new Error('An unexpected error occurred while using a hint.');
    }
  }
);
