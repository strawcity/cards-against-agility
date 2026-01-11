import type { Plugin } from 'vite';
import type { ViteDevServer } from 'vite';
import { initializeSocket } from './src/lib/server/socket.js';
import { setupSocketHandlers } from './src/lib/server/socketHandlers.js';

export function socketIO(): Plugin {
	return {
		name: 'socketio',
		configureServer(server: ViteDevServer) {
			// Get the underlying HTTP server from Vite
			const httpServer = server.httpServer;
			if (!httpServer) {
				console.warn('⚠️  Could not access HTTP server for Socket.io initialization');
				return;
			}

			// Initialize Socket.io
			const io = initializeSocket(httpServer);
			setupSocketHandlers(io);
			console.log('✅ Socket.io initialized in dev server');
		}
	};
}
