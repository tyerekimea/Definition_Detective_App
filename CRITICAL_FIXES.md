# Critical Issues - Fixes Required

## Issues Identified

1. ❌ Hint generation keeps loading forever
2. ❌ Game switches to next level without user input
3. ❌ General theme includes premium topics
4. ❌ Game takes too long to load

## Fixes to Implement

### Fix 1: Hint Generation Timeout
**Problem:** Hints take too long or hang forever
**Solution:** Add timeout and better error handling

### Fix 2: Auto-Progression Issue
**Problem:** Game auto-advances after winning
**Solution:** Already fixed with timeout ref, but may need verification

### Fix 3: Theme Separation
**Problem:** General theme includes science/history/geography
**Solution:** Update prompt to explicitly exclude premium topics

### Fix 4: Loading Performance
**Problem:** Game takes too long to load
**Solution:** Optimize word generation, add loading states

## Implementation Plan

1. Add timeout to hint generation (30 seconds max)
2. Verify win condition timeout is working
3. Update general theme prompt to exclude premium topics
4. Optimize word generation with caching
5. Add better loading indicators
