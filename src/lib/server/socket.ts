import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

let io: Server | null = null;

export function initializeSocket(server: HTTPServer) {
	if (io) {
		return io;
	}

	io = new Server(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		},
		path: '/socket.io'
	});

	// Socket.io authentication middleware
	io.use((socket, next) => {
		const token = socket.handshake.auth.token;
		if (!token) {
			return next(new Error('Authentication error: No token provided'));
		}

		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
				playerId: string;
			};
			socket.data.playerId = decoded.playerId;
			next();
		} catch (err) {
			next(new Error('Authentication error: Invalid token'));
		}
	});

	return io;
}

export function getIO(): Server | null {
	return io;
}
