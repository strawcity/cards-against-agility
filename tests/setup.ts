import { webcrypto } from 'node:crypto';

// Polyfill crypto.getRandomValues for Vitest
if (typeof globalThis.crypto === 'undefined') {
	globalThis.crypto = webcrypto as any;
}
