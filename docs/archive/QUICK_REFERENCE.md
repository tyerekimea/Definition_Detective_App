# Quick Reference: New AI Generation Functions

**Use this card to quickly find the right function for your use case**

## Functions at a Glance

| Function                         | Use Case               | Latency  | Items | Best For        |
| -------------------------------- | ---------------------- | -------- | ----- | --------------- |
| `generateWordWithTheme()`        | Single word, real-time | 1-3s     | 1     | Active gameplay |
| `initializeLevelWithBatch()`     | Preload entire level   | 2-3s     | 3-10  | Level start     |
| `preloadNextWordsInBackground()` | Async queue refill     | 1.5-2.5s | 3-5   | Background      |
| `generateBatchHintsAction()`     | Multiple hints         | 1.8-3.5s | 3-10  | Multiplayer     |
| `getGenerationMetrics()`         | Monitor performance    | N/A      | N/A   | Optimization    |

---

## Copy-Paste Examples

### Example 1: Level Initialization

```typescript
const result = await initializeLevelWithBatch({
  level: 2,
  theme: "current",
  userId: "user-123",
  preloadCount: 8,
});

if (result.success && result.words) {
  wordQueue.push(...result.words);
  console.log(`Ready in ${result.performanceMs}ms`);
}
```

### Example 2: Active Gameplay

```typescript
const result = await generateWordWithTheme({
  level: 2,
  theme: "current",
  userId: "user-123",
  previousWord: lastWord,
});

if (result.success) {
  setWord(result.word);
  setDef(result.definition);
}
```

### Example 3: Background Preload

```typescript
// Fire and forget - runs in background
preloadNextWordsInBackground({
  level: 2,
  theme: "current",
  userId: "user-123",
  count: 3,
})
  .then((result) => {
    if (result.success && result.words) {
      queue.push(...result.words);
    }
  })
  .catch(() => {}); // Ignore errors, non-critical
```

### Example 4: Batch Hints

```typescript
const result = await generateBatchHintsAction({
  hints: [
    { word: "EXAMPLE", incorrectGuesses: "xy", lettersToReveal: 2 },
    { word: "PUZZLE", incorrectGuesses: "", lettersToReveal: 1 },
  ],
});

if (result.success && result.hints) {
  result.hints.forEach((h) => console.log(h.word, "->", h.hint));
}
```

### Example 5: Performance Check

```typescript
const metrics = await getGenerationMetrics();
console.log(`Single-call: ${metrics.metrics?.averageSingleCallMs}ms avg`);
console.log(`Success rate: ${metrics.metrics?.successRate}%`);
```

---

## Typical Game Flow

```
1. Level Starts
   ↓
   initializeLevelWithBatch() → Get 8 words in 2-3s

2. Player Solves Puzzle
   ↓
   generateWordWithTheme() → Get next word (1-3s)

3. While Solving
   ↓
   preloadNextWordsInBackground() → Refill queue (background)

4. Queue Getting Low?
   ↓
   preloadNextWordsInBackground() → More words (background)

5. Special Case: Multiple Hints?
   ↓
   generateBatchHintsAction() → Batch hints (1.8-3.5s)
```

---

## Key Differences from Old System

| Old                      | New                              | Benefit                   |
| ------------------------ | -------------------------------- | ------------------------- |
| `generateUniqueWord()`   | `generateWordWithTheme()`        | Better naming, same speed |
| Generate 1 word per call | Batch 3-10 words per call        | 40-70% faster for bulk    |
| Manual preloading        | `initializeLevelWithBatch()`     | Automatic, optimized      |
| No background preload    | `preloadNextWordsInBackground()` | Smoother gameplay         |
| No metrics               | `getGenerationMetrics()`         | Monitor performance       |

---

## Performance Expectations

### Single-Call Generation

```
generateWordWithTheme()
├─ 70% of time: 1-2s ✅
├─ 20% of time: 2-3s ⚠️
└─ 10% of time: 3-5s (fallback) 🔄
```

### Batch Generation

```
initializeLevelWithBatch(8)
├─ Time: 2-3s ⚡
├─ Per-item: 0.25-0.38s
└─ Savings: 60-75% vs single calls
```

### Background Preload

```
preloadNextWordsInBackground(3)
├─ Time: 1.5-2.5s 🔄
├─ Runs in background (non-blocking)
└─ Perfect for async preloading
```

---

## Configuration

Set in `.env.local`:

```bash
# Increase for batch operations
WORD_MODEL_TIMEOUT_MS=12000
WORD_FLOW_TIMEOUT_MS=35000

# Select preferred model
GOOGLE_GENAI_MODEL=googleai/gemini-2.5-flash
DEEPSEEK_API_KEY=sk-...
```

---

## Error Handling

All functions return `{ success: boolean, message?: string, ... }`

```typescript
// Always check success
if (result.success) {
  // Use result.words or result.hints
} else {
  // Handle error with result.message
  console.error(result.message);
}

// Fallback built-in
// If generation fails, system uses deterministic fallback word
```

---

## Import Guide

```typescript
// All from @/lib/actions
import {
  generateWordWithTheme, // Real-time word
  initializeLevelWithBatch, // Level init
  preloadNextWordsInBackground, // Background preload
  generateBatchHintsAction, // Batch hints
  getGenerationMetrics, // Performance tracking
  useHintAction, // Hint generation
  clearUsedWords, // Clear history
  updateUserTheme, // Save theme
  getUserTheme, // Get theme
} from "@/lib/actions";
```

---

## Debugging

### Enable Detailed Logging

```typescript
// Set in browser console during gameplay
localStorage.setItem("DEBUG_AI", "true");

// Check browser DevTools → Console for logs:
// [generateWordWithTheme] Generating word for level: 2
// [initializeLevelWithBatch] Preloading 8 words
// [preloadNextWordsInBackground] Preloaded 3 words
```

### Check Generation Queue

```typescript
const metrics = await getGenerationMetrics();
console.table(metrics.metrics);

// Output:
// timestamp: 1718683200000
// averageSingleCallMs: 1850
// averageBatchMs: 2100
// totalGenerations: 45
// successRate: 98.5
```

---

## Migration Checklist

- [ ] Updated imports (use `@/lib/actions`)
- [ ] Updated game level initialization
- [ ] Added background preloading
- [ ] Added queue management
- [ ] Tested on mobile/web
- [ ] Monitored performance metrics
- [ ] Adjusted batch sizes if needed

---

Made with ❤️ for Definition Detective  
Last updated: May 18, 2026
