import { describe, it, expect, beforeEach } from 'vitest';
import {
	createGame,
	joinGame,
	getGame,
	startGame,
	submitCard,
	selectWinner,
	newRound,
	getPlayerCards,
	getPlayerScore,
	resetGameState
} from '../gameState';

describe('gameState', () => {
	beforeEach(() => {
		// Clear game state before each test
		resetGameState();
	});

	describe('createGame', () => {
		it('should create a game with a single player', () => {
			const game = createGame('player1', 'Test Player');
			expect(game).toBeDefined();
			expect(game.id).toBeTruthy();
			expect(game.players).toHaveLength(1);
			expect(game.players[0].playerId).toBe('player1');
			expect(game.players[0].nickname).toBe('Test Player');
			expect(game.playerScores.get('player1')).toBe(0);
		});

		it('should initialize game with correct default state', () => {
			const game = createGame('player1', 'Test Player');
			expect(game.questionCard).toBe('');
			expect(game.submittedCards).toHaveLength(0);
			expect(game.isInRetro).toBe(false);
			expect(game.currentAskerIndex).toBe(0);
			expect(game.roundNumber).toBe(0);
			expect(game.isGameOver).toBe(false);
		});
	});

	describe('joinGame', () => {
		it('should add a player to an existing game', () => {
			const game = createGame('player1', 'Player 1');
			const updatedGame = joinGame('player2', 'Player 2', game.id);
			
			expect(updatedGame).toBeDefined();
			expect(updatedGame?.players).toHaveLength(2);
			expect(updatedGame?.players[1].playerId).toBe('player2');
			expect(updatedGame?.players[1].nickname).toBe('Player 2');
			expect(updatedGame?.playerScores.get('player2')).toBe(0);
		});

		it('should return null for non-existent game', () => {
			const result = joinGame('player2', 'Player 2', 'nonexistent');
			expect(result).toBeNull();
		});

		it('should not add duplicate players', () => {
			const game = createGame('player1', 'Player 1');
			const updatedGame = joinGame('player1', 'Player 1', game.id);
			
			expect(updatedGame?.players).toHaveLength(1);
		});
	});

	describe('startGame', () => {
		it('should distribute 7 cards to each player', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			
			const startedGame = startGame(game.id);
			expect(startedGame).toBeDefined();
			
			const player1Cards = getPlayerCards(game.id, 'player1');
			const player2Cards = getPlayerCards(game.id, 'player2');
			const player3Cards = getPlayerCards(game.id, 'player3');
			
			expect(player1Cards).toHaveLength(7);
			expect(player2Cards).toHaveLength(7);
			expect(player3Cards).toHaveLength(7);
		});

		it('should select a question card', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			
			const startedGame = startGame(game.id);
			expect(startedGame?.questionCard).toBeTruthy();
			expect(startedGame?.questionCard.length).toBeGreaterThan(0);
		});

		it('should assign an asker', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			
			const startedGame = startGame(game.id);
			expect(startedGame?.currentAskerIndex).toBeGreaterThanOrEqual(0);
			expect(startedGame?.currentAskerIndex).toBeLessThan(startedGame!.players.length);
		});

		it('should return null if less than 3 players', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			
			const startedGame = startGame(game.id);
			expect(startedGame).toBeNull();
		});

		it('should initialize scores for all players', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			
			const startedGame = startGame(game.id);
			expect(startedGame?.playerScores.get('player1')).toBe(0);
			expect(startedGame?.playerScores.get('player2')).toBe(0);
			expect(startedGame?.playerScores.get('player3')).toBe(0);
		});
	});

	describe('submitCard', () => {
		it('should remove card from player hand', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			const initialCards = getPlayerCards(game.id, 'player2');
			const cardToSubmit = initialCards[0];
			
			submitCard(game.id, 'player2', cardToSubmit);
			
			const remainingCards = getPlayerCards(game.id, 'player2');
			expect(remainingCards).toHaveLength(6);
			expect(remainingCards).not.toContain(cardToSubmit);
		});

		it('should add card to submitted cards', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			const initialCards = getPlayerCards(game.id, 'player2');
			const cardToSubmit = initialCards[0];
			
			const updatedGame = submitCard(game.id, 'player2', cardToSubmit);
			expect(updatedGame?.submittedCards).toHaveLength(1);
			expect(updatedGame?.submittedCards[0].playerId).toBe('player2');
			expect(updatedGame?.submittedCards[0].cards).toContain(cardToSubmit);
		});

		it('should return null for invalid game', () => {
			const result = submitCard('nonexistent', 'player1', 'some card');
			expect(result).toBeNull();
		});
	});

	describe('selectWinner', () => {
		it('should increment winner score', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			// Submit cards
			const player2Cards = getPlayerCards(game.id, 'player2');
			const player3Cards = getPlayerCards(game.id, 'player3');
			submitCard(game.id, 'player2', player2Cards[0]);
			submitCard(game.id, 'player3', player3Cards[0]);
			
			const updatedGame = selectWinner(game.id, 'player2');
			expect(updatedGame).toBeDefined();
			
			const player2Score = getPlayerScore(game.id, 'player2');
			expect(player2Score).toBe(1);
		});

		it('should end game when score reaches 5', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			// Manually set score to 4
			game.playerScores.set('player2', 4);
			
			// Submit cards
			const player2Cards = getPlayerCards(game.id, 'player2');
			const player3Cards = getPlayerCards(game.id, 'player3');
			submitCard(game.id, 'player2', player2Cards[0]);
			submitCard(game.id, 'player3', player3Cards[0]);
			
			const updatedGame = selectWinner(game.id, 'player2');
			expect(updatedGame?.isGameOver).toBe(true);
			expect(updatedGame?.winner).toBe('player2');
		});
	});

	describe('newRound', () => {
		it('should replenish cards to 7', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			// Submit a card
			const player2Cards = getPlayerCards(game.id, 'player2');
			submitCard(game.id, 'player2', player2Cards[0]);
			
			// Start new round
			const newRoundGame = newRound(game.id);
			expect(newRoundGame).toBeDefined();
			
			const replenishedCards = getPlayerCards(game.id, 'player2');
			expect(replenishedCards.length).toBeGreaterThanOrEqual(7);
		});

		it('should rotate asker', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			const firstAskerIndex = game.currentAskerIndex;
			const newRoundGame = newRound(game.id);
			
			expect(newRoundGame?.currentAskerIndex).not.toBe(firstAskerIndex);
		});

		it('should reset submitted cards', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			// Submit cards
			const player2Cards = getPlayerCards(game.id, 'player2');
			const player3Cards = getPlayerCards(game.id, 'player3');
			submitCard(game.id, 'player2', player2Cards[0]);
			submitCard(game.id, 'player3', player3Cards[0]);
			
			const newRoundGame = newRound(game.id);
			expect(newRoundGame?.submittedCards).toHaveLength(0);
		});

		it('should select a new question card', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			const firstQuestion = game.questionCard;
			const newRoundGame = newRound(game.id);
			
			expect(newRoundGame?.questionCard).toBeTruthy();
			expect(newRoundGame?.questionCard).not.toBe(firstQuestion);
		});

		it('should increment round number', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			expect(game.roundNumber).toBe(1);
			const newRoundGame = newRound(game.id);
			expect(newRoundGame?.roundNumber).toBe(2);
		});
	});

	describe('getPlayerCards', () => {
		it('should return empty array for non-existent game', () => {
			const cards = getPlayerCards('nonexistent', 'player1');
			expect(cards).toHaveLength(0);
		});

		it('should return empty array for non-existent player', () => {
			const game = createGame('player1', 'Player 1');
			const cards = getPlayerCards(game.id, 'nonexistent');
			expect(cards).toHaveLength(0);
		});
	});

	describe('getPlayerScore', () => {
		it('should return 0 for new player', () => {
			const game = createGame('player1', 'Player 1');
			const score = getPlayerScore(game.id, 'player1');
			expect(score).toBe(0);
		});

		it('should return correct score after winning', () => {
			const game = createGame('player1', 'Player 1');
			joinGame('player2', 'Player 2', game.id);
			joinGame('player3', 'Player 3', game.id);
			startGame(game.id);
			
			// Submit cards and select winner
			const player2Cards = getPlayerCards(game.id, 'player2');
			const player3Cards = getPlayerCards(game.id, 'player3');
			submitCard(game.id, 'player2', player2Cards[0]);
			submitCard(game.id, 'player3', player3Cards[0]);
			selectWinner(game.id, 'player2');
			
			const score = getPlayerScore(game.id, 'player2');
			expect(score).toBe(1);
		});
	});
});
