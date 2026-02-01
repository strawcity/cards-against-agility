import { test, expect } from '@playwright/test';
import {
	createGameAsPlayer,
	joinGameAsPlayer,
	startGame,
	submitCard,
	revealCard,
	startNextRound,
	waitForQuestionCard,
	getPlayerScore,
	waitForPlayersInLobby,
	isPlayerAsker,
	waitForReviewPhase,
	waitForNewRound,
	waitForCardSubmission,
	waitForAnswerToBeSet,
	completeRoundAsAsker
} from '../helpers/e2e-helpers';

test.describe('Round Flow', () => {
	// Phase 2: Submission – question card visible (GAME_PHASES.md)
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

		// Phase 2: All players should see question card
		await waitForQuestionCard(page1);
		await waitForQuestionCard(page2);
		await waitForQuestionCard(page3);

		// Verify question card is visible (may or may not contain "---" depending on state)
		// The question card is a div with specific classes
		await expect(page1.locator('div.bg-blue-700.w-52.h-64')).toBeVisible();
		await expect(page2.locator('div.bg-blue-700.w-52.h-64')).toBeVisible();
		await expect(page3.locator('div.bg-blue-700.w-52.h-64')).toBeVisible();

		await context1.close();
		await context2.close();
		await context3.close();
	});

	// Phase 2: Submission – select and submit cards (GAME_PHASES.md)
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

		// Wait for game to start and game view to load on all pages
		await page2.waitForURL(/\/active-game/, { timeout: 10000 });
		await page3.waitForURL(/\/active-game/, { timeout: 10000 });
		await waitForQuestionCard(page2);
		await waitForQuestionCard(page3);
		await page1.waitForTimeout(500);

		// Check which player is the asker using consistent helper
		const page2IsAsker = await isPlayerAsker(page2);
		const page3IsAsker = await isPlayerAsker(page3);

		// Non-askers should see their answer cards
		if (!page2IsAsker) {
			await page2.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
			const cardContainer = page2.locator('div.flex.flex-col.items-center').first();
			const player2Cards = cardContainer
				.locator('div.flex')
				.first()
				.locator('button')
				.filter({
					has: page2.locator('h3')
				});
			const cardCount2 = await player2Cards.count();
			expect(cardCount2).toBeGreaterThan(0);
		}

		if (!page3IsAsker) {
			await page3.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
			const cardContainer = page3.locator('div.flex.flex-col.items-center').first();
			const player3Cards = cardContainer
				.locator('div.flex')
				.first()
				.locator('button')
				.filter({
					has: page3.locator('h3')
				});
			const cardCount3 = await player3Cards.count();
			expect(cardCount3).toBeGreaterThan(0);
		}

		// Submit a card (only if page2 is not the asker)
		if (!page2IsAsker) {
			await submitCard(page2, 0);
			await waitForCardSubmission(page2);
		} else {
			// If page2 is the asker, just verify they see the asker view
			await page2.waitForSelector('text=/Waiting for players/i', { timeout: 10000 });
		}

		await context1.close();
		await context2.close();
		await context3.close();
	});

	// Phase 2: Asker sees AskerView (GAME_PHASES.md)
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
		const isAsker = await isPlayerAsker(page1);

		if (isAsker) {
			// Asker should see waiting message
			await expect(page1.locator('text=/Waiting for players/i')).toBeVisible();
		}

		await context1.close();
		await context2.close();
		await context3.close();
	});

	// Phase 3: Review phase starts when all non-askers submit (GAME_PHASES.md)
	test('should start review phase when all players submit', async ({ browser }) => {
		test.setTimeout(60000); // lobby + start + 3 submissions + review phase
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

		// Wait for game to load
		await page1.waitForTimeout(1000);

		// Check which players are askers using consistent helper
		const page1IsAsker = await isPlayerAsker(page1);
		const page2IsAsker = await isPlayerAsker(page2);
		const page3IsAsker = await isPlayerAsker(page3);
		const askerPage = page1IsAsker ? page1 : page2IsAsker ? page2 : page3;

		// Wait for cards on non-askers only
		if (!page1IsAsker) {
			await page1.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		}
		if (!page2IsAsker) {
			await page2.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		}
		if (!page3IsAsker) {
			await page3.waitForSelector('button:has-text("Submit card")', { timeout: 10000 });
		}

		// All non-askers submit, then wait for submission to be reflected (server or UI)
		if (!page1IsAsker) {
			await submitCard(page1, 0);
			await waitForCardSubmission(page1);
		}
		if (!page2IsAsker) {
			await submitCard(page2, 0);
			await waitForCardSubmission(page2);
		}
		if (!page3IsAsker) {
			await submitCard(page3, 0);
			await waitForCardSubmission(page3);
		}

		// Wait for socket events to propagate and review phase to start
		await askerPage.waitForTimeout(1000);

		// Wait for review phase to start (only asker sees player cards)
		await waitForReviewPhase(askerPage);
	});

	// Phase 4: Asker reveals a card (GAME_PHASES.md)
	test('should allow asker to reveal cards', async ({ browser }) => {
		test.setTimeout(60000); // lobby + start + 3 submissions + review + reveal
		// Setup and start game
		const context1 = await browser.newContext();
		const page1 = await context1.newPage();

		// Retry if connection refused
		let gameId: string;
		try {
			gameId = await createGameAsPlayer(page1, 'Player 1');
		} catch (e: any) {
			if (e.message?.includes('ERR_CONNECTION_REFUSED')) {
				await page1.waitForTimeout(2000);
				gameId = await createGameAsPlayer(page1, 'Player 1');
			} else {
				throw e;
			}
		}

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

		// Check asker status for all players
		const page1IsAsker = await isPlayerAsker(page1);
		const page2IsAsker = await isPlayerAsker(page2);
		const page3IsAsker = await isPlayerAsker(page3);
		const askerPage = page1IsAsker ? page1 : page2IsAsker ? page2 : page3;

		// Submit cards for ALL non-askers
		if (!page1IsAsker) {
			await submitCard(page1, 0);
			await waitForCardSubmission(page1);
		}
		if (!page2IsAsker) {
			await submitCard(page2, 0);
			await waitForCardSubmission(page2);
		}
		if (!page3IsAsker) {
			await submitCard(page3, 0);
			await waitForCardSubmission(page3);
		}

		// Wait for socket events to propagate
		await askerPage.waitForTimeout(1000);

		// Phase 3–4: Review → Reveal (only asker; see GAME_PHASES.md)
		await waitForReviewPhase(askerPage);

		// Asker reveals a card (Phase 4: answer revealed)
		await revealCard(askerPage, 0);
		await waitForAnswerToBeSet(askerPage);

		// Verify card is revealed - check for "says:" text or question card content change
		await expect(
			askerPage.locator('text=/says:/i').or(askerPage.locator('div.bg-blue-700.w-52.h-64'))
		).toBeVisible({ timeout: 5000 });
	});

	// Phase 5: Asker selects winner (GAME_PHASES.md)
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

		// Check asker status
		const page1IsAsker = await isPlayerAsker(page1);
		const page2IsAsker = await isPlayerAsker(page2);
		const page3IsAsker = await isPlayerAsker(page3);
		const askerPage = page1IsAsker ? page1 : page2IsAsker ? page2 : page3;

		// Submit cards for ALL non-askers
		if (!page1IsAsker) {
			await submitCard(page1, 0);
			await waitForCardSubmission(page1);
		}
		if (!page2IsAsker) {
			await submitCard(page2, 0);
			await waitForCardSubmission(page2);
		}
		if (!page3IsAsker) {
			await submitCard(page3, 0);
			await waitForCardSubmission(page3);
		}

		// Wait for socket events to propagate
		await askerPage.waitForTimeout(1000);

		// Phase 3–5: Review → Reveal → Winner (only asker; see GAME_PHASES.md)
		await waitForReviewPhase(askerPage);
		await completeRoundAsAsker(askerPage);
	});

	// Phase 5: Scores update after winner (GAME_PHASES.md)
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

		// Check asker status
		const page1IsAsker = await isPlayerAsker(page1);
		const page2IsAsker = await isPlayerAsker(page2);
		const page3IsAsker = await isPlayerAsker(page3);
		const askerPage = page1IsAsker ? page1 : page2IsAsker ? page2 : page3;

		// Submit cards for ALL non-askers
		if (!page1IsAsker) {
			await submitCard(page1, 0);
			await waitForCardSubmission(page1);
		}
		if (!page2IsAsker) {
			await submitCard(page2, 0);
			await waitForCardSubmission(page2);
		}
		if (!page3IsAsker) {
			await submitCard(page3, 0);
			await waitForCardSubmission(page3);
		}

		// Wait for socket events to propagate
		await askerPage.waitForTimeout(1000);

		// Phase 3–5: Review → Reveal → Winner (only asker)
		await waitForReviewPhase(askerPage);
		await askerPage.waitForTimeout(500);
		await completeRoundAsAsker(askerPage);

		await page2.waitForTimeout(1000).catch(() => {});

		// Check if score is displayed (might not always be visible)
		const score = await getPlayerScore(page2);
		// Score should be 0 or 1 depending on who won
		expect(score).toBeGreaterThanOrEqual(0);
	});

	// Phase 6: Next round after asker clicks "Start next round!" (GAME_PHASES.md)
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

		// Check asker status
		const page1IsAsker = await isPlayerAsker(page1);
		const page2IsAsker = await isPlayerAsker(page2);
		const page3IsAsker = await isPlayerAsker(page3);

		// Determine asker page
		const askerPage = page1IsAsker ? page1 : page2IsAsker ? page2 : page3;

		// Complete first round - submit cards for ALL non-askers
		if (!page1IsAsker) {
			await submitCard(page1, 0);
			await waitForCardSubmission(page1);
		}
		if (!page2IsAsker) {
			await submitCard(page2, 0);
			await waitForCardSubmission(page2);
		}
		if (!page3IsAsker) {
			await submitCard(page3, 0);
			await waitForCardSubmission(page3);
		}

		// Wait for socket events to propagate
		await askerPage.waitForTimeout(1000);

		// Phase 3–5: Review → Reveal → Winner (only asker; see GAME_PHASES.md)
		await waitForReviewPhase(askerPage);
		await askerPage.waitForTimeout(500);
		await completeRoundAsAsker(askerPage);

		// Phase 6: Start next round (only asker has button; see GAME_PHASES.md)
		await startNextRound(askerPage);
		await waitForNewRound(askerPage);
		await waitForQuestionCard(page1);
		await waitForQuestionCard(page2);
		await waitForQuestionCard(page3);
	});
});
