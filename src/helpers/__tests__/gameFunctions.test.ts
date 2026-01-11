import { describe, it, expect, beforeEach, vi } from 'vitest';
import { writable, get } from 'svelte/store';
import { generateJobTitle, startGame, createGame, joinGame } from '../gameFunctions';
import { io, setIo } from '../../stores/socket-store';
import { gameStore, playerStore } from '../../stores/game-store';

describe('generateJobTitle', () => {
	it('should generate a job title', () => {
		const title = generateJobTitle();
		expect(title).toBeTruthy();
		expect(typeof title).toBe('string');
		expect(title.length).toBeGreaterThan(0);
	});

	it('should include a level and role', () => {
		const title = generateJobTitle();
		const parts = title.split(' ');
		expect(parts.length).toBeGreaterThanOrEqual(2);
	});

	it('should generate different titles on multiple calls', () => {
		const titles = new Set();
		for (let i = 0; i < 50; i++) {
			titles.add(generateJobTitle());
		}
		// Should have some variety
		expect(titles.size).toBeGreaterThan(1);
	});
});

describe('startGame', () => {
	let mockSocket: any;

	beforeEach(() => {
		// Reset stores
		gameStore.set({ id: '', players: [], questionCard: '', submittedCards: [], isInRetro: false, isGameOver: false, answerInFocus: { player: '', answer: '' }, winner: '', creatorId: '' });
		playerStore.set({ playerId: '', nickname: '', answerCards: [], isAskingQuestion: false, wonCards: 0 });
		
		mockSocket = {
			emit: vi.fn(),
			connected: true
		};
		setIo(mockSocket);
	});

	it('should emit start-game event when socket is connected', () => {
		startGame('test-game-id');
		expect(mockSocket.emit).toHaveBeenCalledWith('start-game', {
			gameId: 'test-game-id'
		});
	});

	it('should not emit when socket is not available', () => {
		setIo(undefined as any);
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		startGame('test-game-id');
		expect(mockSocket.emit).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledWith('Socket not connected. Cannot start game.');
		consoleSpy.mockRestore();
	});

	it('should not emit when socket is not connected', () => {
		mockSocket.connected = false;
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		startGame('test-game-id');
		expect(mockSocket.emit).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledWith('Socket not connected. Cannot start game.');
		consoleSpy.mockRestore();
	});

	it('should work with real store using get() instead of subscription (catches the original bug)', () => {
		// This test verifies the fix: using get() synchronously gets the current value
		// The original bug was using subscription-based ioStore which could be undefined
		// when startGame() was called before the subscription fired
		
		// Test that it works when socket is set
		setIo(mockSocket);
		startGame('test-game-id');
		expect(mockSocket.emit).toHaveBeenCalled();
		
		// Test that it fails gracefully when socket is not set
		mockSocket.emit.mockClear();
		setIo(undefined as any);
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		startGame('test-game-id');
		expect(mockSocket.emit).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});

describe('createGame', () => {
	let mockSocket: any;

	beforeEach(() => {
		mockSocket = {
			emit: vi.fn(),
			connected: true
		};
		setIo(mockSocket);
	});

	it('should emit create-game event when socket is available', () => {
		createGame('player1', 'Test Player');
		expect(mockSocket.emit).toHaveBeenCalledWith('create-game', {
			playerId: 'player1',
			nickname: 'Test Player'
		});
	});

	it('should not emit when socket is not available', () => {
		setIo(undefined as any);
		createGame('player1', 'Test Player');
		expect(mockSocket.emit).not.toHaveBeenCalled();
	});
});

describe('joinGame', () => {
	let mockSocket: any;

	beforeEach(() => {
		mockSocket = {
			emit: vi.fn(),
			connected: true
		};
		setIo(mockSocket);
		playerStore.set({ playerId: 'test-player-id', nickname: '', answerCards: [], isAskingQuestion: false, wonCards: 0 });
	});

	it('should emit join-game event when socket and playerId are available', () => {
		joinGame('Test Player', 'test-game-id');
		expect(mockSocket.emit).toHaveBeenCalledWith('join-game', {
			playerId: 'test-player-id',
			nickname: 'Test Player',
			gameId: 'test-game-id'
		});
	});

	it('should not emit when socket is not available', () => {
		setIo(undefined as any);
		joinGame('Test Player', 'test-game-id');
		expect(mockSocket.emit).not.toHaveBeenCalled();
	});

	it('should not emit when playerId is not available', () => {
		playerStore.set({ playerId: '', nickname: '', answerCards: [], isAskingQuestion: false, wonCards: 0 });
		joinGame('Test Player', 'test-game-id');
		expect(mockSocket.emit).not.toHaveBeenCalled();
	});
});
