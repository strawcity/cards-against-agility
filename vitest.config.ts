// Set up crypto polyfill IMMEDIATELY - must be before any imports
// Use a function that executes immediately
(function() {
	const polyfill = {
		getRandomValues: function(arr: any) {
			for (let i = 0; i < arr.length; i++) {
				arr[i] = Math.floor(Math.random() * 256);
			}
			return arr;
		}
	};
	
	if (typeof globalThis.crypto === 'undefined') {
		globalThis.crypto = polyfill as Crypto;
	} else {
		Object.defineProperty(globalThis.crypto, 'getRandomValues', {
			value: polyfill.getRandomValues,
			writable: true,
			configurable: true
		});
	}
	
	if (typeof global !== 'undefined') {
		if (typeof global.crypto === 'undefined') {
			global.crypto = polyfill as Crypto;
		} else {
			Object.defineProperty(global.crypto, 'getRandomValues', {
				value: polyfill.getRandomValues,
				writable: true,
				configurable: true
			});
		}
	}
})();

import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		exclude: ['tests/e2e/**/*'],
		globals: true,
		environment: 'node',
		setupFiles: ['./tests/setup.ts']
	}
});
