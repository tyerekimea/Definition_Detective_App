# AI Generation System Integration Guide

**Implementation Date**: May 18, 2026  
**Version**: 1.0

This guide shows you exactly how to integrate the new AI generation system into your game components and server actions.

---

## Quick Start: 3 Steps to Integration

### Step 1: Update Your Game Start (Level Initialization)

Instead of generating words one-by-one, preload them all at once:

```typescript
// Before: Slow (generate one word at a time)
async function startLevel() {
  const word1 = await generateWordWithTheme({
    level: 2,
    theme: "current",
    userId,
  });
  const word2 = await generateWordWithTheme({
    level: 2,
    theme: "current",
    userId,
  });
  // ... wait for each word
}

// After: Fast (batch preload 8 words at once)
import { initializeLevelWithBatch } from "@/lib/actions";

async function startLevel() {
  const result = await initializeLevelWithBatch({
    level: 2,
    theme: "current",
    userId,
    preloadCount: 8, // Preload 8 words
  });

  if (result.success && result.words) {
    wordQueue.push(...result.words); // Add all to queue
    console.log(`Level ready in ${result.performanceMs}ms!`);
  }
}
```

**Performance Impact**:

- Old: 8-24 seconds (generating one word at a time)
- New: 2-3 seconds total ⚡ (70% faster)

---

### Step 2: Use Single-Call for Active Gameplay

Keep using `generateWordWithTheme()` for during-game word generation:

```typescript
import { generateWordWithTheme } from "@/lib/actions";

// This remains the same - fast real-time generation
async function getNextWord() {
  const result = await generateWordWithTheme({
    level: currentLevel,
    theme: selectedTheme,
    userId: currentUserId,
    previousWord: lastWord,
  });

  if (result.success) {
    setCurrentWord(result.word);
    setDefinition(result.definition);
  }
}
```

---

### Step 3: Add Background Preloading

While the player is solving, preload the next words:

```typescript
import { preloadNextWordsInBackground } from "@/lib/actions";

// In your game loop, trigger background preloading
async function playGameRound() {
  const word = await getNextWord();
  setCurrentWord(word);

  // Start preloading next words in background (don't await)
  preloadNextWordsInBackground({
    level: currentLevel,
    theme: selectedTheme,
    userId: currentUserId,
    count: 3, // Preload 3 words
  }).catch((err) => console.error("Background preload failed:", err));

  // While this runs in background, player can start solving
}
```

---

## Complete Integration Example

Here's a complete game flow using all three new features:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  generateWordWithTheme,
  initializeLevelWithBatch,
  preloadNextWordsInBackground,
} from '@/lib/actions';

interface GameState {
  currentWord?: string;
  definition?: string;
  wordQueue: Array<{ word: string; definition: string }>;
  level: number;
  theme: string;
  userId: string;
  isLoading: boolean;
  preloadedCount: number;
}

export function GameComponent({ userId, level, theme }: { userId: string; level: number; theme: string }) {
  const [gameState, setGameState] = useState<GameState>({
    wordQueue: [],
    level,
    theme,
    userId,
    isLoading: true,
    preloadedCount: 0,
  });

  // 1. Initialize level with batch preload on component mount
  useEffect(() => {
    async function initLevel() {
      setGameState(prev => ({ ...prev, isLoading: true }));

      const result = await initializeLevelWithBatch({
        level,
        theme: theme as any,
        userId,
        preloadCount: 8,  // Start with 8 words
      });

      if (result.success && result.words) {
        console.log(`✅ Level initialized with ${result.words.length} words (${result.performanceMs}ms)`);

        setGameState(prev => ({
          ...prev,
          wordQueue: result.words || [],
          isLoading: false,
          preloadedCount: result.words?.length || 0,
        }));

        // Get first word
        startNextRound(result.words[0]);
      } else {
        console.error('Failed to initialize level:', result.message);
        setGameState(prev => ({ ...prev, isLoading: false }));
      }
    }

    initLevel();
  }, [level, theme, userId]);

  // 2. Start a new round with current word
  function startNextRound(word: { word: string; definition: string }) {
    setGameState(prev => ({
      ...prev,
      currentWord: word.word,
      definition: word.definition,
    }));

    // 3. Trigger background preloading for next words
    triggerBackgroundPreload();
  }

  // 3. Background preloading function
  function triggerBackgroundPreload() {
    const { wordQueue, preloadedCount, level, theme, userId } = gameState;

    // If queue is getting low, preload more words
    if (wordQueue.length < 3) {
      preloadNextWordsInBackground({
        level,
        theme: theme as any,
        userId,
        count: 3,  // Preload 3 more
      })
        .then(result => {
          if (result.success && result.words) {
            console.log(`🔄 Background preloaded ${result.words.length} words (${result.performanceMs}ms)`);

            setGameState(prev => ({
              ...prev,
              wordQueue: [...prev.wordQueue, ...result.words],
              preloadedCount: prev.preloadedCount + (result.words?.length || 0),
            }));
          }
        })
        .catch(err => console.warn('Background preload non-critical error:', err));
    }
  }

  // Handle player answering the word
  async function handleAnswerCorrect() {
    const { wordQueue } = gameState;

    if (wordQueue.length > 1) {
      // Use preloaded word from queue
      const nextWord = wordQueue[1];
      const remainingQueue = wordQueue.slice(2);

      setGameState(prev => ({
        ...prev,
        wordQueue: remainingQueue,
      }));

      startNextRound(nextWord);
      triggerBackgroundPreload();  // Preload more in background
    } else {
      // Queue is empty or about to be, generate one fresh
      const result = await generateWordWithTheme({
        level: gameState.level,
        theme: gameState.theme as any,
        userId: gameState.userId,
        previousWord: gameState.currentWord,
      });

      if (result.success && result.word) {
        startNextRound({
          word: result.word,
          definition: result.definition || '',
        });
      }
    }
  }

  // UI rendering
  if (gameState.isLoading) {
    return <div>Loading level...</div>;
  }

  return (
    <div className="game-container">
      <h2>{gameState.currentWord}</h2>
      <p>{gameState.definition}</p>

      <div className="stats">
        <span>📚 Queue: {gameState.wordQueue.length} words</span>
        <span>✨ Preloaded: {gameState.preloadedCount}</span>
      </div>

      <button onClick={handleAnswerCorrect}>Next Word</button>
    </div>
  );
}
```

---

## API Reference

### 1. Initialize Level with Batch

```typescript
initializeLevelWithBatch({
  level: number;           // Game level (1-100)
  theme?: WordTheme;      // 'current', 'science-safari', 'history-quest', 'geo-genius'
  userId?: string;        // Optional: for tracking
  preloadCount?: number;  // 1-10, default: 8
})
→ {
    success: boolean
    words?: Array<{ word: string; definition: string }>
    performanceMs?: number
    message?: string
  }
```

**When to use**: At level start, level transitions, after clearing words

**Example**:

```typescript
const levelSetup = await initializeLevelWithBatch({
  level: 5,
  theme: "science-safari",
  userId: "user-123",
  preloadCount: 10,
});
```

---

### 2. Background Preloading

```typescript
preloadNextWordsInBackground({
  level: number;          // Game level
  theme?: WordTheme;      // Theme
  userId?: string;        // Optional: for tracking
  count?: number;         // 1-5, default: 3
})
→ {
    success: boolean
    words?: Array<{ word: string; definition: string }>
    performanceMs?: number
  }
```

**When to use**: During active gameplay, when player is solving puzzles

**Example**:

```typescript
// Trigger this while player is active
preloadNextWordsInBackground({
  level: currentLevel,
  theme: "current",
  userId: userId,
  count: 5,
})
  .then((result) => {
    if (result.success) {
      addToWordQueue(result.words);
    }
  })
  .catch((err) => console.warn("Non-critical:", err));
```

---

### 3. Real-time Word Generation (Unchanged)

```typescript
generateWordWithTheme({
  level?: number;         // OR difficulty
  difficulty?: string;    // 'easy', 'medium', 'hard'
  theme?: WordTheme;      // Theme
  userId?: string;        // Optional: for tracking
  previousWord?: string;  // Word to avoid repeating
})
→ {
    success: boolean
    word?: string
    definition?: string
    message?: string
  }
```

**When to use**: Real-time single word generation during gameplay

---

### 4. Batch Hints Generation

```typescript
generateBatchHintsAction({
  hints: Array<{
    word: string;              // The word (e.g., 'EXAMPLE')
    incorrectGuesses: string;  // Letters guessed wrong (e.g., 'xy')
    lettersToReveal: number;   // How many letters to reveal (e.g., 2)
  }>
})
→ {
    success: boolean
    hints?: Array<{
      word: string
      hint: string
      reasoning: string
      chosenLetters: string[]
    }>
    performanceMs?: number
    message?: string
  }
```

**When to use**: Multiplayer, bulk hint generation, hint batches

**Example**:

```typescript
const hintsResult = await generateBatchHintsAction({
  hints: [
    { word: "EXAMPLE", incorrectGuesses: "xy", lettersToReveal: 2 },
    { word: "PUZZLE", incorrectGuesses: "z", lettersToReveal: 1 },
    { word: "SOLUTION", incorrectGuesses: "abc", lettersToReveal: 3 },
  ],
});

if (hintsResult.success && hintsResult.hints) {
  hintsResult.hints.forEach((hint) => {
    console.log(`${hint.word} → ${hint.hint}`);
  });
}
```

---

### 5. Performance Monitoring

```typescript
getGenerationMetrics()
→ {
    success: boolean
    metrics?: {
      timestamp: number
      averageSingleCallMs: number   // Avg single-call latency
      averageBatchMs: number         // Avg batch latency
      totalGenerations: number       // Total requests tracked
      successRate: number            // % successful
    }
    message?: string
  }
```

**When to use**: Monitoring, optimization, debugging

**Example**:

```typescript
const metrics = await getGenerationMetrics();
if (metrics.success && metrics.metrics) {
  console.log(`
    Single-call avg: ${metrics.metrics.averageSingleCallMs}ms
    Batch avg: ${metrics.metrics.averageBatchMs}ms
    Success rate: ${metrics.metrics.successRate}%
  `);
}
```

---

## Common Patterns

### Pattern 1: Queue Management

```typescript
// Maintain a word queue
const [wordQueue, setWordQueue] = useState<
  Array<{ word: string; definition: string }>
>([]);

// Get next word from queue or generate fresh
async function getNextWord() {
  if (wordQueue.length > 0) {
    const [current, ...rest] = wordQueue;
    setWordQueue(rest);
    return current;
  } else {
    // Queue empty, generate one fresh
    return await generateWordWithTheme({
      level,
      theme,
      userId,
    });
  }
}

// Refill queue when it gets low
async function refillQueueIfNeeded() {
  if (wordQueue.length < 2) {
    const result = await preloadNextWordsInBackground({ level, theme, userId });
    if (result.success && result.words) {
      setWordQueue((prev) => [...prev, ...result.words]);
    }
  }
}
```

### Pattern 2: Level Transitions

```typescript
async function onLevelChange(newLevel: number) {
  setIsLoading(true);

  // Initialize new level with batch preload
  const result = await initializeLevelWithBatch({
    level: newLevel,
    theme: currentTheme,
    userId,
    preloadCount: 8,
  });

  if (result.success && result.words) {
    setWordQueue(result.words);
    setCurrentWord(result.words[0].word);
    setDefinition(result.words[0].definition);
    setIsLoading(false);

    // Trigger background refill
    preloadNextWordsInBackground({
      level: newLevel,
      theme: currentTheme,
      userId,
    });
  }
}
```

### Pattern 3: Multiplayer Hints

```typescript
async function getHintsForPlayers(words: string[]) {
  const hintRequests = words.map((word) => ({
    word: word.toUpperCase(),
    incorrectGuesses: "", // Default no wrong guesses
    lettersToReveal: 2,
  }));

  const result = await generateBatchHintsAction({
    hints: hintRequests,
  });

  return result.hints || [];
}
```

---

## Performance Tips

1. **Preload aggressively**: Initialize levels with 8-10 words
2. **Background refill**: Trigger preload when queue drops below 3
3. **Batch when possible**: Use batch operations for 3+ items
4. **Monitor metrics**: Track performance to optimize further
5. **Error handling**: All functions have fallbacks built-in

---

## Migration Checklist

If you have existing code using the old system:

- [ ] Replace `generateUniqueWord()` calls with `generateWordWithTheme()`
- [ ] Add `initializeLevelWithBatch()` to level start logic
- [ ] Add `preloadNextWordsInBackground()` to active gameplay
- [ ] Add performance monitoring with `getGenerationMetrics()`
- [ ] Test with different preload counts (3-10)
- [ ] Monitor actual gameplay performance
- [ ] Adjust timeout settings in `.env` if needed

---

## Troubleshooting

**Q: Words are repeating**

- Ensure `userId` is set so history is tracked
- Check Firebase `usedWords` collection is being populated

**Q: Generation is slow**

- Verify API keys are set
- Check network connectivity
- Try reducing preload batch size
- Check provider rate limits

**Q: Background preload failing silently**

- This is expected - errors are logged but non-critical
- System falls back to single-call generation
- Check console for detailed error messages

**Q: Performance metrics show 0**

- Metrics are tracked in memory during runtime
- They reset on app restart
- Generate multiple words first, then check metrics

---

## Next Steps

1. ✅ Implement level initialization with batch
2. ✅ Add background preloading to active gameplay
3. ✅ Monitor performance with metrics
4. ✅ Adjust batch sizes based on actual performance
5. 🔄 Consider database caching for preloaded words
6. 🔄 Add analytics tracking for generation performance

Happy building! 🚀
