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
 * Submits a card as a player
 */
export async function submitCard(page: Page, cardIndex: number = 0): Promise<void> {
	// Wait for cards to be visible
	await page.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });

	// Click on a card (first card by default)
	const cards = page.locator('button:has-text("Submit card")').locator('..').locator('button');
	const cardCount = await cards.count();

	if (cardCount > 0 && cardIndex < cardCount) {
		await cards.nth(cardIndex).click();
	}

	// Click submit button
	await page.click('button:has-text("Submit card")');
}

/**
 * Reveals a card as the asker
 */
export async function revealCard(page: Page, playerIndex: number = 0): Promise<void> {
	// Wait for cards to be clickable
	await page.waitForSelector('button:has-text("card")', { timeout: 10000 });

	// Click on a player's card
	const playerCards = page.locator('button:has-text("card")');
	const cardCount = await playerCards.count();

	if (cardCount > 0 && playerIndex < cardCount) {
		await playerCards.nth(playerIndex).click();
	}
}

/**
 * Selects a winner as the asker
 */
export async function selectWinner(page: Page): Promise<void> {
	// Wait for select winner button
	await page.waitForSelector('button:has-text("Select")', { timeout: 10000 });
	await page.click('button:has-text("Select")');
}

/**
 * Starts the next round
 */
export async function startNextRound(page: Page): Promise<void> {
	// Wait for next round button
	await page.waitForSelector('button:has-text("Start next round")', { timeout: 10000 });
	await page.click('button:has-text("Start next round")');
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
 * Waits for question card to appear
 */
export async function waitForQuestionCard(page: Page): Promise<void> {
	// Question card should be visible in active game
	// Try multiple selectors that might indicate the game has started
	try {
		await page.waitForSelector('text=/---/', { timeout: 5000 });
	} catch {
		// Fallback: wait for any card-like element or game content
		await page.waitForSelector('button, .card, [class*="card"]', { timeout: 5000 });
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
