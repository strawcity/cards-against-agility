import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../+server.js';
import jwt from 'jsonwebtoken';

describe('GET /api/connect', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.JWT_SECRET = 'test-secret';
	});

	it('should return a token and playerId', async () => {
		const request = new Request('http://localhost/api/connect');
		const response = await GET({ request } as any);
		const data = await response.json();

		expect(data).toHaveProperty('token');
		expect(data).toHaveProperty('playerId');
		expect(data.token).toBeTruthy();
		expect(data.playerId).toBeTruthy();
	});

	it('should generate a valid JWT token', async () => {
		const request = new Request('http://localhost/api/connect');
		const response = await GET({ request } as any);
		const data = await response.json();

		const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'test-secret') as {
			playerId: string;
		};
		expect(decoded.playerId).toBe(data.playerId);
	});

	it('should generate unique playerIds', async () => {
		const request = new Request('http://localhost/api/connect');
		const playerIds = new Set();

		for (let i = 0; i < 10; i++) {
			const response = await GET({ request } as any);
			const data = await response.json();
			playerIds.add(data.playerId);
		}

		expect(playerIds.size).toBe(10);
	});

	it('should use JWT_SECRET from environment', async () => {
		process.env.JWT_SECRET = 'custom-secret';
		const request = new Request('http://localhost/api/connect');
		const response = await GET({ request } as any);
		const data = await response.json();

		expect(() => {
			jwt.verify(data.token, 'custom-secret');
		}).not.toThrow();
	});
});
