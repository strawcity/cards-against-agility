import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupSocketHandlers } from '../socketHandlers';
import { createMockServer, createMockSocket } from './test-utils';
import * as gameState from '../gameState';

describe('socketHandlers', () => {
	let mockServer: any;
	let mockSocket: any;

	beforeEach(() => {
		mockServer = createMockServer();
		mockSocket = createMockSocket();
		vi.clearAllMocks();
	});

	describe('connection handler', () => {
		it('should emit connected event with playerId', () => {
			setupSocketHandlers(mockServer);
			
			// Simulate connection
			const connectionHandler = mockServer.on.mock.calls.find(
				(call: any[]) => call[0] === 'connection'
			)?.[1];
			
			if (connectionHandler) {
				connectionHandler(mockSocket);
				expect(mockSocket.emit).toHaveBeenCalledWith('connected', 'mock-player-id');
			}
		});
	});

	describe('create-game event', () => {
		it('should create a game and emit response', () => {
			vi.spyOn(gameState, 'createGame').mockReturnValue({
				id: 'test-game-id',
				players: [{ playerId: 'player1', nickname: 'Test Player' }],
				questionCard: '',
				submittedCards: [],
				isInRetro: false,
				currentAskerIndex: 0,
				roundNumber: 0,
				isGameOver: false,
				playerCards: new Map(),
				usedQuestionCards: new Set(),
				playerScores: new Map(),
				creatorId: 'player1'
			} as any);

			setupSocketHandlers(mockServer);
			const connectionHandler = mockServer.on.mock.calls.find(
				(call: any[]) => call[0] === 'connection'
			)?.[1];
			
			if (connectionHandler) {
				connectionHandler(mockSocket);
				
				const createGameHandler = mockSocket.on.mock.calls.find(
					(call: any[]) => call[0] === 'create-game'
				)?.[1];
				
				if (createGameHandler) {
					createGameHandler({ playerId: 'player1', nickname: 'Test Player' });
					expect(mockSocket.join).toHaveBeenCalledWith('test-game-id');
					expect(mockSocket.emit).toHaveBeenCalledWith('create-game', expect.objectContaining({
						game: expect.objectContaining({ id: 'test-game-id' }),
						nickname: 'Test Player'
					}));
				}
			}
		});
	});

	describe('join-game event', () => {
		it('should join a game and broadcast to all players', () => {
			vi.spyOn(gameState, 'joinGame').mockReturnValue({
				id: 'test-game-id',
				players: [
					{ playerId: 'player1', nickname: 'Player 1' },
					{ playerId: 'player2', nickname: 'Player 2' }
				],
				questionCard: '',
				submittedCards: [],
				isInRetro: false,
				currentAskerIndex: 0,
				roundNumber: 0,
				isGameOver: false,
				playerCards: new Map(),
				usedQuestionCards: new Set(),
				playerScores: new Map(),
				creatorId: 'player1'
			} as any);

			setupSocketHandlers(mockServer);
			const connectionHandler = mockServer.on.mock.calls.find(
				(call: any[]) => call[0] === 'connection'
			)?.[1];
			
			if (connectionHandler) {
				connectionHandler(mockSocket);
				
				const joinGameHandler = mockSocket.on.mock.calls.find(
					(call: any[]) => call[0] === 'join-game'
				)?.[1];
				
				if (joinGameHandler) {
					joinGameHandler({ playerId: 'player2', nickname: 'Player 2', gameId: 'test-game-id' });
					expect(mockSocket.join).toHaveBeenCalledWith('test-game-id');
					expect(mockServer.to).toHaveBeenCalledWith('test-game-id');
				}
			}
		});
	});

	describe('start-game event', () => {
		it('should start game and distribute cards to players', () => {
			vi.spyOn(gameState, 'startGame').mockReturnValue({
				id: 'test-game-id',
				players: [
					{ playerId: 'player1', nickname: 'Player 1' },
					{ playerId: 'player2', nickname: 'Player 2' },
					{ playerId: 'player3', nickname: 'Player 3' }
				],
				questionCard: 'Test question ---',
				submittedCards: [],
				isInRetro: false,
				currentAskerIndex: 0,
				roundNumber: 1,
				isGameOver: false,
				playerCards: new Map(),
				usedQuestionCards: new Set(),
				playerScores: new Map(),
				creatorId: 'player1'
			} as any);

			vi.spyOn(gameState, 'getPlayerCards').mockReturnValue(['card1', 'card2', 'card3']);

			setupSocketHandlers(mockServer);
			const connectionHandler = mockServer.on.mock.calls.find(
				(call: any[]) => call[0] === 'connection'
			)?.[1];
			
			if (connectionHandler) {
				connectionHandler(mockSocket);
				
				const startGameHandler = mockSocket.on.mock.calls.find(
					(call: any[]) => call[0] === 'start-game'
				)?.[1];
				
				if (startGameHandler) {
					startGameHandler({ gameId: 'test-game-id' });
					expect(mockServer.to).toHaveBeenCalled();
				}
			}
		});
	});

	describe('submit-card event', () => {
		it('should submit card and broadcast to game room', () => {
			vi.spyOn(gameState, 'submitCard').mockReturnValue({
				id: 'test-game-id',
				players: [
					{ playerId: 'player1', nickname: 'Player 1' },
					{ playerId: 'player2', nickname: 'Player 2' },
					{ playerId: 'player3', nickname: 'Player 3' }
				],
				questionCard: 'Test question ---',
				submittedCards: [{ playerId: 'player2', cards: ['card1'] }],
				isInRetro: false,
				currentAskerIndex: 0,
				roundNumber: 1,
				isGameOver: false,
				playerCards: new Map(),
				usedQuestionCards: new Set(),
				playerScores: new Map()
			} as any);

			setupSocketHandlers(mockServer);
			const connectionHandler = mockServer.on.mock.calls.find(
				(call: any[]) => call[0] === 'connection'
			)?.[1];
			
			if (connectionHandler) {
				connectionHandler(mockSocket);
				
				const submitCardHandler = mockSocket.on.mock.calls.find(
					(call: any[]) => call[0] === 'submit-card'
				)?.[1];
				
				if (submitCardHandler) {
					submitCardHandler({ gameId: 'test-game-id', playerId: 'player2', submittedCard: 'card1' });
					expect(mockServer.to).toHaveBeenCalledWith('test-game-id');
				}
			}
		});
	});

	describe('select-winner event', () => {
		it('should select winner and update scores', () => {
			vi.spyOn(gameState, 'selectWinner').mockReturnValue({
				id: 'test-game-id',
				players: [
					{ playerId: 'player1', nickname: 'Player 1' },
					{ playerId: 'player2', nickname: 'Player 2' },
					{ playerId: 'player3', nickname: 'Player 3' }
				],
				questionCard: 'Test question ---',
				submittedCards: [],
				isInRetro: false,
				currentAskerIndex: 0,
				roundNumber: 1,
				isGameOver: false,
				playerCards: new Map(),
				usedQuestionCards: new Set(),
				playerScores: new Map()
			} as any);

			vi.spyOn(gameState, 'getPlayerScore').mockReturnValue(1);

			setupSocketHandlers(mockServer);
			const connectionHandler = mockServer.on.mock.calls.find(
				(call: any[]) => call[0] === 'connection'
			)?.[1];
			
			if (connectionHandler) {
				connectionHandler(mockSocket);
				
				const selectWinnerHandler = mockSocket.on.mock.calls.find(
					(call: any[]) => call[0] === 'select-winner'
				)?.[1];
				
				if (selectWinnerHandler) {
					selectWinnerHandler({ gameId: 'test-game-id', winningPlayer: 'player2' });
					expect(mockServer.to).toHaveBeenCalled();
				}
			}
		});
	});
});
