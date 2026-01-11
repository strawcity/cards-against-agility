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
		// Start game
		const startedGame = startGame(gameId);
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
		const startedGame = startGame(gameId);
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
		const startedGame = startGame(gameId);
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
		const startedGame = startGame(gameId);
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
		const startedGame = startGame(gameId);
		expect(startedGame?.players.length).toBe(4);

		// All players should have cards
		startedGame!.players.forEach((player) => {
			const cards = getPlayerCards(gameId, player.playerId);
			expect(cards.length).toBe(7);
		});
	});
});
