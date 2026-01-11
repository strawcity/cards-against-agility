import type { Server, Socket } from 'socket.io';
import { vi } from 'vitest';

export function createMockSocket(): Socket {
	return {
		id: 'mock-socket-id',
		data: { playerId: 'mock-player-id' },
		join: vi.fn(),
		leave: vi.fn(),
		emit: vi.fn(),
		on: vi.fn(),
		off: vi.fn(),
		to: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		disconnect: vi.fn(),
		handshake: {
			auth: { token: 'mock-token' },
			query: {},
			headers: {},
			time: new Date().toISOString(),
			address: '127.0.0.1',
			xdomain: false,
			secure: false,
			issued: 0,
			url: ''
		} as any
	} as unknown as Socket;
}

export function createMockServer(): Server {
	return {
		on: vi.fn(),
		emit: vi.fn(),
		to: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		use: vi.fn(),
		sockets: {
			sockets: new Map()
		}
	} as unknown as Server;
}
