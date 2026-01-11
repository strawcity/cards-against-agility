import { describe, it, expect, beforeEach } from 'vitest';
import {
	createGame,
	joinGame,
	startGame,
	submitCard,
	selectWinner,
	newRound,
	getPlayerCards,
	getPlayerScore,
	resetGameState,
	getGame
} from '../../src/lib/server/gameState';

describe('Game Flow Integration Tests', () => {
	let gameId: string;
	const playerIds = ['player1', 'player2', 'player3'];

	beforeEach(() => {
		resetGameState();
		// Create a fresh game for each test
		const game = createGame(playerIds[0], 'Player 1');
		gameId = game.id;
		joinGame(playerIds[1], 'Player 2', gameId);
		joinGame(playerIds[2], 'Player 3', gameId);
	});

	it('should complete a full round flow', () => {
		// Start game (only creator can start)
		const startedGame = startGame(gameId, playerIds[0]);
		expect(startedGame).toBeDefined();
		expect(startedGame?.questionCard).toBeTruthy();

		// Get asker
		const asker = startedGame!.players[startedGame!.currentAskerIndex];
		const nonAskers = startedGame!.players.filter((p) => p.playerId !== asker.playerId);

		// Submit cards from non-askers
		nonAskers.forEach((player) => {
			const cards = getPlayerCards(gameId, player.playerId);
			expect(cards.length).toBe(7);
			submitCard(gameId, player.playerId, cards[0]);
		});

		// Verify all submitted
		const gameAfterSubmissions = startedGame;
		expect(gameAfterSubmissions?.submittedCards.length).toBe(nonAskers.length);

		// Select winner
		const winner = nonAskers[0];
		const gameAfterWinner = selectWinner(gameId, winner.playerId);
		expect(gameAfterWinner).toBeDefined();

		// Verify score
		const winnerScore = getPlayerScore(gameId, winner.playerId);
		expect(winnerScore).toBe(1);
	});

	it('should handle multiple rounds', () => {
		const startedGame = startGame(gameId, playerIds[0]);
		expect(startedGame).toBeDefined();
		const asker = startedGame!.players[startedGame!.currentAskerIndex];
		const nonAskers = startedGame!.players.filter((p) => p.playerId !== asker.playerId);

		// First round
		nonAskers.forEach((player) => {
			const cards = getPlayerCards(gameId, player.playerId);
			submitCard(gameId, player.playerId, cards[0]);
		});
		selectWinner(gameId, nonAskers[0].playerId);

		// Start new round
		const newRoundGame = newRound(gameId);
		expect(newRoundGame?.roundNumber).toBe(2);
		expect(newRoundGame?.submittedCards.length).toBe(0);

		// Verify cards replenished
		nonAskers.forEach((player) => {
			const cards = getPlayerCards(gameId, player.playerId);
			expect(cards.length).toBeGreaterThanOrEqual(6); // At least 6 (might have 7 if replenished)
		});
	});

	it('should end game when player reaches 5 points', () => {
		const startedGame = startGame(gameId, playerIds[0]);
		expect(startedGame).toBeDefined();
		const asker = startedGame!.players[startedGame!.currentAskerIndex];
		const nonAskers = startedGame!.players.filter((p) => p.playerId !== asker.playerId);
		const winner = nonAskers[0];

		// Manually set score to 4
		startedGame!.playerScores.set(winner.playerId, 4);

		// Submit and select winner (should reach 5)
		nonAskers.forEach((player) => {
			const cards = getPlayerCards(gameId, player.playerId);
			submitCard(gameId, player.playerId, cards[0]);
		});

		const finalGame = selectWinner(gameId, winner.playerId);
		expect(finalGame?.isGameOver).toBe(true);
		expect(finalGame?.winner).toBe(winner.playerId);
	});

	it('should rotate asker each round', () => {
		const startedGame = startGame(gameId, playerIds[0]);
		expect(startedGame).toBeDefined();
		const firstAskerIndex = startedGame!.currentAskerIndex;

		// Complete first round
		const asker = startedGame!.players[firstAskerIndex];
		const nonAskers = startedGame!.players.filter((p) => p.playerId !== asker.playerId);
		nonAskers.forEach((player) => {
			const cards = getPlayerCards(gameId, player.playerId);
			submitCard(gameId, player.playerId, cards[0]);
		});
		selectWinner(gameId, nonAskers[0].playerId);

		// New round
		const newRoundGame = newRound(gameId);
		expect(newRoundGame?.currentAskerIndex).not.toBe(firstAskerIndex);
	});

	it('should handle 4+ players', () => {
		joinGame('player4', 'Player 4', gameId);
		const startedGame = startGame(gameId, playerIds[0]);
		expect(startedGame?.players.length).toBe(4);

		// All players should have cards
		startedGame!.players.forEach((player) => {
			const cards = getPlayerCards(gameId, player.playerId);
			expect(cards.length).toBe(7);
		});
	});

	it('should only allow creator to start the game', () => {
		// Creator can start
		const startedGame = startGame(gameId, playerIds[0]);
		expect(startedGame).toBeDefined();

		// Reset for next test
		resetGameState();
		const game2 = createGame(playerIds[0], 'Player 1');
		const gameId2 = game2.id;
		joinGame(playerIds[1], 'Player 2', gameId2);
		joinGame(playerIds[2], 'Player 3', gameId2);

		// Non-creator cannot start
		const startedGame2 = startGame(gameId2, playerIds[1]);
		expect(startedGame2).toBeNull();
	});

	it('should not allow starting game with less than 3 players', () => {
		resetGameState();
		const game = createGame(playerIds[0], 'Player 1');
		const smallGameId = game.id;
		joinGame(playerIds[1], 'Player 2', smallGameId);

		// Only 2 players, should not start
		const startedGame = startGame(smallGameId, playerIds[0]);
		expect(startedGame).toBeNull();
	});

	it('should complete 3+ full rounds successfully', () => {
		const startedGame = startGame(gameId, playerIds[0]);
		expect(startedGame).toBeDefined();

		// Play 3 complete rounds
		for (let round = 1; round <= 3; round++) {
			const currentGame = getGame(gameId);
			expect(currentGame?.roundNumber).toBe(round);

			const asker = currentGame!.players[currentGame!.currentAskerIndex];
			const nonAskers = currentGame!.players.filter((p) => p.playerId !== asker.playerId);

			// Submit cards
			nonAskers.forEach((player) => {
				const cards = getPlayerCards(gameId, player.playerId);
				submitCard(gameId, player.playerId, cards[0]);
			});

			// Select winner
			const winner = nonAskers[0];
			selectWinner(gameId, winner.playerId);

			// Start new round (except after round 3)
			if (round < 3) {
				newRound(gameId);
			}
		}

		// Verify final state
		const finalGame = getGame(gameId);
		expect(finalGame?.roundNumber).toBe(3);
		expect(finalGame?.submittedCards.length).toBeGreaterThan(0);
	});

	it('should end game exactly at 5 points', () => {
		const startedGame = startGame(gameId, playerIds[0]);
		expect(startedGame).toBeDefined();
		const asker = startedGame!.players[startedGame!.currentAskerIndex];
		const nonAskers = startedGame!.players.filter((p) => p.playerId !== asker.playerId);
		const winner = nonAskers[0];

		// Set score to 4
		startedGame!.playerScores.set(winner.playerId, 4);
		expect(getPlayerScore(gameId, winner.playerId)).toBe(4);

		// Complete one more round to reach 5
		nonAskers.forEach((player) => {
			const cards = getPlayerCards(gameId, player.playerId);
			submitCard(gameId, player.playerId, cards[0]);
		});

		const finalGame = selectWinner(gameId, winner.playerId);
		expect(finalGame?.isGameOver).toBe(true);
		expect(finalGame?.winner).toBe(winner.playerId);
		expect(getPlayerScore(gameId, winner.playerId)).toBe(5);
	});

	it('should properly replenish cards between rounds', () => {
		const startedGame = startGame(gameId, playerIds[0]);
		expect(startedGame).toBeDefined();
		const asker = startedGame!.players[startedGame!.currentAskerIndex];
		const nonAskers = startedGame!.players.filter((p) => p.playerId !== asker.playerId);
		const testPlayer = nonAskers[0];

		// Get initial cards
		let cards = getPlayerCards(gameId, testPlayer.playerId);
		expect(cards.length).toBe(7);

		// Submit a card
		submitCard(gameId, testPlayer.playerId, cards[0]);
		cards = getPlayerCards(gameId, testPlayer.playerId);
		expect(cards.length).toBe(6);

		// Complete round
		nonAskers.slice(1).forEach((player) => {
			const playerCards = getPlayerCards(gameId, player.playerId);
			submitCard(gameId, player.playerId, playerCards[0]);
		});
		selectWinner(gameId, testPlayer.playerId);

		// Start new round
		newRound(gameId);

		// Cards should be replenished to 7
		cards = getPlayerCards(gameId, testPlayer.playerId);
		expect(cards.length).toBe(7);
	});

	it('should handle edge case with 5 players', () => {
		resetGameState();
		const game = createGame(playerIds[0], 'Player 1');
		const largeGameId = game.id;
		joinGame(playerIds[1], 'Player 2', largeGameId);
		joinGame(playerIds[2], 'Player 3', largeGameId);
		joinGame('player4', 'Player 4', largeGameId);
		joinGame('player5', 'Player 5', largeGameId);

		const startedGame = startGame(largeGameId, playerIds[0]);
		expect(startedGame?.players.length).toBe(5);

		// All players should have 7 cards
		startedGame!.players.forEach((player) => {
			const cards = getPlayerCards(largeGameId, player.playerId);
			expect(cards.length).toBe(7);
		});

		// Verify game can proceed normally
		const asker = startedGame!.players[startedGame!.currentAskerIndex];
		const nonAskers = startedGame!.players.filter((p) => p.playerId !== asker.playerId);
		expect(nonAskers.length).toBe(4);
	});
});
