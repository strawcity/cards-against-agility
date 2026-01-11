import { describe, it, expect } from 'vitest';
import { makeGameId } from '../makeGameId';

describe('makeGameId', () => {
	it('should generate a 5-character ID', () => {
		const id = makeGameId();
		expect(id).toHaveLength(5);
	});

	it('should generate unique IDs', () => {
		const ids = new Set();
		for (let i = 0; i < 100; i++) {
			ids.add(makeGameId());
		}
		// While collisions are possible, 100 IDs should be mostly unique
		expect(ids.size).toBeGreaterThan(90);
	});

	it('should only contain alphanumeric characters', () => {
		const id = makeGameId();
		expect(id).toMatch(/^[A-Za-z0-9]+$/);
	});
});
