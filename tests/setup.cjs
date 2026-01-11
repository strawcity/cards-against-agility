// Simple crypto polyfill for Vitest - must be CommonJS to load early
// This runs before Vite config is loaded
const cryptoPolyfill = {
	getRandomValues: function(arr) {
		for (let i = 0; i < arr.length; i++) {
			arr[i] = Math.floor(Math.random() * 256);
		}
		return arr;
	}
};

// Set it on globalThis immediately
if (typeof globalThis.crypto === 'undefined') {
	globalThis.crypto = cryptoPolyfill;
} else if (!globalThis.crypto.getRandomValues) {
	globalThis.crypto.getRandomValues = cryptoPolyfill.getRandomValues;
}

// Also set on global for compatibility
if (typeof global !== 'undefined') {
	if (typeof global.crypto === 'undefined') {
		global.crypto = cryptoPolyfill;
	} else if (!global.crypto.getRandomValues) {
		global.crypto.getRandomValues = cryptoPolyfill.getRandomValues;
	}
}
