import { config } from 'dotenv';
config({ path: '.env.local' });

import './src/ai/genkit';
// Use server flow modules directly so this debug runner bypasses mock wrappers.
import { generateWord } from './src/ai/flows/generate-word-flow.server';
import { generateHint } from './src/ai/flows/generate-hints.server';

async function debugFlows() {
  console.log('🔍 DEBUGGING WORD FLOW AND HINT GENERATION\n');
  console.log('=' .repeat(60));
  
  // Check environment
  console.log('\n📋 ENVIRONMENT CHECK:');
  console.log(`   DeepSeek API Key: ${process.env.DEEPSEEK_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`   Model Override: ${process.env.GOOGLE_GENAI_MODEL || 'None (using defaults)'}`);
  console.log(`   Model Candidates: ${process.env.GOOGLE_GENAI_MODEL_CANDIDATES || 'None (using defaults)'}`);
  
  console.log('\n' + '='.repeat(60));
  
  // Test 1: Word Generation - General Theme
  console.log('\n📝 TEST 1: Word Generation - General Theme (Easy)');
  console.log('-'.repeat(60));
  try {
    const startTime = Date.now();
    const result = await generateWord({ 
      difficulty: 'easy',
      theme: 'current'
    });
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Success! (${duration}ms)`);
    console.log(`   Word: "${result.word}"`);
    console.log(`   Definition: "${result.definition}"`);
    console.log(`   Length: ${result.word.length} letters`);
    
    // Validate it's not a premium topic
    const premiumKeywords = ['science', 'biology', 'space', 'history', 'ancient', 'civilization', 'country', 'capital', 'geography'];
    const isPremiumTopic = premiumKeywords.some(keyword => 
      result.word.toLowerCase().includes(keyword) || 
      result.definition.toLowerCase().includes(keyword)
    );
    
    if (isPremiumTopic) {
      console.log(`   ⚠️  WARNING: Word might be from premium theme!`);
    } else {
      console.log(`   ✅ Correctly from general theme`);
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    console.log(`   Stack: ${error.stack?.split('\n')[0]}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test 2: Word Generation - Science Theme
  console.log('\n🔬 TEST 2: Word Generation - Science Safari (Medium)');
  console.log('-'.repeat(60));
  try {
    const startTime = Date.now();
    const result = await generateWord({ 
      difficulty: 'medium',
      theme: 'science-safari'
    });
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Success! (${duration}ms)`);
    console.log(`   Word: "${result.word}"`);
    console.log(`   Definition: "${result.definition}"`);
    console.log(`   Length: ${result.word.length} letters`);
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test 3: Word Generation with Exclusions
  console.log('\n🚫 TEST 3: Word Generation with Exclusions');
  console.log('-'.repeat(60));
  try {
    const excludeWords = ['example', 'puzzle', 'mystery', 'challenge'];
    console.log(`   Excluding: ${excludeWords.join(', ')}`);
    
    const startTime = Date.now();
    const result = await generateWord({ 
      difficulty: 'easy',
      theme: 'current',
      excludeWords: excludeWords
    });
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Success! (${duration}ms)`);
    console.log(`   Word: "${result.word}"`);
    
    if (excludeWords.includes(result.word.toLowerCase())) {
      console.log(`   ❌ ERROR: Generated excluded word!`);
    } else {
      console.log(`   ✅ Correctly avoided excluded words`);
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test 4: Hint Generation - Basic
  console.log('\n💡 TEST 4: Hint Generation - Basic (2 letters)');
  console.log('-'.repeat(60));
  try {
    const testWord = 'example';
    console.log(`   Word: "${testWord}"`);
    console.log(`   Incorrect guesses: "xyz"`);
    console.log(`   Letters to reveal: 2`);
    
    const startTime = Date.now();
    const result = await generateHint({
      word: testWord,
      wordLength: testWord.length,
      incorrectGuesses: 'xyz',
      lettersToReveal: 2
    });
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Success! (${duration}ms)`);
    console.log(`   Hint: "${result.hint}"`);
    
    if (result.reasoning) {
      console.log(`   Reasoning: ${result.reasoning}`);
    }
    
    if (result.chosenLetters) {
      console.log(`   Chosen Letters: [${result.chosenLetters.join(', ')}]`);
    }
    
    // Validate hint
    const uniqueLetters = new Set(result.hint.split('').filter(c => c !== '_').map(c => c.toLowerCase()));
    const hintLength = result.hint.length;
    const wordLength = testWord.length;
    
    console.log(`\n   📊 Validation:`);
    console.log(`      - Hint length: ${hintLength} (expected: ${wordLength}) ${hintLength === wordLength ? '✅' : '❌'}`);
    console.log(`      - Unique letters: ${uniqueLetters.size} (expected: 2) ${uniqueLetters.size === 2 ? '✅' : '❌'}`);
    console.log(`      - Letters revealed: ${Array.from(uniqueLetters).join(', ')}`);
    
    // Check for forbidden letters
    const hasForbidden = 'xyz'.split('').some(letter => 
      result.hint.toLowerCase().includes(letter)
    );
    console.log(`      - Contains forbidden letters: ${hasForbidden ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
    
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    console.log(`   Stack: ${error.stack?.split('\n').slice(0, 3).join('\n')}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test 5: Hint Generation - Complex Word
  console.log('\n💡 TEST 5: Hint Generation - Complex Word (3 letters)');
  console.log('-'.repeat(60));
  try {
    const testWord = 'serendipity';
    console.log(`   Word: "${testWord}"`);
    console.log(`   Incorrect guesses: "abc"`);
    console.log(`   Letters to reveal: 3`);
    
    const startTime = Date.now();
    const result = await generateHint({
      word: testWord,
      wordLength: testWord.length,
      incorrectGuesses: 'abc',
      lettersToReveal: 3
    });
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Success! (${duration}ms)`);
    console.log(`   Hint: "${result.hint}"`);
    
    // Validate
    const uniqueLetters = new Set(result.hint.split('').filter(c => c !== '_').map(c => c.toLowerCase()));
    console.log(`   Unique letters revealed: ${uniqueLetters.size} (expected: 3) ${uniqueLetters.size === 3 ? '✅' : '❌'}`);
    console.log(`   Hint length: ${result.hint.length} (expected: ${testWord.length}) ${result.hint.length === testWord.length ? '✅' : '❌'}`);
    
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test 6: Performance Test
  console.log('\n⚡ TEST 6: Performance Test (5 words)');
  console.log('-'.repeat(60));
  
  const times: number[] = [];
  for (let i = 1; i <= 5; i++) {
    try {
      const startTime = Date.now();
      await generateWord({ difficulty: 'easy', theme: 'current' });
      const duration = Date.now() - startTime;
      times.push(duration);
      console.log(`   Word ${i}: ${duration}ms`);
    } catch (error: any) {
      console.log(`   Word ${i}: ❌ Failed`);
    }
  }
  
  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`\n   📊 Statistics:`);
    console.log(`      - Average: ${avg.toFixed(0)}ms`);
    console.log(`      - Min: ${min}ms`);
    console.log(`      - Max: ${max}ms`);
    console.log(`      - Performance: ${avg < 2000 ? '✅ Good' : avg < 5000 ? '⚠️  Acceptable' : '❌ Slow'}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ DEBUG COMPLETE!\n');
  
  // Summary
  console.log('📋 SUMMARY:');
  console.log('   - Check all tests passed');
  console.log('   - Verify performance is acceptable');
  console.log('   - Ensure theme separation works');
  console.log('   - Confirm hint validation works');
  console.log('');
}

debugFlows().catch(error => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
