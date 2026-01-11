import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { gameStore, playerStore } from '../../src/stores/game-store';
import { io, setIo } from '../../src/stores/socket-store';
import {
	createMockSocketClient,
	resetStores,
	waitForGameStore,
	waitForPlayerStore
} from '../helpers/socket-test-utils';

describe('Store Integration Tests', () => {
	let mockSocket: ReturnType<typeof createMockSocketClient>;

	// Register socket event handlers (normally done in +layout.svelte)
	function registerSocketHandlers(socket: ReturnType<typeof createMockSocketClient>) {
		socket.on('connected', (playerId: string) => {
			playerStore.update((store) => ({ ...store, playerId }));
		});

		socket.on('create-game', (response: any) => {
			gameStore.update((store) => ({
				...store,
				id: response.game.id,
				players: response.game.players,
				creatorId: response.game.creatorId
			}));
			playerStore.update((store) => ({ ...store, nickname: response.nickname }));
		});

		socket.on('join-game', (response: any) => {
			playerStore.update((store) => ({ ...store, nickname: response.nickname }));
			gameStore.update((store) => ({
				...store,
				players: response.game.players,
				id: response.game.id,
				creatorId: response.game.creatorId
			}));
		});

		socket.on('start-game', (response: any) => {
			playerStore.update((store) => ({
				...store,
				answerCards: response.answerCards,
				isAskingQuestion: response.isAskingQuestion
			}));
			gameStore.update((store) => ({
				...store,
				questionCard: response.questionCard
			}));
		});

		socket.on('receive-answer-card', (response: any) => {
			gameStore.update((store) => ({
				...store,
				submittedCards: response.submittedCards
			}));
		});

		socket.on('start-card-review', () => {
			gameStore.update((store) => ({ ...store, isInRetro: true }));
		});

		socket.on('show-answer', (response: any) => {
			gameStore.update((store) => ({
				...store,
				answerInFocus: response.inFocusCard
			}));
		});

		socket.on('show-round-winner', (response: any) => {
			gameStore.update((store) => ({ ...store, winner: response.winningPlayer }));
			playerStore.update((store) => ({ ...store, wonCards: response.wonCards }));
		});

		socket.on('new-round', (response: any) => {
			gameStore.update((store) => ({
				...store,
				isInRetro: false,
				answerInFocus: { player: '', answer: '' },
				winner: '',
				submittedCards: [],
				questionCard: response.questionCard
			}));
			playerStore.update((store) => ({
				...store,
				answerCards: response.answerCards,
				isAskingQuestion: response.isAskingQuestion
			}));
		});

		socket.on('show-game-winner', (response: any) => {
			gameStore.update((store) => ({
				...store,
				isGameOver: true,
				winner: response.winningPlayer
			}));
		});
	}

	beforeEach(() => {
		resetStores();
		mockSocket = createMockSocketClient();
		setIo(mockSocket);
		registerSocketHandlers(mockSocket);
	});

	describe('gameStore updates', () => {
		it('should update gameStore on create-game event', async () => {
			mockSocket.simulateEvent('create-game', {
				game: {
					id: 'test-game-id',
					players: [{ playerId: 'player1', nickname: 'Player 1' }],
					creatorId: 'player1'
				},
				nickname: 'Player 1'
			});

			await waitForGameStore((store) => store.id === 'test-game-id');

			const store = get(gameStore);
			expect(store.id).toBe('test-game-id');
			expect(store.players).toHaveLength(1);
			expect(store.players[0].playerId).toBe('player1');
			expect(store.creatorId).toBe('player1');
		});

		it('should update gameStore on join-game event', async () => {
			// First create game
			mockSocket.simulateEvent('create-game', {
				game: {
					id: 'test-game-id',
					players: [{ playerId: 'player1', nickname: 'Player 1' }],
					creatorId: 'player1'
				},
				nickname: 'Player 1'
			});

			await waitForGameStore((store) => store.id === 'test-game-id');

			// Then join game
			mockSocket.simulateEvent('join-game', {
				game: {
					id: 'test-game-id',
					players: [
						{ playerId: 'player1', nickname: 'Player 1' },
						{ playerId: 'player2', nickname: 'Player 2' }
					],
					creatorId: 'player1'
				},
				nickname: 'Player 2'
			});

			await waitForGameStore((store) => store.players.length === 2);

			const store = get(gameStore);
			expect(store.players).toHaveLength(2);
			expect(store.players[1].playerId).toBe('player2');
		});

		it('should update gameStore on start-game event', async () => {
			// Setup: create and join
			mockSocket.simulateEvent('create-game', {
				game: {
					id: 'test-game-id',
					players: [{ playerId: 'player1', nickname: 'Player 1' }],
					creatorId: 'player1'
				},
				nickname: 'Player 1'
			});

			await waitForGameStore((store) => store.id === 'test-game-id');

			// Start game
			mockSocket.simulateEvent('start-game', {
				answerCards: ['card1', 'card2', 'card3'],
				isAskingQuestion: true,
				questionCard: 'Test question ---'
			});

			await waitForGameStore((store) => store.questionCard !== '');

			const store = get(gameStore);
			expect(store.questionCard).toBe('Test question ---');
		});

		it('should update gameStore on receive-answer-card event', async () => {
			mockSocket.simulateEvent('receive-answer-card', {
				submittedCards: [
					{ playerId: 'player2', cards: ['answer1'] },
					{ playerId: 'player3', cards: ['answer2'] }
				]
			});

			await waitForGameStore((store) => store.submittedCards.length > 0);

			const store = get(gameStore);
			expect(store.submittedCards).toHaveLength(2);
			expect(store.submittedCards[0].playerId).toBe('player2');
		});

		it('should update gameStore on start-card-review event', async () => {
			mockSocket.simulateEvent('start-card-review');

			await waitForGameStore((store) => store.isInRetro === true);

			const store = get(gameStore);
			expect(store.isInRetro).toBe(true);
		});

		it('should update gameStore on show-answer event', async () => {
			mockSocket.simulateEvent('show-answer', {
				inFocusCard: {
					player: 'player2',
					answer: 'Test answer'
				}
			});

			await waitForGameStore((store) => store.answerInFocus.player !== '');

			const store = get(gameStore);
			expect(store.answerInFocus.player).toBe('player2');
			expect(store.answerInFocus.answer).toBe('Test answer');
		});

		it('should update gameStore on show-round-winner event', async () => {
			mockSocket.simulateEvent('show-round-winner', {
				winningPlayer: 'player2',
				wonCards: 1
			});

			await waitForGameStore((store) => store.winner !== '');

			const store = get(gameStore);
			expect(store.winner).toBe('player2');
		});

		it('should update gameStore on show-game-winner event', async () => {
			mockSocket.simulateEvent('show-game-winner', {
				winningPlayer: 'player2'
			});

			await waitForGameStore((store) => store.isGameOver === true);

			const store = get(gameStore);
			expect(store.isGameOver).toBe(true);
			expect(store.winner).toBe('player2');
		});

		it('should update gameStore on new-round event', async () => {
			// Set initial state
			gameStore.set({
				id: 'test-game-id',
				players: [],
				questionCard: 'Old question',
				submittedCards: [{ playerId: 'player2', cards: ['card1'] }],
				isInRetro: true,
				isGameOver: false,
				answerInFocus: { player: 'player2', answer: 'answer' },
				winner: 'player2',
				creatorId: 'player1'
			});

			mockSocket.simulateEvent('new-round', {
				answerCards: ['new-card1', 'new-card2'],
				isAskingQuestion: false,
				questionCard: 'New question ---'
			});

			await waitForGameStore((store) => store.isInRetro === false);

			const store = get(gameStore);
			expect(store.isInRetro).toBe(false);
			expect(store.questionCard).toBe('New question ---');
			expect(store.submittedCards).toHaveLength(0);
		});
	});

	describe('playerStore updates', () => {
		it('should update playerStore on connected event', async () => {
			mockSocket.simulateEvent('connected', 'player1');

			await waitForPlayerStore((store) => store.playerId === 'player1');

			const store = get(playerStore);
			expect(store.playerId).toBe('player1');
		});

		it('should update playerStore on start-game event', async () => {
			mockSocket.simulateEvent('start-game', {
				answerCards: ['card1', 'card2', 'card3', 'card4', 'card5', 'card6', 'card7'],
				isAskingQuestion: false,
				questionCard: 'Test question ---'
			});

			await waitForPlayerStore((store) => store.answerCards.length > 0);

			const store = get(playerStore);
			expect(store.answerCards).toHaveLength(7);
			expect(store.isAskingQuestion).toBe(false);
		});

		it('should update playerStore on show-round-winner event', async () => {
			mockSocket.simulateEvent('show-round-winner', {
				winningPlayer: 'player1',
				wonCards: 3
			});

			await waitForPlayerStore((store) => store.wonCards > 0);

			const store = get(playerStore);
			expect(store.wonCards).toBe(3);
		});

		it('should update playerStore on new-round event', async () => {
			// Set initial state
			playerStore.set({
				playerId: 'player1',
				nickname: 'Player 1',
				answerCards: ['old-card'],
				isAskingQuestion: false,
				wonCards: 0
			});

			mockSocket.simulateEvent('new-round', {
				answerCards: ['new-card1', 'new-card2', 'new-card3'],
				isAskingQuestion: true,
				questionCard: 'New question ---'
			});

			await waitForPlayerStore((store) => store.answerCards.length === 3);

			const store = get(playerStore);
			expect(store.answerCards).toHaveLength(3);
			expect(store.isAskingQuestion).toBe(true);
		});
	});

	describe('store synchronization', () => {
		it('should maintain creatorId across multiple events', async () => {
			mockSocket.simulateEvent('create-game', {
				game: {
					id: 'test-game-id',
					players: [{ playerId: 'player1', nickname: 'Player 1' }],
					creatorId: 'player1'
				},
				nickname: 'Player 1'
			});

			await waitForGameStore((store) => store.creatorId === 'player1');

			mockSocket.simulateEvent('join-game', {
				game: {
					id: 'test-game-id',
					players: [
						{ playerId: 'player1', nickname: 'Player 1' },
						{ playerId: 'player2', nickname: 'Player 2' }
					],
					creatorId: 'player1'
				},
				nickname: 'Player 2'
			});

			await waitForGameStore((store) => store.players.length === 2);

			const store = get(gameStore);
			expect(store.creatorId).toBe('player1');
		});

		it('should update both stores when game starts', async () => {
			mockSocket.simulateEvent('create-game', {
				game: {
					id: 'test-game-id',
					players: [{ playerId: 'player1', nickname: 'Player 1' }],
					creatorId: 'player1'
				},
				nickname: 'Player 1'
			});

			await waitForGameStore((store) => store.id === 'test-game-id');

			mockSocket.simulateEvent('start-game', {
				answerCards: ['card1', 'card2', 'card3'],
				isAskingQuestion: true,
				questionCard: 'Test question ---'
			});

			await Promise.all([
				waitForGameStore((store) => store.questionCard !== ''),
				waitForPlayerStore((store) => store.answerCards.length > 0)
			]);

			const gameStoreValue = get(gameStore);
			const playerStoreValue = get(playerStore);

			expect(gameStoreValue.questionCard).toBe('Test question ---');
			expect(playerStoreValue.answerCards).toHaveLength(3);
			expect(playerStoreValue.isAskingQuestion).toBe(true);
		});
	});
});
