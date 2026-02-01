# Game Phases Documentation

This document describes the different phases of the game, their triggers, state variables, socket events, and UI representation.

## Phase 1: Lobby

**State**: No active game state

**Location**: `/lobby/[gameId]`

**Socket Events**:

- `create-game`: Creates a game, navigates to lobby
- `join-game`: Player joins, updates player list

**UI**: Player list, "Start game" button (only for creator, only when 3+ players)

**End Condition**: Creator clicks "Start game" with 3+ players

---

## Phase 2: Game Start / Submission Phase

**State**:

- `isInRetro = false`
- `isGameOver = false`
- `answerInFocus = { player: '', answer: '' }`
- `winner = ''`
- `submittedCards = []`

**Location**: `/active-game`

**Socket Event**: `start-game`

**UI**:

- **Asker**: Shows `AskerView` with "Waiting for players" message
- **Non-Askers**: Shows `PlayingCardView` with answer cards to select and submit. After submitting: "Submitting…" until server confirms; then "You've submitted. Waiting for other players." (driven by `receive-answer-card` / `submittedCards`).

**End Condition**: All non-asker players submit their cards

---

## Phase 3: Review Phase (isInRetro = true)

**State**:

- `isInRetro = true` (set from `start-card-review` payload)
- `submittedCards` contains all non-asker submissions
- `answerInFocus` still empty

**Socket Event**: `start-card-review` (emitted when all non-askers submit). Payload: `{ isInRetro: true }`; client sets state from payload.

**UI**:

- **Asker**: Shows `AskerView` with player cards (buttons with "'s card" text, border-dashed style). Cards are clickable.
- **Non-Askers**: Shows `PlayingCardView` - "You've submitted. Waiting for other players." if they already submitted (server-confirmed)

**Key Point**: The asker can now click on player cards to reveal answers

**End Condition**: Asker clicks on a player's card to reveal it

---

## Phase 4: Answer Revealed Phase

**State**:

- `isInRetro = true`
- `answerInFocus = { player: <playerId>, answer: <cardText> }` (set via `show-answer` socket event)

**Socket Event**: `show-answer` (emitted when asker clicks a card)

**UI**:

- **Asker**: Shows `AskerView` with:
  - The selected card highlighted (black background)
  - Question card shows the answer filled in (via `replaceLine`)
  - "Select [player]'s answer as the winner" button (enabled when answerInFocus.answer is set)
- **Non-Askers**: Shows `PlayingCardView` with:
  - "[Player] says:" text above question card
  - Question card shows the revealed answer

**End Condition**: Asker clicks "Select winner" button

---

## Phase 5: Winner Selected Phase

**State**:

- `isInRetro = true`
- `answerInFocus` still set
- `winner = <playerId>` (set via `show-round-winner` socket event)
- Player scores updated

**Socket Events**:

- `select-winner`: Asker selects winner
- `show-round-winner`: Broadcast to all players (payload: `winningPlayer`, `wonCards`)
- `show-game-winner`: If winner has 5+ points. Payload: `{ winningPlayer, isGameOver: true }`; client sets state from payload.

**UI**:

- **Asker**: Shows `AskerView` with:
  - "[Player] won with:" text
  - Question card shows the winning answer
  - "Start next round!" button (if game not over)
- **Non-Askers**: Shows `PlayingCardView` with:
  - "[Player] won with:" text
  - Question card shows the winning answer

**End Condition**:

- If game over (5 points): Game ends
- Otherwise: Asker clicks "Start next round!"

---

## Phase 6: Next Round / Game Over

**State**:

- `isInRetro = false`
- `answerInFocus = { player: '', answer: '' }`
- `winner = ''`
- `submittedCards = []`
- `isGameOver = true` (if winner has 5+ points)

**Socket Events**:

- `new-round`: Payload includes round-state from server (`isInRetro`, `submittedCards`, `winner`) plus per-player `answerCards`, `isAskingQuestion`, `questionCard`. Client applies payload; `answerInFocus` is cleared locally (server does not store it).
- `show-game-winner`: See Phase 5.

**UI**:

- If game over: Shows "Game over" screen
- If next round: Returns to Phase 2 (Submission Phase) with new question and rotated asker

---

## Key State Variables

- `isInRetro`: Boolean indicating if we're in review phase (asker can see/reveal cards)
- `answerInFocus`: Object with `{ player: string, answer: string }` - the currently revealed answer
- `winner`: Player ID of the round/game winner
- `isGameOver`: Boolean indicating if the game has ended
- `submittedCards`: Array of cards submitted by non-asker players
- `isAskingQuestion`: Boolean indicating if current player is the asker

---

## Important Notes

1. The "review phase" (`isInRetro = true`) starts when ALL non-asker players submit
2. During review phase, the asker can click player cards to reveal them
3. The "Select winner" button is only enabled when `answerInFocus.answer` is set (after revealing a card)
4. Non-askers see different UI in review phase - they see the revealed answers as they're clicked
5. The game loops: Submission → Review → Winner → Next Round (back to Submission)
