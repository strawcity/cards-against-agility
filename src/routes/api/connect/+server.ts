import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

export async function GET() {
	// Generate unique player ID
	const playerId = randomBytes(16).toString('hex');

	// Generate JWT token
	const token = jwt.sign(
		{ playerId },
		process.env.JWT_SECRET || 'your-secret-key',
		{ expiresIn: '24h' }
	);

	return json({ token, playerId });
}
