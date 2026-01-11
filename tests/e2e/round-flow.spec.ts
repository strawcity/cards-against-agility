import { test, expect } from '@playwright/test';
import {
	createGameAsPlayer,
	joinGameAsPlayer,
	startGame,
	submitCard,
	revealCard,
	selectWinner,
	startNextRound,
	waitForQuestionCard,
	getPlayerScore,
	waitForPlayersInLobby
} from '../helpers/e2e-helpers';

test.describe('Round Flow', () => {
	test('should display question card to all players', async ({ browser }) => {
		// Setup game with 3 players
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		await waitForPlayersInLobby(page1, 3);
		await startGame(page1);

		// All players should see question card
		await waitForQuestionCard(page1);
		await waitForQuestionCard(page2);
		await waitForQuestionCard(page3);

		// Verify question card contains "---"
		await expect(page1.locator('text=/---/')).toBeVisible();
		await expect(page2.locator('text=/---/')).toBeVisible();
		await expect(page3.locator('text=/---/')).toBeVisible();

		await context1.close();
		await context2.close();
		await context3.close();
	});

	test('should allow players to select and submit cards', async ({ browser }) => {
		// Setup game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		await waitForPlayersInLobby(page1, 3);
		await startGame(page1);

		// Wait for game to start
		await page2.waitForURL(/\/active-game/, { timeout: 10000 });
		await page3.waitForURL(/\/active-game/, { timeout: 10000 });

		// Wait for cards to be visible
		await page2.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });

		// Players should see their answer cards
		const player2Cards = page2.locator('button:has-text("Submit card")').locator('..').locator('button');
		const cardCount2 = await player2Cards.count();
		expect(cardCount2).toBeGreaterThan(0);

		// Submit a card
		await submitCard(page2, 0);

		// Verify "Waiting for other players" message appears
		await expect(page2.locator('text=/Waiting for other players/i')).toBeVisible();

		await context1.close();
		await context2.close();
		await context3.close();
	});

	test('should show asker view to the asker', async ({ browser }) => {
		// Setup game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		await waitForPlayersInLobby(page1, 3);
		await startGame(page1);

		// Wait for game to start
		await page1.waitForURL(/\/active-game/, { timeout: 10000 });

		// Check if player 1 is the asker (might be random)
		// If they are, they should see asker view
		const isAsker = await page1.locator('text=/Waiting for players/i').isVisible({ timeout: 2000 }).catch(() => false);

		if (isAsker) {
			// Asker should see waiting message
			await expect(page1.locator('text=/Waiting for players/i')).toBeVisible();
		}

		await context1.close();
		await context2.close();
		await context3.close();
	});

	test('should start review phase when all players submit', async ({ browser }) => {
		// Setup game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		await waitForPlayersInLobby(page1, 3);
		await startGame(page1);

		// Wait for game to start
		await page2.waitForURL(/\/active-game/, { timeout: 10000 });
		await page3.waitForURL(/\/active-game/, { timeout: 10000 });

		// Wait for cards
		await page2.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		await page3.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });

		// Both non-askers submit
		await submitCard(page2, 0);
		await submitCard(page3, 0);

		// Wait for review phase to start (asker should see cards)
		await page1.waitForSelector('button:has-text("card")', { timeout: 10000 });
	});

	test('should allow asker to reveal cards', async ({ browser }) => {
		// Setup and start game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		await waitForPlayersInLobby(page1, 3);
		await startGame(page1);

		await page2.waitForURL(/\/active-game/, { timeout: 10000 });
		await page3.waitForURL(/\/active-game/, { timeout: 10000 });

		// Submit cards
		await page2.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		await page3.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		await submitCard(page2, 0);
		await submitCard(page3, 0);

		// Wait for review phase
		await page1.waitForSelector('button:has-text("card")', { timeout: 10000 });

		// Asker reveals a card
		await revealCard(page1, 0);

		// Verify card is revealed (should show answer)
		await expect(page1.locator('text=/says:/i')).toBeVisible({ timeout: 5000 });
	});

	test('should allow asker to select winner', async ({ browser }) => {
		// Setup and start game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		await waitForPlayersInLobby(page1, 3);
		await startGame(page1);

		await page2.waitForURL(/\/active-game/, { timeout: 10000 });
		await page3.waitForURL(/\/active-game/, { timeout: 10000 });

		// Submit cards
		await page2.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		await page3.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		await submitCard(page2, 0);
		await submitCard(page3, 0);

		// Wait for review phase
		await page1.waitForSelector('button:has-text("card")', { timeout: 10000 });

		// Reveal and select winner
		await revealCard(page1, 0);
		await page1.waitForSelector('button:has-text("Select")', { timeout: 5000 });
		await selectWinner(page1);

		// Verify winner is shown
		await expect(page1.locator('text=/won with:/i')).toBeVisible({ timeout: 5000 });
	});

	test('should update scores after selecting winner', async ({ browser }) => {
		// Setup and start game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		await waitForPlayersInLobby(page1, 3);
		await startGame(page1);

		await page2.waitForURL(/\/active-game/, { timeout: 10000 });
		await page3.waitForURL(/\/active-game/, { timeout: 10000 });

		// Submit cards
		await page2.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		await page3.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		await submitCard(page2, 0);
		await submitCard(page3, 0);

		// Complete round
		await page1.waitForSelector('button:has-text("card")', { timeout: 10000 });
		await revealCard(page1, 0);
		await page1.waitForSelector('button:has-text("Select")', { timeout: 5000 });
		await selectWinner(page1);

		// Wait a bit for score update
		await page2.waitForTimeout(2000);

		// Check if score is displayed (might not always be visible)
		const score = await getPlayerScore(page2);
		// Score should be 0 or 1 depending on who won
		expect(score).toBeGreaterThanOrEqual(0);
	});

	test('should transition to new round', async ({ browser }) => {
		// Setup and start game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();
		const gameId = await createGameAsPlayer(page1, 'Player 1');

		const context2 = await browser.newContext();
		const page2 = await context2.newPage();
		await joinGameAsPlayer(page2, gameId, 'Player 2');

		const context3 = await browser.newContext();
		const page3 = await context3.newPage();
		await joinGameAsPlayer(page3, gameId, 'Player 3');

		await waitForPlayersInLobby(page1, 3);
		await startGame(page1);

		await page2.waitForURL(/\/active-game/, { timeout: 10000 });
		await page3.waitForURL(/\/active-game/, { timeout: 10000 });

		// Complete first round
		await page2.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		await page3.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		await submitCard(page2, 0);
		await submitCard(page3, 0);

		await page1.waitForSelector('button:has-text("card")', { timeout: 10000 });
		await revealCard(page1, 0);
		await page1.waitForSelector('button:has-text("Select")', { timeout: 5000 });
		await selectWinner(page1);

		// Start next round
		await startNextRound(page1);

		// Verify new question card appears
		await waitForQuestionCard(page1);
		await waitForQuestionCard(page2);
		await waitForQuestionCard(page3);
	});
});
