import type { Server, Socket } from 'socket.io';
import {
	createGame,
	joinGame,
	getGame,
	startGame,
	submitCard,
	selectWinner,
	newRound,
	getPlayerCards,
	getPlayerScore
} from './gameState';
import type { Player } from '../../stores/game-store';

export function setupSocketHandlers(io: Server) {
	io.on('connection', (socket: Socket) => {
		const playerId = socket.data.playerId;

		// Send connected event with playerId
		socket.emit('connected', playerId);

		// Create game
		socket.on('create-game', (data: { playerId: string; nickname: string }) => {
			const game = createGame(data.playerId, data.nickname);
			if (game) {
				// Join the game room
				socket.join(game.id);
				socket.emit('create-game', {
					game: {
						id: game.id,
						players: game.players
					},
					nickname: data.nickname
				});
			}
		});

		// Join game
		socket.on('join-game', (data: { playerId: string; nickname: string; gameId: string }) => {
			const game = joinGame(data.playerId, data.nickname, data.gameId);
			if (game) {
				// Join the game room
				socket.join(data.gameId);
				// Notify all players in the game
				io.to(data.gameId).emit('join-game', {
					game: {
						id: game.id,
						players: game.players
					},
					nickname: data.nickname
				});
			}
		});

		// Start game
		socket.on('start-game', (data: { gameId: string }) => {
			const game = startGame(data.gameId);
			if (!game) return;

			// Send game state to all players in the game room
			game.players.forEach((player) => {
				const answerCards = getPlayerCards(data.gameId, player.playerId);
				const isAskingQuestion = player.playerId === game.players[game.currentAskerIndex].playerId;

				io.to(player.playerId).emit('start-game', {
					answerCards,
					isAskingQuestion,
					questionCard: game.questionCard
				});
			});
		});

		// Submit card
		socket.on('submit-card', (data: { gameId: string; playerId: string; submittedCard: string }) => {
			const game = submitCard(data.gameId, data.playerId, data.submittedCard);
			if (!game) return;

			// Broadcast updated submitted cards to all players in game
			io.to(data.gameId).emit('receive-answer-card', {
				submittedCards: game.submittedCards
			});

			// Check if all players (except asker) have submitted
			const asker = game.players[game.currentAskerIndex];
			const nonAskerPlayers = game.players.filter((p) => p.playerId !== asker.playerId);
			const allSubmitted = nonAskerPlayers.every((p) =>
				game.submittedCards.some((sc) => sc.playerId === p.playerId)
			);

			if (allSubmitted && nonAskerPlayers.length > 0) {
				// Start review phase
				game.isInRetro = true;
				io.to(data.gameId).emit('start-card-review');
			}
		});

		// Show current answer
		socket.on(
			'show-current-answer',
			(data: { gameId: string; playerId: string; answer: string }) => {
				const game = getGame(data.gameId);
				if (!game) return;

				io.to(data.gameId).emit('show-answer', {
					inFocusCard: {
						player: data.playerId,
						answer: data.answer
					}
				});
			}
		);

		// Select winner
		socket.on('select-winner', (data: { gameId: string; winningPlayer: string }) => {
			const game = selectWinner(data.gameId, data.winningPlayer);
			if (!game) return;

			// Broadcast winner to all players with updated scores
			game.players.forEach((player) => {
				const playerScore = getPlayerScore(data.gameId, player.playerId);
				io.to(player.playerId).emit('show-round-winner', {
					winningPlayer: data.winningPlayer,
					wonCards: playerScore
				});
			});

			// Check if game should end
			if (game.isGameOver) {
				io.to(data.gameId).emit('show-game-winner', {
					winningPlayer: data.winningPlayer
				});
			}
		});

		// New round
		socket.on('new-round', (data: { gameId: string }) => {
			const game = newRound(data.gameId);
			if (!game) return;

			// Send new round data to all players
			game.players.forEach((player) => {
				const answerCards = getPlayerCards(data.gameId, player.playerId);
				const isAskingQuestion = player.playerId === game.players[game.currentAskerIndex].playerId;

				io.to(player.playerId).emit('new-round', {
					answerCards,
					isAskingQuestion,
					questionCard: game.questionCard
				});
			});
		});

		// Join game room
		socket.on('join-game-room', (gameId: string) => {
			socket.join(gameId);
		});

		// Disconnect
		socket.on('disconnect', () => {
			// Cleanup if needed
		});
	});
}
