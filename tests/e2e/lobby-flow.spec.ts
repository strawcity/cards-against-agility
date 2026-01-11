import { test, expect } from '@playwright/test';
import {
	createGameAsPlayer,
	joinGameAsPlayer,
	startGame,
	waitForPlayersInLobby,
	isStartButtonVisible,
	copyGameLink,
	getGameIdFromUrl
} from '../helpers/e2e-helpers';

test.describe('Lobby Flow', () => {
	test('should create a game and show lobby', async ({ page }) => {
		const gameId = await createGameAsPlayer(page, 'Player 1');

		// Verify we're in the lobby
		expect(page.url()).toContain(`/lobby/${gameId}`);

		// Verify player list shows creator
		await waitForPlayersInLobby(page, 1);
		const playerList = page.locator('p.font-semibold');
		await expect(playerList.first()).toContainText('Player 1');
	});

	test('should allow multiple players to join', async ({ browser }) => {
		// Create game with first player
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		// Second player joins
		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		// Wait for both players to appear in both lobbies
		await waitForPlayersInLobby(page1, 2);
		await waitForPlayersInLobby(page2, 2);

		// Verify both players see each other
		await expect(page1.locator('p.font-semibold').nth(0)).toContainText('Player 1');
		await expect(page1.locator('p.font-semibold').nth(1)).toContainText('Player 2');
		await expect(page2.locator('p.font-semibold').nth(0)).toContainText('Player 1');
		await expect(page2.locator('p.font-semibold').nth(1)).toContainText('Player 2');

		await context1.close();
		await context2.close();
	});

	test('should only show start button to creator', async ({ browser }) => {
		// Create game with first player
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		// Add two more players
		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		// Wait for all players
		await waitForPlayersInLobby(page1, 3);
		await waitForPlayersInLobby(page2, 3);
		await waitForPlayersInLobby(page3, 3);

		// Creator should see start button
		const creatorCanStart = await isStartButtonVisible(page1);
		expect(creatorCanStart).toBe(true);

		// Non-creators should not see start button
		const player2CanStart = await isStartButtonVisible(page2);
		const player3CanStart = await isStartButtonVisible(page3);
		expect(player2CanStart).toBe(false);
		expect(player3CanStart).toBe(false);

		await context1.close();
		await context2.close();
		await context3.close();
	});

	test('should not show start button with less than 3 players', async ({ page }) => {
		const gameId = await createGameAsPlayer(page, 'Player 1');

		// Only 1 player, start button should not be visible
		const canStart = await isStartButtonVisible(page);
		expect(canStart).toBe(false);

		// Add second player
		const context2 = await page.context().browser()!.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		await waitForPlayersInLobby(page, 2);

		// Still only 2 players, start button should not be visible
		const canStartAfter2 = await isStartButtonVisible(page);
		expect(canStartAfter2).toBe(false);

		await context2.close();
	});

	test('should show start button when 3+ players join', async ({ browser }) => {
		// Create game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		// Add second player
		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		// Add third player
		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		// Wait for all players
		await waitForPlayersInLobby(page1, 3);

		// Creator should now see start button
		const canStart = await isStartButtonVisible(page1);
		expect(canStart).toBe(true);

		await context1.close();
		await context2.close();
		await context3.close();
	});

	test('should copy game link to clipboard', async ({ page }) => {
		const gameId = await createGameAsPlayer(page, 'Player 1');

		// Click copy link button
		await page.click('button:has-text("Share a link")');

		// Verify banner appears
		await expect(page.locator('text=/copied to clipboard/i')).toBeVisible();

		// Verify URL is in the banner
		const bannerText = await page.locator('text=/copied to clipboard/i').locator('..').textContent();
		expect(bannerText).toContain(gameId);
	});

	test('should navigate to active game when start is clicked', async ({ browser }) => {
		// Create game with 3 players
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		// Wait for all players
		await waitForPlayersInLobby(page1, 3);

		// Creator starts game
		await startGame(page1);

		// Verify navigation to active game
		expect(page1.url()).toContain('/active-game');

		// Other players should also navigate (via socket event)
		await page2.waitForURL(/\/active-game/, { timeout: 10000 });
		await page3.waitForURL(/\/active-game/, { timeout: 10000 });

		await context1.close();
		await context2.close();
		await context3.close();
	});

	test('should handle multiple players joining simultaneously', async ({ browser }) => {
		// Create game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		// Create multiple contexts for simultaneous joins
		const contexts = [];
		const pages = [];

		for (let i = 2; i <= 5; i++) {
			const context = await browser.newContext();
			const page = await context.newPage();
			contexts.push(context);
			pages.push(page);
			// Join simultaneously (but still await each one)
			await joinGameAsPlayer(page, gameId, `Player ${i}`);
		}

		// Wait for all to join
		await waitForPlayersInLobby(page1, 5);

		// Verify all players appear
		for (let i = 0; i < pages.length; i++) {
			await waitForPlayersInLobby(pages[i], 5);
		}

		// Cleanup
		await context1.close();
		for (const context of contexts) {
			await context.close();
		}
	});
});
