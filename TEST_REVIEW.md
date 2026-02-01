# Full Game E2E Test Review

## Overview

This document reviews the full game e2e test (`tests/e2e/full-game-flow.spec.ts`) against the game phases documentation to identify issues and areas for improvement.

## Test Flow Analysis

The test correctly follows the game phases:
1. **Phase 1 (Lobby)**: Creates game, joins players, starts game ✓
2. **Phase 2 (Submission)**: Waits for question cards, submits cards ✓
3. **Phase 3 (Review)**: Waits for review phase to start ✓
4. **Phase 4 (Reveal)**: Reveals a card, waits for answer to be set ✓
5. **Phase 5 (Winner)**: Selects winner, waits for winner announcement ✓
6. **Phase 6 (Next Round)**: Starts next round or detects game over ✓

## Issues Identified

### Issue 1: "Start next round!" Button Check (Lines 147-165)

**Problem**: The test checks all three pages for the "Start next round!" button, but according to Phase 5, only the asker sees this button (it's in `AskerView` and only visible when `winner` is set).

**Current Code**:
```typescript
const nextRoundButton = page1.locator('button:has-text("Start next round")');
if (await nextRoundButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startNextRound(page1);
    await waitForNewRound(page1);
} else {
    // Try other pages...
}
```

**Recommendation**: Only check the asker's page (which is already identified as `askerPage` on line 101).

### Issue 2: Review Phase Fallback (Lines 102-109)

**Problem**: The fallback waits for player cards on all three pages, but according to Phase 3, only the asker sees player cards during the review phase.

**Current Code**:
```typescript
await waitForReviewPhase(askerPage).catch(() => {
    return Promise.all([
        page1.waitForSelector("button:has-text(\"'s card\")", { timeout: 10000 }).catch(() => {}),
        page2.waitForSelector("button:has-text(\"'s card\")", { timeout: 10000 }).catch(() => {}),
        page3.waitForSelector("button:has-text(\"'s card\")", { timeout: 10000 }).catch(() => {})
    ]);
});
```

**Recommendation**: The fallback should only check the asker's page, or better yet, the test should fail properly if `waitForReviewPhase` fails on the asker's page.

### Issue 3: Game Over Check Timing (Lines 63-68)

**Problem**: The test checks for game over before submissions, but according to Phase 6, game over only occurs after a winner is selected (Phase 5).

**Current Code**:
```typescript
// Check if we're in a round (not game over)
const isGameOver = await page1.locator('text=/Game over/i').isVisible({ timeout: 1000 }).catch(() => false);
if (isGameOver) {
    gameEnded = true;
    break;
}
```

**Recommendation**: This check is harmless but unnecessary at this point. The game over check after winner selection (line 141) is the correct place.

### Issue 4: Inconsistent Asker Page Usage (Second Test, Line 396)

**Problem**: The "transition to new round" test determines the asker (lines 382-383) but doesn't use it for waiting for review phase.

**Current Code** (lines 382-396):
```typescript
const page2IsAsker = await isPlayerAsker(page2);
const page3IsAsker = await isPlayerAsker(page3);
// ... submissions ...
await waitForReviewPhase(page1); // Assumes page1 is asker!
```

**Recommendation**: Determine if page1 is the asker and use the correct asker page.

## Recommendations

1. **Only check asker's page for "Start next round!" button**: Use the `askerPage` variable that's already determined.

2. **Simplify review phase fallback**: Either remove the fallback or make it only check the asker's page.

3. **Remove early game over check**: The check at line 64-68 is unnecessary since game over can only occur after a winner is selected.

4. **Consistently use asker page**: In all tests, once the asker is determined, use that page for asker-specific operations (review phase, reveal, select winner, start next round).

## Test Structure Improvements

The test structure is good overall, but could benefit from:

1. **Helper function for round completion**: Extract the round completion logic (submission → review → reveal → select winner) into a helper function.

2. **Better error handling**: Currently uses try/catch blocks that might hide real issues. Consider failing fast when unexpected errors occur.

3. **Clearer phase transitions**: Add comments referencing the game phases for better documentation.

## Positive Aspects

1. ✅ Correctly identifies the asker using the `isPlayerAsker` helper
2. ✅ Properly waits for each phase transition
3. ✅ Handles game over condition correctly (after winner selection)
4. ✅ Uses appropriate timeouts and waits
5. ✅ Follows the documented game flow phases correctly
