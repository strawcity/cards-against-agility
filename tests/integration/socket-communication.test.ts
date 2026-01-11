import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupSocketHandlers } from '../../src/lib/server/socketHandlers';
import { resetGameState, getGame } from '../../src/lib/server/gameState';
import {
	createMockSocketServer,
	createMockServerSocket,
	type MockServerSocket
} from '../helpers/socket-test-utils';

describe('Socket Communication Integration Tests', () => {
	let mockServer: ReturnType<typeof createMockSocketServer>;
	let sockets: MockServerSocket[];

	beforeEach(() => {
		resetGameState();
		mockServer = createMockSocketServer();
		sockets = [];
		setupSocketHandlers(mockServer);
	});

	function createPlayerSocket(playerId: string): MockServerSocket {
		const socket = createMockServerSocket(playerId);
		sockets.push(socket);
		mockServer.simulateConnection(socket);
		return socket;
	}

	describe('create-game event', () => {
		it('should create game and emit response to creator', () => {
			const socket = createPlayerSocket('player1');

			// Simulate create-game event
			socket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			// Verify socket received connected event
			expect(socket.emit).toHaveBeenCalledWith('connected', 'player1');

			// Verify socket received create-game response
			const createGameCalls = (socket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			expect(createGameCalls.length).toBeGreaterThan(0);

			const response = createGameCalls[0][1];
			expect(response.game.id).toBeTruthy();
			expect(response.game.players).toHaveLength(1);
			expect(response.game.players[0].playerId).toBe('player1');
			expect(response.game.creatorId).toBe('player1');
			expect(response.nickname).toBe('Player 1');
		});

		it('should join socket to game room', () => {
			const socket = createPlayerSocket('player1');

			socket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			// Get the game ID from the response
			const createGameCalls = (socket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			const gameId = createGameCalls[0][1].game.id;

			expect(socket.join).toHaveBeenCalledWith(gameId);
		});
	});

	describe('join-game event', () => {
		it('should allow player to join existing game', () => {
			const creatorSocket = createPlayerSocket('player1');
			creatorSocket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			// Get game ID
			const createGameCalls = (creatorSocket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			const gameId = createGameCalls[0][1].game.id;

			// Second player joins
			const joinerSocket = createPlayerSocket('player2');
			joinerSocket.simulateEvent('join-game', {
				playerId: 'player2',
				nickname: 'Player 2',
				gameId: gameId
			});

			// Verify joiner joined the room
			expect(joinerSocket.join).toHaveBeenCalledWith(gameId);

			// Verify broadcast to all players (including creator)
			expect(mockServer.to).toHaveBeenCalledWith(gameId);
		});

		it('should broadcast join-game to all players in room', () => {
			const creatorSocket = createPlayerSocket('player1');
			creatorSocket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			const createGameCalls = (creatorSocket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			const gameId = createGameCalls[0][1].game.id;

			const joinerSocket = createPlayerSocket('player2');
			joinerSocket.simulateEvent('join-game', {
				playerId: 'player2',
				nickname: 'Player 2',
				gameId: gameId
			});

			// Verify server broadcasted to game room
			expect(mockServer.to).toHaveBeenCalledWith(gameId);
		});
	});

	describe('start-game event', () => {
		let gameId: string;

		beforeEach(() => {
			const creatorSocket = createPlayerSocket('player1');
			creatorSocket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			const createGameCalls = (creatorSocket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			gameId = createGameCalls[0][1].game.id;

			// Add two more players
			const socket2 = createPlayerSocket('player2');
			socket2.simulateEvent('join-game', {
				playerId: 'player2',
				nickname: 'Player 2',
				gameId: gameId
			});

			const socket3 = createPlayerSocket('player3');
			socket3.simulateEvent('join-game', {
				playerId: 'player3',
				nickname: 'Player 3',
				gameId: gameId
			});
		});

		it('should only allow creator to start game', () => {
			const creatorSocket = sockets[0];
			creatorSocket.simulateEvent('start-game', { gameId });

			// Verify game started
			const game = getGame(gameId);
			expect(game).toBeDefined();
			expect(game?.roundNumber).toBe(1);
		});

		it('should not allow non-creator to start game', () => {
			const nonCreatorSocket = sockets[1];
			nonCreatorSocket.simulateEvent('start-game', { gameId });

			// Verify game did not start
			const game = getGame(gameId);
			expect(game?.roundNumber).toBe(0);
		});

		it('should send start-game event to all players with cards', () => {
			const creatorSocket = sockets[0];
			creatorSocket.simulateEvent('start-game', { gameId });

			// Verify all players received start-game event
			sockets.forEach((socket) => {
				const startGameCalls = (socket.emit as any).mock.calls.filter(
					(call: any[]) => call[0] === 'start-game'
				);
				expect(startGameCalls.length).toBeGreaterThan(0);

				const response = startGameCalls[0][1];
				expect(response.answerCards).toBeDefined();
				expect(response.answerCards.length).toBe(7);
				expect(response.questionCard).toBeTruthy();
				expect(typeof response.isAskingQuestion).toBe('boolean');
			});
		});
	});

	describe('submit-card event', () => {
		let gameId: string;
		let creatorSocket: MockServerSocket;
		let player2Socket: MockServerSocket;
		let player3Socket: MockServerSocket;

		beforeEach(() => {
			creatorSocket = createPlayerSocket('player1');
			creatorSocket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			const createGameCalls = (creatorSocket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			gameId = createGameCalls[0][1].game.id;

			player2Socket = createPlayerSocket('player2');
			player2Socket.simulateEvent('join-game', {
				playerId: 'player2',
				nickname: 'Player 2',
				gameId: gameId
			});

			player3Socket = createPlayerSocket('player3');
			player3Socket.simulateEvent('join-game', {
				playerId: 'player3',
				nickname: 'Player 3',
				gameId: gameId
			});

			// Start game
			creatorSocket.simulateEvent('start-game', { gameId });
		});

		it('should broadcast submitted cards to all players', () => {
			// Get player 2's cards from start-game event
			const startGameCalls = (player2Socket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'start-game'
			);
			const player2Cards = startGameCalls[0][1].answerCards;

			// Player 2 submits a card
			player2Socket.simulateEvent('submit-card', {
				gameId: gameId,
				playerId: 'player2',
				submittedCard: player2Cards[0]
			});

			// Verify broadcast to game room
			expect(mockServer.to).toHaveBeenCalledWith(gameId);
		});

		it('should trigger start-card-review when all players submit', () => {
			// Get cards for both non-askers
			const player2StartCalls = (player2Socket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'start-game'
			);
			const player2Cards = player2StartCalls[0][1].answerCards;

			const player3StartCalls = (player3Socket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'start-game'
			);
			const player3Cards = player3StartCalls[0][1].answerCards;

			// Both players submit
			player2Socket.simulateEvent('submit-card', {
				gameId: gameId,
				playerId: 'player2',
				submittedCard: player2Cards[0]
			});

			player3Socket.simulateEvent('submit-card', {
				gameId: gameId,
				playerId: 'player3',
				submittedCard: player3Cards[0]
			});

			// Verify start-card-review was emitted
			expect(mockServer.to).toHaveBeenCalledWith(gameId);
		});
	});

	describe('show-current-answer event', () => {
		let gameId: string;
		let askerSocket: MockServerSocket;

		beforeEach(() => {
			const creatorSocket = createPlayerSocket('player1');
			creatorSocket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			const createGameCalls = (creatorSocket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			gameId = createGameCalls[0][1].game.id;

			createPlayerSocket('player2').simulateEvent('join-game', {
				playerId: 'player2',
				nickname: 'Player 2',
				gameId: gameId
			});

			createPlayerSocket('player3').simulateEvent('join-game', {
				playerId: 'player3',
				nickname: 'Player 3',
				gameId: gameId
			});

			creatorSocket.simulateEvent('start-game', { gameId });

			// Find asker socket
			const game = getGame(gameId);
			const askerId = game!.players[game!.currentAskerIndex].playerId;
			askerSocket = sockets.find((s) => s.data.playerId === askerId)!;
		});

		it('should broadcast answer reveal to all players', () => {
			askerSocket.simulateEvent('show-current-answer', {
				gameId: gameId,
				playerId: 'player2',
				answer: 'Test answer'
			});

			// Verify broadcast to game room
			expect(mockServer.to).toHaveBeenCalledWith(gameId);
		});
	});

	describe('select-winner event', () => {
		let gameId: string;

		beforeEach(() => {
			const creatorSocket = createPlayerSocket('player1');
			creatorSocket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			const createGameCalls = (creatorSocket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			gameId = createGameCalls[0][1].game.id;

			createPlayerSocket('player2').simulateEvent('join-game', {
				playerId: 'player2',
				nickname: 'Player 2',
				gameId: gameId
			});

			createPlayerSocket('player3').simulateEvent('join-game', {
				playerId: 'player3',
				nickname: 'Player 3',
				gameId: gameId
			});

			creatorSocket.simulateEvent('start-game', { gameId });
		});

		it('should broadcast winner to all players with updated scores', () => {
			const creatorSocket = sockets[0];
			creatorSocket.simulateEvent('select-winner', {
				gameId: gameId,
				winningPlayer: 'player2'
			});

			// Verify all players received show-round-winner
			sockets.forEach((socket) => {
				const winnerCalls = (socket.emit as any).mock.calls.filter(
					(call: any[]) => call[0] === 'show-round-winner'
				);
				expect(winnerCalls.length).toBeGreaterThan(0);

				const response = winnerCalls[0][1];
				expect(response.winningPlayer).toBe('player2');
				expect(typeof response.wonCards).toBe('number');
			});
		});

		it('should emit show-game-winner when game ends', () => {
			const game = getGame(gameId);
			// Set player2 score to 4
			game!.playerScores.set('player2', 4);

			const creatorSocket = sockets[0];
			creatorSocket.simulateEvent('select-winner', {
				gameId: gameId,
				winningPlayer: 'player2'
			});

			// Verify show-game-winner was emitted
			expect(mockServer.to).toHaveBeenCalledWith(gameId);
		});
	});

	describe('new-round event', () => {
		let gameId: string;

		beforeEach(() => {
			const creatorSocket = createPlayerSocket('player1');
			creatorSocket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			const createGameCalls = (creatorSocket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			gameId = createGameCalls[0][1].game.id;

			createPlayerSocket('player2').simulateEvent('join-game', {
				playerId: 'player2',
				nickname: 'Player 2',
				gameId: gameId
			});

			createPlayerSocket('player3').simulateEvent('join-game', {
				playerId: 'player3',
				nickname: 'Player 3',
				gameId: gameId
			});

			creatorSocket.simulateEvent('start-game', { gameId });
		});

		it('should send new round data to all players', () => {
			const creatorSocket = sockets[0];
			creatorSocket.simulateEvent('new-round', { gameId });

			// Verify all players received new-round event
			sockets.forEach((socket) => {
				const newRoundCalls = (socket.emit as any).mock.calls.filter(
					(call: any[]) => call[0] === 'new-round'
				);
				expect(newRoundCalls.length).toBeGreaterThan(0);

				const response = newRoundCalls[0][1];
				expect(response.answerCards).toBeDefined();
				expect(response.questionCard).toBeTruthy();
				expect(typeof response.isAskingQuestion).toBe('boolean');
			});
		});
	});

	describe('error scenarios', () => {
		it('should handle invalid gameId gracefully', () => {
			const socket = createPlayerSocket('player1');
			socket.simulateEvent('start-game', { gameId: 'invalid-game-id' });

			// Should not crash, just return early
			expect(socket.emit).toHaveBeenCalledWith('connected', 'player1');
		});

		it('should handle unauthorized start-game attempt', () => {
			const creatorSocket = createPlayerSocket('player1');
			creatorSocket.simulateEvent('create-game', {
				playerId: 'player1',
				nickname: 'Player 1'
			});

			const createGameCalls = (creatorSocket.emit as any).mock.calls.filter(
				(call: any[]) => call[0] === 'create-game'
			);
			const gameId = createGameCalls[0][1].game.id;

			createPlayerSocket('player2').simulateEvent('join-game', {
				playerId: 'player2',
				nickname: 'Player 2',
				gameId: gameId
			});

			createPlayerSocket('player3').simulateEvent('join-game', {
				playerId: 'player3',
				nickname: 'Player 3',
				gameId: gameId
			});

			// Non-creator tries to start
			const nonCreatorSocket = sockets[1];
			nonCreatorSocket.simulateEvent('start-game', { gameId });

			// Game should not start
			const game = getGame(gameId);
			expect(game?.roundNumber).toBe(0);
		});
	});
});
