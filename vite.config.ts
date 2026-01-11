import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const config = defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'node',
		setupFiles: ['./tests/setup.ts']
	}
});

export default config;
