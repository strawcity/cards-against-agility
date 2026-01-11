import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';
import { initializeSocket } from './build/lib/server/socket.js';
import { setupSocketHandlers } from './build/lib/server/socketHandlers.js';

// Check for required environment variables
if (!process.env.JWT_SECRET) {
	console.warn('⚠️  WARNING: JWT_SECRET environment variable is not set. Using default (not secure for production!)');
}

const app = express();
const server = createServer(app);

// Initialize Socket.io before SvelteKit handler
const io = initializeSocket(server);
setupSocketHandlers(io);

// Let SvelteKit handle everything else (must be last)
app.use(handler);

const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Listen on all interfaces (required for Fly.io)

server.listen(port, host, () => {
	console.log(`Server running on ${host}:${port}`);
});
