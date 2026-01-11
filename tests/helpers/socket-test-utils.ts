import { vi, type Mock } from 'vitest';
import type { Socket as ClientSocket } from 'socket.io-client';
import type { Server, Socket as ServerSocket } from 'socket.io';
import { get } from 'svelte/store';
import { io } from '../../src/stores/socket-store';
import { gameStore, playerStore } from '../../src/stores/game-store';

/**
 * Creates a mock Socket.io client for testing
 */
export function createMockSocketClient(): ClientSocket {
	const eventHandlers = new Map<string, Set<(...args: any[]) => void>>();
	const emittedEvents: Array<{ event: string; data: any }> = [];

	return {
		connected: true,
		id: 'mock-client-id',
		emit: vi.fn((event: string, ...args: any[]) => {
			emittedEvents.push({ event, data: args[0] || {} });
			return true;
		}),
		on: vi.fn((event: string, handler: (...args: any[]) => void) => {
			if (!eventHandlers.has(event)) {
				eventHandlers.set(event, new Set());
			}
			eventHandlers.get(event)!.add(handler);
			return {} as ClientSocket;
		}),
		off: vi.fn((event: string, handler?: (...args: any[]) => void) => {
			if (handler && eventHandlers.has(event)) {
				eventHandlers.get(event)!.delete(handler);
			}
			return {} as ClientSocket;
		}),
		disconnect: vi.fn(),
		connect: vi.fn(),
		disconnected: false,
		// Helper to simulate server event
		simulateEvent: (event: string, ...args: any[]) => {
			if (eventHandlers.has(event)) {
				eventHandlers.get(event)!.forEach((handler) => handler(...args));
			}
		},
		// Helper to get emitted events
		getEmittedEvents: () => [...emittedEvents],
		// Helper to clear emitted events
		clearEmittedEvents: () => {
			emittedEvents.length = 0;
		}
	} as any as ClientSocket & {
		simulateEvent: (event: string, ...args: any[]) => void;
		getEmittedEvents: () => Array<{ event: string; data: any }>;
		clearEmittedEvents: () => void;
	};
}

/**
 * Creates a mock Socket.io server for testing
 */
export function createMockSocketServer(): Server {
	const connectedSockets = new Map<string, ServerSocket>();
	const eventHandlers = new Map<string, Set<(socket: ServerSocket, ...args: any[]) => void>>();
	// Track which sockets are in which rooms
	const roomSockets = new Map<string, Set<ServerSocket>>();

	const mockServer: any = {
		on: vi.fn((event: string, handler: (socket: ServerSocket, ...args: any[]) => void) => {
			if (event === 'connection') {
				if (!eventHandlers.has('connection')) {
					eventHandlers.set('connection', new Set());
				}
				eventHandlers.get('connection')!.add(handler);
			}
			return mockServer;
		}),
		emit: vi.fn(),
		to: vi.fn((room: string) => {
			// Return a chainable object that can emit to the room
			return {
				emit: (event: string, ...args: any[]) => {
					// Find all sockets in this room and emit to them
					const socketsInRoom = roomSockets.get(room);
					if (socketsInRoom) {
						socketsInRoom.forEach((socket) => {
							(socket.emit as any)(event, ...args);
						});
					}
					// Also check if any socket has this as their playerId (for playerId-based rooms)
					connectedSockets.forEach((socket) => {
						if ((socket as any).data?.playerId === room) {
							(socket.emit as any)(event, ...args);
						}
					});
					return mockServer;
				},
				to: mockServer.to,
				in: mockServer.in
			};
		}),
		in: vi.fn((room: string) => {
			return mockServer.to(room);
		}),
		use: vi.fn().mockReturnThis(),
		sockets: {
			sockets: connectedSockets
		},
		// Helper to simulate client connection
		simulateConnection: (socket: ServerSocket) => {
			const socketId = socket.id || `socket-${connectedSockets.size}`;
			connectedSockets.set(socketId, socket);
			if (eventHandlers.has('connection')) {
				eventHandlers.get('connection')!.forEach((handler) => handler(socket));
			}
		},
		// Helper to get connected sockets
		getConnectedSockets: () => Array.from(connectedSockets.values()),
		// Helper to track socket room membership
		_trackSocketJoin: (socket: ServerSocket, room: string) => {
			if (!roomSockets.has(room)) {
				roomSockets.set(room, new Set());
			}
			roomSockets.get(room)!.add(socket);
		}
	};

	// Override socket.join to track room membership
	const originalSimulateConnection = mockServer.simulateConnection;
	mockServer.simulateConnection = (socket: ServerSocket) => {
		originalSimulateConnection(socket);
		// Wrap socket.join to track room membership
		const originalJoin = (socket as any).join;
		(socket as any).join = vi.fn((room: string) => {
			mockServer._trackSocketJoin(socket, room);
			if (originalJoin) {
				return originalJoin(room);
			}
			return socket;
		});
	};

	return mockServer as Server & {
		simulateConnection: (socket: ServerSocket) => void;
		getConnectedSockets: () => ServerSocket[];
		_trackSocketJoin: (socket: ServerSocket, room: string) => void;
	};
}

/**
 * Creates a mock server socket for testing
 */
export type MockServerSocket = ServerSocket & {
	simulateEvent: (event: string, ...args: any[]) => void;
	isInRoom: (room: string) => boolean;
	getRooms: () => string[];
};

export function createMockServerSocket(playerId: string = 'mock-player-id'): MockServerSocket {
	const eventHandlers = new Map<string, Set<(...args: any[]) => void>>();
	const rooms = new Set<string>();
	const mockSocket: any = {
		id: `socket-${playerId}`,
		data: { playerId },
		join: vi.fn((room: string) => {
			rooms.add(room);
			return mockSocket;
		}),
		leave: vi.fn((room: string) => {
			rooms.delete(room);
			return mockSocket;
		}),
		emit: vi.fn(),
		on: (event: string, handler: (...args: any[]) => void) => {
			if (!eventHandlers.has(event)) {
				eventHandlers.set(event, new Set());
			}
			eventHandlers.get(event)!.add(handler);
			return mockSocket;
		},
		off: vi.fn(),
		to: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		disconnect: vi.fn(),
		handshake: {
			auth: { token: 'mock-token' }
		} as any,
		// Helper to simulate client event (triggers handlers registered with socket.on)
		simulateEvent: (event: string, ...args: any[]) => {
			if (eventHandlers.has(event)) {
				eventHandlers.get(event)!.forEach((handler) => handler(...args));
			}
		},
		// Helper to check if socket is in room
		isInRoom: (room: string) => rooms.has(room),
		// Helper to get rooms
		getRooms: () => Array.from(rooms)
	};

	return mockSocket as MockServerSocket;
}

/**
 * Simulates a socket event being received
 */
export function simulateSocketEvent(
	socket: ClientSocket & { simulateEvent?: (event: string, ...args: any[]) => void },
	event: string,
	...args: any[]
): void {
	if (socket.simulateEvent) {
		socket.simulateEvent(event, ...args);
	}
}

/**
 * Waits for a store to update to a specific value or condition
 */
export async function waitForStoreUpdate<T>(
	store: { subscribe: (fn: (value: T) => void) => () => void },
	condition: (value: T) => boolean,
	timeout: number = 5000
): Promise<T> {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();
		let unsubscribe: (() => void) | null = null;
		
		unsubscribe = store.subscribe((value) => {
			if (condition(value)) {
				if (unsubscribe) unsubscribe();
				resolve(value);
			} else if (Date.now() - startTime > timeout) {
				if (unsubscribe) unsubscribe();
				reject(new Error(`Timeout waiting for store update after ${timeout}ms`));
			}
		});

		// Check initial value
		const currentValue = get(store as any);
		if (condition(currentValue)) {
			if (unsubscribe) unsubscribe();
			resolve(currentValue);
		}
	});
}

/**
 * Waits for gameStore to have a specific property value
 */
export async function waitForGameStore(
	condition: (store: ReturnType<typeof get<typeof gameStore>>) => boolean,
	timeout: number = 5000
): Promise<ReturnType<typeof get<typeof gameStore>> | undefined> {
	return waitForStoreUpdate(gameStore, condition, timeout);
}

/**
 * Waits for playerStore to have a specific property value
 */
export async function waitForPlayerStore(
	condition: (store: ReturnType<typeof get<typeof playerStore>>) => boolean,
	timeout: number = 5000
): Promise<ReturnType<typeof get<typeof playerStore>> | undefined> {
	return waitForStoreUpdate(playerStore, condition, timeout);
}

/**
 * Resets all stores to initial state
 */
export function resetStores(): void {
	gameStore.set({
		id: '',
		players: [],
		questionCard: '',
		submittedCards: [],
		isInRetro: false,
		isGameOver: false,
		answerInFocus: { player: '', answer: '' },
		winner: '',
		creatorId: ''
	});
	playerStore.set({
		playerId: '',
		nickname: '',
		answerCards: [],
		isAskingQuestion: false,
		wonCards: 0
	});
	io.set(undefined as any);
}
