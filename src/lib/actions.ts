
'use server';

import { getFirestore } from '@/lib/firebase-admin';
import { generateHint } from '@/ai/flows/generate-hints';
import { generateWord } from '@/ai/flows/generate-word-flow';
import type { GenerateHintInput } from '@/ai/schemas/hint';
import type { WordTheme } from '@/lib/game-data';

export async function useHintAction(data: GenerateHintInput & { userId?: string | null, isFree?: boolean }): Promise<{ success: boolean; message?: string; hint?: string; }> {
  try {
    // Only check Firebase for paid hints (not free hints)
    if (!data.isFree && data.userId) {
      try {
        const firestore = getFirestore();
        const userProfileRef = firestore.collection('userProfiles').doc(data.userId);

        const transactionResult = await firestore.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userProfileRef);

          if (!userDoc.exists) {
            throw new Error('User profile not found.');
          }

          const currentHints = userDoc.data()?.hints ?? 0;

          if (currentHints <= 0) {
            return { success: false, message: "You don't have any hints left." };
          }

          transaction.update(userProfileRef, { hints: currentHints - 1 });
          
          return { success: true };
        });

        if (!transactionResult.success) {
          return { success: false, message: transactionResult.message };
        }
      } catch (firebaseError: any) {
        console.error('Firebase error in useHintAction:', firebaseError);
        // If Firebase fails, we can still generate the hint but log the error
        // This prevents Firebase issues from blocking hint generation
        console.warn('Continuing with hint generation despite Firebase error');
      }
    }

    // Generate the hint (works for both free and paid hints)
    const hintResult = await generateHint({
      ...data,
      wordLength: data.word.length,
    });
    
    if (hintResult && hintResult.hint) {
      return { success: true, ...hintResult };
    }
    
    throw new Error('AI did not return a valid hint format.');

  } catch (error: any) {
    console.error('Error in useHintAction:', error);
    return { success: false, message: error.message || 'An unexpected error occurred while getting a hint.' };
  }
}

// Generate word with theme and exclude used words
// Now uses the robust word generator with fallback
export async function generateWordWithTheme(params: {
  difficulty: 'easy' | 'medium' | 'hard';
  theme?: WordTheme;
  userId?: string | null;
  level?: number;
  previousWord?: string;
}): Promise<{ success: boolean; word?: string; definition?: string; message?: string }> {
  // Import the robust generator
  const { generateUniqueWord } = await import('./word-generator');
  
  try {
    // Use level-based constraints if level provided, otherwise map difficulty
    const level = params.level || (
      params.difficulty === 'easy' ? 3 :
      params.difficulty === 'medium' ? 10 :
      20
    );
    
    console.log('[generateWordWithTheme] Generating word for level:', level);
    
    const result = await generateUniqueWord({
      level,
      theme: params.theme,
      userId: params.userId,
      previousWord: params.previousWord,
    });
    
    return result;
  } catch (error: any) {
    console.error('Error in generateWordWithTheme:', error);
    return {
      success: false,
      message: error.message || 'Failed to generate word',
    };
  }
}

// Clear used words (useful if user gets stuck with same words)
async function deleteUsedWordsSubcollection(
  userProfileRef: FirebaseFirestore.DocumentReference
): Promise<void> {
  const usedWordsRef = userProfileRef.collection('usedWords');
  const pageSize = 50;
  while (true) {
    const snapshot = await usedWordsRef.limit(pageSize).get();
    if (snapshot.empty) return;

    const batch = usedWordsRef.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

export async function clearUsedWords(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);

    await userProfileRef.update({
      usedWords: [],
    });
    await deleteUsedWordsSubcollection(userProfileRef);

    return {
      success: true,
      message: 'Used words cleared successfully',
    };
  } catch (error: any) {
    console.error('Error clearing used words:', error);
    return {
      success: false,
      message: error.message || 'Failed to clear used words',
    };
  }
}

// Update user's selected theme
export async function updateUserTheme(params: {
  userId: string;
  theme: WordTheme;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(params.userId);

    await userProfileRef.update({
      selectedTheme: params.theme,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateUserTheme:', error);
    return {
      success: false,
      message: error.message || 'Failed to update theme',
    };
  }
}

// Get user's theme preference
export async function getUserTheme(userId: string): Promise<{ theme: WordTheme; isPremium: boolean }> {
  try {
    const firestore = getFirestore();
    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    const userDoc = await userProfileRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        theme: (userData?.selectedTheme as WordTheme) || 'current',
        isPremium: userData?.isPremium || false,
      };
    }

    return { theme: 'current', isPremium: false };
  } catch (error: any) {
    console.error('Error in getUserTheme:', error);
    return { theme: 'current', isPremium: false };
  }
}
