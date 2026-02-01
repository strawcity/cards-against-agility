import type { Page, BrowserContext } from '@playwright/test';

/**
 * Creates a player context with a new browser context
 */
export async function createPlayer(
	context: BrowserContext,
	playerName: string
): Promise<{ page: Page; playerId: string }> {
	const page = await context.newPage();
	await page.goto('/');

	// Get player ID by connecting
	const response = await page.request.get('/api/connect');
	const data = await response.json();
	const playerId = data.playerId;

	return { page, playerId };
}

/**
 * Joins a game as a player
 */
export async function joinGameAsPlayer(
	page: Page,
	gameId: string,
	nickname: string,
	jobTitle: string = 'Senior Developer'
): Promise<void> {
	await page.goto(`/lobby/${gameId}`);

	// Wait for the join form to appear
	await page.waitForSelector('input[class*="border-b"]');

	// Enter nickname
	await page.fill('input[class*="border-b"]', nickname);

	// Click join button
	await page.click('button:has-text("Save nickname and join lobby")');

	// Wait for socket connection and join event
	// Wait for player to appear in lobby instead of fixed timeout
	try {
		await page.waitForSelector('p.font-semibold', { timeout: 10000 });
	} catch {
		// If selector doesn't appear, wait a bit for socket connection
		await page.waitForTimeout(1000);
	}
}

/**
 * Creates a game as the first player
 */
export async function createGameAsPlayer(
	page: Page,
	nickname: string,
	jobTitle: string = 'Senior Developer'
): Promise<string> {
	await page.goto('/');

	// Wait for the form
	await page.waitForSelector('input[class*="border-b"]', { timeout: 10000 });

	// Enter nickname
	await page.fill('input[class*="border-b"]', nickname);

	// Set up navigation promise BEFORE clicking the button
	const navigationPromise = page.waitForURL(/\/lobby\/[a-zA-Z0-9]+/, { timeout: 30000 });

	// Click create button
	await page.click('button:has-text("Save nickname and open a lobby")');

	// Wait for navigation to lobby
	// The navigation happens after:
	// 1. Socket connects
	// 2. 'connected' event is received
	// 3. 'create-game' is emitted
	// 4. Server responds with 'create-game' event
	// 5. +layout.svelte navigates to lobby
	await navigationPromise;

	// Extract game ID from URL
	const url = page.url();
	const gameId = url.split('/lobby/')[1];

	if (!gameId) {
		throw new Error(`Failed to extract game ID from URL: ${url}`);
	}

	return gameId;
}

/**
 * Starts the game (must be called by creator)
 */
export async function startGame(page: Page): Promise<void> {
	// Wait for start button to be visible and enabled
	await page.waitForSelector('button:has-text("Start game")', { state: 'visible' });

	// Set up navigation promise BEFORE clicking
	const navigationPromise = page.waitForURL('/active-game', { timeout: 30000 });

	await page.click('button:has-text("Start game")');

	// Wait for navigation to active game
	// The navigation happens after socket receives 'start-game' event
	// which includes answerCards, questionCard, etc.
	await navigationPromise;

	// Also wait for question card to appear to ensure game fully loaded
	await waitForQuestionCard(page);
}

/**
 * Submits a card as a player (only works for non-asker players).
 * Uses the first card by default (cardIndex 0) so tests are deterministic.
 */
export async function submitCard(page: Page, cardIndex: number = 0): Promise<void> {
	try {
		await page.bringToFront();
		// Check if game is over - if so, don't try to submit
		const gameOver = await isGameOver(page);
		if (gameOver) {
			return; // Game is over, skip submission
		}

		// Check if player is the asker (they see "Waiting for players" instead of cards)
		const isAsker = await isPlayerAsker(page);
		if (isAsker) {
			// Asker doesn't submit cards, skip
			return;
		}

		// Wait for Submit button and scope card lookup to its container (avoids wrong div when layout has multiple flex containers)
		const submitBtn = page.locator('button:has-text("Submit card")').first();
		await submitBtn.waitFor({ state: 'visible', timeout: 15000 });
		const cardContainer = page
			.locator('div.flex.flex-col.items-center')
			.filter({ has: submitBtn })
			.first();
		const cardButtons = cardContainer
			.locator('div.flex')
			.first()
			.locator('button')
			.filter({
				has: page.locator('h3')
			});
		await cardButtons.first().waitFor({ state: 'visible', timeout: 10000 });
		const cardCount = await cardButtons.count();

		if (cardCount > 0 && cardIndex < cardCount) {
			await cardButtons.nth(cardIndex).evaluate((el: HTMLElement) => el.click());
			await page.waitForTimeout(500); // let Svelte update selectedCard before submit
		}

		await submitBtn.scrollIntoViewIfNeeded();
		// Trigger click in page context so Svelte's on:click handler runs (avoids Playwright click not firing in multi-page tests)
		await submitBtn.evaluate((el: HTMLElement) => el.click());
		await page.waitForTimeout(200); // allow DOM update before caller's waitForCardSubmission
	} catch (error: any) {
		// Handle page closed, game over, or other errors gracefully
		if (error.message?.includes('Target page') || error.message?.includes('closed')) {
			return; // Page was closed, skip
		}
		// Check if game is over - if so, that's fine, just return
		const gameOver = await isGameOver(page).catch(() => false);
		if (gameOver) {
			return; // Game is over, skip submission
		}
		throw error;
	}
}

/**
 * Reveals a card as the asker (first player's card by default, playerIndex 0).
 */
export async function revealCard(page: Page, playerIndex: number = 0): Promise<void> {
	try {
		// Wait for cards to be clickable using waitForFunction (more reliable)
		await page.waitForFunction(
			() => {
				const buttons = Array.from(document.querySelectorAll('button'));
				return buttons.some((btn) => {
					// Check for border-dashed class (most reliable)
					if (btn.classList.contains('border-dashed')) return true;
					// Check for "'s card" pattern (any player name)
					const text = btn.textContent || '';
					return text.includes("'s card") && !text.includes('Submit');
				});
			},
			{ timeout: 10000 }
		);

		// Now find the player cards - use evaluate to get all matching buttons
		const cardIndices = await page.evaluate(() => {
			const buttons = Array.from(document.querySelectorAll('button'));
			const indices: number[] = [];
			buttons.forEach((btn, index) => {
				// Check for border-dashed class (most reliable)
				if (btn.classList.contains('border-dashed')) {
					indices.push(index);
				} else {
					// Check for "'s card" pattern (any player name)
					const text = btn.textContent || '';
					if (text.includes("'s card") && !text.includes('Submit')) {
						indices.push(index);
					}
				}
			});
			return indices;
		});

		if (cardIndices.length === 0) {
			throw new Error('No player cards found for reveal');
		}

		const cardCount = cardIndices.length;

		if (cardCount > 0 && playerIndex < cardCount) {
			// Get the question card content before clicking to detect change
			const questionCard = page.locator('div.bg-blue-700.w-52.h-64 h3');
			const initialContent = await questionCard.textContent().catch(() => '');

			// Click the button at the found index using evaluate
			await page.evaluate((index) => {
				const buttons = Array.from(document.querySelectorAll('button'));
				const cardButtons = buttons.filter((btn) => {
					if (btn.classList.contains('border-dashed')) return true;
					const text = btn.textContent || '';
					return text.includes("'s card") && !text.includes('Submit');
				});
				if (cardButtons[index]) {
					(cardButtons[index] as HTMLButtonElement).click();
				}
			}, playerIndex);

			// Wait for socket event to propagate and answerInFocus.answer to be set
			// Note: "says:" text only appears in PlayingCardView (non-askers), not in AskerView (asker)
			// Since revealCard is called on the asker's page, we check for:
			// 1. Question card content changes (answer is displayed in question card)
			// 2. Select button becomes enabled (answerInFocus.answer is set)
			try {
				await Promise.race([
					// Option 1: Question card content changes (answer is displayed)
					page.waitForFunction(
						(initial) => {
							const questionCard = document.querySelector('div.bg-blue-700.w-52.h-64 h3');
							if (!questionCard) return false;
							const currentContent = questionCard.textContent || '';
							// Answer is revealed when content changes from initial
							return currentContent !== initial && currentContent.length > 0;
						},
						initialContent || '',
						{ timeout: 15000 }
					),
					// Option 2: Select button becomes enabled (answerInFocus.answer is set)
					// This is the most reliable indicator for the asker view
					page.waitForFunction(
						() => {
							const buttons = Array.from(document.querySelectorAll('button'));
							const selectButton = buttons.find((btn) => {
								const text = btn.textContent || '';
								return text.includes('Select') && text.includes('answer as the winner');
							});
							if (!selectButton) return false;
							return !(selectButton as HTMLButtonElement).disabled;
						},
						{ timeout: 15000 }
					)
				]);
			} catch (e) {
				// If all fail, wait a bit more for socket event to propagate
				await page.waitForTimeout(1000);
				// Then verify the button is enabled, throw if not
				const isEnabled = await page.evaluate(() => {
					const buttons = Array.from(document.querySelectorAll('button'));
					const selectButton = buttons.find((btn) => {
						const text = btn.textContent || '';
						return text.includes('Select') && text.includes('answer as the winner');
					});
					return selectButton ? !(selectButton as HTMLButtonElement).disabled : false;
				});
				if (!isEnabled) {
					throw new Error('Answer was not set after revealing card');
				}
			}
		}
	} catch (error: any) {
		// Handle page closed or other errors gracefully
		if (error.message?.includes('Target page') || error.message?.includes('closed')) {
			return; // Page was closed, skip
		}
		throw error;
	}
}

/**
 * Waits for answer to be set (indicated by select winner button being enabled)
 */
export async function waitForAnswerToBeSet(page: Page, timeout: number = 10000): Promise<void> {
	// Wait for button to be enabled (answerInFocus.answer is set)
	await page.waitForFunction(
		() => {
			// Find button containing "Select" and "answer as the winner" text
			const buttons = Array.from(document.querySelectorAll('button'));
			const selectButton = buttons.find((btn) => {
				const text = btn.textContent || '';
				return text.includes('Select') && text.includes('answer as the winner');
			});
			if (!selectButton) return false;
			return !(selectButton as HTMLButtonElement).disabled;
		},
		{ timeout }
	);
}

/**
 * Selects a winner as the asker
 */
export async function selectWinner(page: Page): Promise<void> {
	// Wait for select winner button - use more specific selector
	// The button text is "Select {player}'s answer as the winner"
	const selectButton = page.locator('button:has-text("Select"):has-text("answer as the winner")');

	// Wait for button to be visible
	await selectButton.waitFor({ state: 'visible', timeout: 15000 });

	// Wait for button to be enabled (answerInFocus.answer must be set)
	// Retry up to 10 times with 200ms delay
	for (let i = 0; i < 10; i++) {
		const isEnabled = await selectButton.isEnabled();
		if (isEnabled) {
			break;
		}
		await page.waitForTimeout(200);
	}

	// Final check - ensure button is enabled before clicking
	const isEnabled = await selectButton.isEnabled();
	if (!isEnabled) {
		throw new Error('Select winner button is not enabled - answerInFocus.answer may not be set');
	}

	await selectButton.click();

	// Wait for state update after clicking
	await page.waitForTimeout(500);
}

/**
 * Starts the next round
 */
export async function startNextRound(page: Page): Promise<void> {
	// Check if game is over - if so, don't try to start next round
	const gameOver = await isGameOver(page).catch(() => false);
	if (gameOver) {
		return; // Game is over, no next round button
	}

	try {
		// Wait for next round button
		await page.waitForSelector('button:has-text("Start next round")', { timeout: 10000 });
		await page.click('button:has-text("Start next round")');
	} catch (error: any) {
		// Handle page closed or button not found (might be game over)
		if (error.message?.includes('Target page') || error.message?.includes('closed')) {
			return; // Page was closed, skip
		}
		// Check if game is over instead
		const gameOverAfterError = await isGameOver(page).catch(() => false);
		if (gameOverAfterError) {
			return; // Game is over, no next round button
		}
		throw error;
	}
}

/**
 * Waits for navigation to a specific route
 */
export async function waitForNavigation(
	page: Page,
	route: string | RegExp,
	timeout: number = 5000
): Promise<void> {
	if (typeof route === 'string') {
		await page.waitForURL(route, { timeout });
	} else {
		await page.waitForURL(route, { timeout });
	}
}

/**
 * Waits for a socket event by checking for UI changes
 */
export async function waitForSocketEvent(
	page: Page,
	indicator: string,
	timeout: number = 10000
): Promise<void> {
	// Wait for a specific element that indicates the event occurred
	await page.waitForSelector(indicator, { timeout, state: 'visible' });
}

/**
 * Gets the current game ID from the URL
 */
export async function getGameIdFromUrl(page: Page): Promise<string | null> {
	const url = page.url();
	const match = url.match(/\/lobby\/([a-zA-Z0-9]+)/);
	return match ? match[1] : null;
}

/**
 * Waits for players to appear in the lobby
 */
export async function waitForPlayersInLobby(page: Page, expectedCount: number): Promise<void> {
	await page.waitForFunction(
		(count) => {
			const playerElements = document.querySelectorAll('p.font-semibold');
			return playerElements.length >= count;
		},
		expectedCount,
		{ timeout: 10000 }
	);
}

/**
 * Checks if start button is visible (only for creator)
 */
export async function isStartButtonVisible(page: Page): Promise<boolean> {
	try {
		const button = page.locator('button:has-text("Start game")');
		await button.waitFor({ state: 'visible', timeout: 1000 });
		return true;
	} catch {
		return false;
	}
}

/**
 * Checks if the game is over by looking for "Game over" text
 */
export async function isGameOver(page: Page): Promise<boolean> {
	try {
		const gameOverLocator = page.locator('text=/Game over/i');
		const isVisible = await gameOverLocator.isVisible({ timeout: 1000 }).catch(() => false);
		return isVisible;
	} catch (error: any) {
		// Handle page closed or other errors gracefully
		if (error.message?.includes('Target page') || error.message?.includes('closed')) {
			return false;
		}
		return false;
	}
}

/**
 * Waits for question card to appear
 */
export async function waitForQuestionCard(page: Page): Promise<void> {
	// Check if game is over - if so, don't wait for question card
	const gameOver = await isGameOver(page).catch(() => false);
	if (gameOver) {
		return; // Game is over, skip waiting for question card
	}

	// Question card should be visible in active game
	// The question card is a div with class containing "bg-blue-700" and "w-52 h-64"
	// It contains the question text which may or may not have "---" depending on state
	try {
		// First wait for the question card container
		await page.waitForSelector('div.bg-blue-700.w-52.h-64', { timeout: 10000 });
		// Then wait a bit for content to render
		try {
			await page.waitForTimeout(500);
		} catch (e: any) {
			// Page might be closed, that's okay
			if (
				e.message?.includes('Target page') ||
				e.message?.includes('closed') ||
				e.message?.includes('Test ended')
			) {
				return;
			}
			throw e;
		}
	} catch (error: any) {
		// Handle page closed or game over gracefully
		if (
			error.message?.includes('Target page') ||
			error.message?.includes('closed') ||
			error.message?.includes('Test ended')
		) {
			return; // Page was closed, skip
		}
		// Check if game is over - if so, that's fine, just return
		const gameOverAfterError = await isGameOver(page).catch(() => false);
		if (gameOverAfterError) {
			return; // Game is over, skip waiting for question card
		}
		// Fallback: wait for any visible content that suggests game started
		try {
			await page.waitForSelector('button, h3', { timeout: 5000 });
		} catch (e: any) {
			// If page is closed, that's okay
			if (
				e.message?.includes('Target page') ||
				e.message?.includes('closed') ||
				e.message?.includes('Test ended')
			) {
				return;
			}
			throw e;
		}
	}
}

/**
 * Gets the current score from the page
 */
export async function getPlayerScore(page: Page): Promise<number> {
	try {
		const scoreElement = page.locator('text=/Points:/');
		if (await scoreElement.isVisible({ timeout: 1000 })) {
			const text = await scoreElement.textContent();
			const match = text?.match(/\d+/);
			return match ? parseInt(match[0], 10) : 0;
		}
	} catch {
		// Score might not be visible yet
	}
	return 0;
}

/**
 * Waits for game over screen
 */
export async function waitForGameOver(page: Page): Promise<void> {
	await page.waitForSelector('text=/Game over/i', { timeout: 30000 });
}

/**
 * Copies the game link to clipboard (simulated)
 */
export async function copyGameLink(page: Page): Promise<string> {
	// Click copy link button
	await page.click('button:has-text("Share a link")');

	// Wait for banner
	await page.waitForSelector('text=/copied to clipboard/i', { timeout: 2000 });

	// Return current URL as the link
	return page.url();
}

/**
 * Checks if a player is the asker
 */
export async function isPlayerAsker(page: Page): Promise<boolean> {
	try {
		// Most reliable: check for "Waiting for players" text
		const waitingText = await page
			.locator('text=/Waiting for players/i')
			.isVisible({ timeout: 2000 });
		if (waitingText) return true;

		// Fallback: check for absence of "Submit card" button
		const hasSubmitButton = await page
			.locator('button:has-text("Submit card")')
			.isVisible({ timeout: 1000 })
			.catch(() => false);
		if (!hasSubmitButton) {
			// Check for presence of player cards (AskerView)
			const hasPlayerCards = await page
				.locator('button:has-text("\'s card")')
				.isVisible({ timeout: 1000 })
				.catch(() => false);
			if (hasPlayerCards) return true;
		}

		return false;
	} catch {
		return false;
	}
}

/**
 * Waits for review phase to start
 */
export async function waitForReviewPhase(page: Page): Promise<void> {
	// Check if game is over - if so, don't wait for review phase
	const gameOver = await isGameOver(page).catch(() => false);
	if (gameOver) {
		return; // Game is over, skip waiting for review phase
	}

	try {
		// Wait for review phase indicator - could be:
		// 1. Player cards in AskerView (button with "'s card" text or border-dashed class)
		// 2. "start-card-review" socket event sets isInRetro to true
		// Wait for all indicators to ensure review phase has fully started

		// First, wait for "Waiting for players" text to disappear (indicates we're no longer in submission phase)
		// This helps ensure the state has transitioned
		try {
			await page
				.waitForFunction(
					() => {
						const waitingText = Array.from(document.querySelectorAll('*')).find((el) =>
							el.textContent?.includes('Waiting for players')
						);
						return !waitingText; // Wait until it's gone
					},
					{ timeout: 5000 }
				)
				.catch(() => {
					// If "Waiting for players" wasn't found, that's okay - maybe we're already past that phase
				});
		} catch {
			// Ignore errors - this is just a helper check
		}

		// Wait for player cards to appear using waitForFunction (more reliable than selectors)
		await page.waitForFunction(
			() => {
				// Look for buttons with border-dashed class OR buttons containing "'s card" text
				const buttons = Array.from(document.querySelectorAll('button'));
				const cardButtons = buttons.filter((btn) => {
					// Check for border-dashed class (most reliable)
					if (btn.classList.contains('border-dashed')) return true;
					// Check for "'s card" pattern (any player name)
					const text = btn.textContent || '';
					if (text.includes("'s card") && !text.includes('Submit')) return true;
					return false;
				});
				return cardButtons.length >= 1;
			},
			{ timeout: 15000 }
		);

		// Give a moment for cards to render and state to sync
		await page.waitForTimeout(500);

		// Verify at least one card is visible (already checked above, but double-check)
		const hasCards = await page.evaluate(() => {
			const buttons = Array.from(document.querySelectorAll('button'));
			return buttons.some((btn) => {
				// Check for border-dashed class (most reliable)
				if (btn.classList.contains('border-dashed')) return true;
				// Check for "'s card" pattern (any player name)
				const text = btn.textContent || '';
				return text.includes("'s card") && !text.includes('Submit');
			});
		});
		if (!hasCards) {
			// Wait a bit more and check again
			await page.waitForTimeout(500);
			await page.waitForFunction(
				() => {
					const buttons = Array.from(document.querySelectorAll('button'));
					return buttons.some((btn) => {
						if (btn.classList.contains('border-dashed')) return true;
						const text = btn.textContent || '';
						return text.includes("'s card") && !text.includes('Submit');
					});
				},
				{ timeout: 5000 }
			);
		}
	} catch (error: any) {
		// Handle page closed or game over gracefully
		if (
			error.message?.includes('Target page') ||
			error.message?.includes('closed') ||
			error.message?.includes('Test ended')
		) {
			return; // Page was closed, skip
		}

		// Check if game is over - if so, that's fine, just return
		const gameOverAfterError = await isGameOver(page).catch(() => false);
		if (gameOverAfterError) {
			return; // Game is over, skip waiting for review phase
		}

		// Check if we're still in submission phase to provide better error message
		try {
			const stillInSubmission = await page.evaluate(() => {
				// Check for "Submit card" button (indicates still in submission phase)
				const submitButton = document.querySelector('button:has-text("Submit card")');
				if (submitButton) return true;

				// Check for "Waiting for other players" text (indicates submission phase)
				const allText = document.body.textContent || '';
				if (allText.includes('Waiting for other players')) return true;

				return false;
			});

			if (stillInSubmission) {
				throw new Error(
					'waitForReviewPhase timed out: Still in submission phase. ' +
						'This likely means not all non-askers have submitted their cards. ' +
						'All non-askers must submit before the review phase can start.'
				);
			}
		} catch (diagnosticError: any) {
			// If diagnostic check fails, throw the original error with diagnostic info
			if (diagnosticError.message?.includes('waitForReviewPhase timed out')) {
				throw diagnosticError;
			}
		}

		throw error;
	}
}

/**
 * Waits for card submission to complete (server-driven: "You've submitted" / "Waiting for other players", RETROSPECTIVE, or submit button gone).
 * If this times out, the submission was not reflected in the UI (default 15s).
 */
export async function waitForCardSubmission(page: Page, timeout: number = 15000): Promise<void> {
	try {
		await page.waitForFunction(
			() => {
				const allText = document.body.textContent || '';
				const buttons = Array.from(document.querySelectorAll('button'));
				if (allText.includes('Game over')) return true;
				if (allText.includes("You've submitted") || allText.includes('Waiting for other players'))
					return true;
				if (allText.includes('Submitting')) return true;
				if (allText.includes('RETROSPECTIVE')) return true;
				const hasReviewPhaseButtons = buttons.some((btn) => {
					if (btn.classList.contains('border-dashed')) return true;
					const text = btn.textContent || '';
					return text.includes("'s card") && !text.includes('Submit');
				});
				if (hasReviewPhaseButtons) return true;
				const submitButton = buttons.find((btn) => {
					const text = btn.textContent || '';
					return text.includes('Submit card');
				});
				if (!submitButton) return true;
				return false;
			},
			{ timeout }
		);
	} catch (e) {
		throw new Error(
			`waitForCardSubmission timed out (${timeout}ms): submission was not reflected in UI. ` +
				"Expected server-driven \"You've submitted\" / 'Waiting for other players' / 'RETROSPECTIVE', or \"Submitting…\" / submit button gone. " +
				'Check socket connection and that client has joined the game room (join-game-room).'
		);
	}
}

/**
 * Waits for winner announcement to appear (or game over, when the winning round ends the game)
 */
export async function waitForWinnerAnnouncement(page: Page): Promise<void> {
	// Wait for "won with:" text, or "Game over" (when the winning round immediately ends the game)
	await page.waitForFunction(
		() => {
			const allText = document.body.textContent || '';
			// Game over - winner round ended the game; winner announcement never shows
			if (/Game over/i.test(allText)) return true;
			// Check for "won with:" pattern (normal round end)
			if (/won with:/i.test(allText)) return true;
			// Fallback: winner display
			const winnerElements = Array.from(document.querySelectorAll('*')).filter((el) => {
				const text = el.textContent || '';
				return text.includes('won') && (text.includes('with') || text.includes('Player'));
			});
			return winnerElements.length > 0;
		},
		{ timeout: 20000 }
	);
	// Wait a bit for state to fully propagate
	await page.waitForTimeout(500);
}

/**
 * Completes one round as the asker: reveal a card, set answer, select winner, wait for announcement.
 * Uses the first player's card by default (playerCardIndex 0), then selects that as the winner. Call after waitForReviewPhase(askerPage). See GAME_PHASES.md Phase 3–5.
 */
export async function completeRoundAsAsker(
	askerPage: Page,
	playerCardIndex: number = 0
): Promise<void> {
	await revealCard(askerPage, playerCardIndex);
	await waitForAnswerToBeSet(askerPage);
	await selectWinner(askerPage);
	await waitForWinnerAnnouncement(askerPage);
}

/**
 * Waits for new round to start
 */
export async function waitForNewRound(page: Page): Promise<void> {
	try {
		// Wait for new question card to appear
		await waitForQuestionCard(page);

		// Wait a bit for round state to reset
		try {
			await page.waitForTimeout(500);
		} catch (e: any) {
			// Page might be closed, that's okay
			if (
				e.message?.includes('Target page') ||
				e.message?.includes('closed') ||
				e.message?.includes('Test ended')
			) {
				return;
			}
			throw e;
		}

		// Verify we're not in review phase (no "Waiting for players" for asker, or submit button for non-asker)
		// This is a soft check - just wait for question card which indicates new round
	} catch (error: any) {
		// Handle page closed gracefully
		if (
			error.message?.includes('Target page') ||
			error.message?.includes('closed') ||
			error.message?.includes('Test ended')
		) {
			return; // Page was closed, skip
		}
		throw error;
	}
}
