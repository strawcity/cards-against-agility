import { describe, it, expect } from 'vitest';
import { replaceLine } from '../replaceLine';

describe('replaceLine', () => {
	it('should replace single line placeholder with answer', () => {
		const question = 'This is a test with ---.';
		const answer = 'success';
		const result = replaceLine(question, answer);
		expect(result).toContain(answer);
		expect(result).not.toContain('---');
	});

	it('should replace with bold tags', () => {
		const question = 'This is a test with ---.';
		const answer = 'success';
		const result = replaceLine(question, answer);
		expect(result).toContain('<b>');
		expect(result).toContain('</b>');
	});

	it('should show placeholder when no answer provided', () => {
		const question = 'This is a test with ---.';
		const result = replaceLine(question);
		expect(result).toContain('_________');
	});

	it('should handle multiple placeholders', () => {
		const question = 'First --- and second ----';
		const answer1 = 'one';
		const answer2 = 'two';
		const result = replaceLine(question, answer1, answer2);
		expect(result).toContain(answer1);
		expect(result).toContain(answer2);
	});
});
