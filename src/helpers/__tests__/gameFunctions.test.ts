import { describe, it, expect } from 'vitest';
import { generateJobTitle } from '../gameFunctions';

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
