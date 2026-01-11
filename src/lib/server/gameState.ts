import type { Player, SubmittedCard } from '../../stores/game-store.js';
import { makeGameId } from '../../helpers/makeGameId.js';
import { answers, questions } from './cards.js';

export interface Game {
	id: string;
	players: Player[];
	questionCard: string;
	submittedCards: SubmittedCard[];
	isInRetro: boolean;
	currentAskerIndex: number;
	roundNumber: number;
	winner?: string;
	isGameOver: boolean;
	playerCards: Map<string, string[]>; // playerId -> answer cards
	usedQuestionCards: Set<string>;
	playerScores: Map<string, number>; // playerId -> score (wonCards)
	creatorId: string; // playerId of the player who created the game
}

const games = new Map<string, Game>();
const playerToGame = new Map<string, string>(); // playerId -> gameId

// Test helper function to reset game state
export function resetGameState() {
	games.clear();
	playerToGame.clear();
}

export function createGame(playerId: string, nickname: string): Game {
	const gameId = makeGameId();
	const game: Game = {
		id: gameId,
		players: [{ playerId, nickname }],
		questionCard: '',
		submittedCards: [],
		isInRetro: false,
		currentAskerIndex: 0,
		roundNumber: 0,
		isGameOver: false,
		playerCards: new Map(),
		usedQuestionCards: new Set(),
		playerScores: new Map(),
		creatorId: playerId
	};
	
	// Initialize score for creator
	game.playerScores.set(playerId, 0);

	games.set(gameId, game);
	playerToGame.set(playerId, gameId);
	return game;
}

export function joinGame(playerId: string, nickname: string, gameId: string): Game | null {
	const game = games.get(gameId);
	if (!game) return null;

	// Check if player already in game
	if (game.players.some((p) => p.playerId === playerId)) {
		return game;
	}

	game.players.push({ playerId, nickname });
	game.playerScores.set(playerId, 0);
	playerToGame.set(playerId, gameId);
	return game;
}

export function getGame(gameId: string): Game | undefined {
	return games.get(gameId);
}

export function getGameByPlayerId(playerId: string): Game | undefined {
	const gameId = playerToGame.get(playerId);
	if (!gameId) return undefined;
	return games.get(gameId);
}

export function startGame(gameId: string, playerId: string): Game | null {
	const game = games.get(gameId);
	if (!game || game.players.length < 3) return null;
	
	// Only the creator can start the game
	if (game.creatorId !== playerId) return null;

	// Initialize scores if not already set
	game.players.forEach((player) => {
		if (!game.playerScores.has(player.playerId)) {
			game.playerScores.set(player.playerId, 0);
		}
	});

	// Distribute answer cards to all players (7 cards each)
	const shuffledAnswers = [...answers].sort(() => Math.random() - 0.5);
	game.playerCards.clear();

	game.players.forEach((player) => {
		const playerAnswerCards: string[] = [];
		for (let i = 0; i < 7; i++) {
			playerAnswerCards.push(shuffledAnswers.pop() || '');
		}
		game.playerCards.set(player.playerId, playerAnswerCards);
	});

	// Select first question card
	const availableQuestions = questions.filter((q) => !game.usedQuestionCards.has(q));
	const questionCard =
		availableQuestions[Math.floor(Math.random() * availableQuestions.length)] || questions[0];
	game.questionCard = questionCard;
	game.usedQuestionCards.add(questionCard);

	// Set first asker (random)
	game.currentAskerIndex = Math.floor(Math.random() * game.players.length);
	game.roundNumber = 1;

	return game;
}

export function submitCard(gameId: string, playerId: string, card: string): Game | null {
	const game = games.get(gameId);
	if (!game) return null;

	// Remove card from player's hand
	const playerCards = game.playerCards.get(playerId);
	if (!playerCards) return null;

	const cardIndex = playerCards.indexOf(card);
	if (cardIndex === -1) return null;

	playerCards.splice(cardIndex, 1);

	// Add to submitted cards
	const existingSubmission = game.submittedCards.find((sc) => sc.playerId === playerId);
	if (existingSubmission) {
		existingSubmission.cards = [card];
	} else {
		game.submittedCards.push({ playerId, cards: [card] });
	}

	return game;
}

export function selectWinner(gameId: string, winningPlayerId: string): Game | null {
	const game = games.get(gameId);
	if (!game) return null;

	// Find winner and increment score
	const winner = game.players.find((p) => p.playerId === winningPlayerId);
	if (!winner) return null;

	// Increment winner's score
	const currentScore = game.playerScores.get(winningPlayerId) || 0;
	game.playerScores.set(winningPlayerId, currentScore + 1);

	// Check if game is over (winner has 5 points)
	const targetScore = 5;
	if (currentScore + 1 >= targetScore) {
		game.isGameOver = true;
		game.winner = winningPlayerId;
	}

	return game;
}

export function getPlayerScore(gameId: string, playerId: string): number {
	const game = games.get(gameId);
	if (!game) return 0;
	return game.playerScores.get(playerId) || 0;
}

export function newRound(gameId: string): Game | null {
	const game = games.get(gameId);
	if (!game) return null;

	// Replenish answer cards for all players (draw back up to 7)
	const shuffledAnswers = [...answers].sort(() => Math.random() - 0.5);
	game.players.forEach((player) => {
		const playerCards = game.playerCards.get(player.playerId) || [];
		while (playerCards.length < 7) {
			const newCard = shuffledAnswers.pop();
			if (newCard) {
				playerCards.push(newCard);
			} else {
				break;
			}
		}
		game.playerCards.set(player.playerId, playerCards);
	});

	// Rotate asker
	game.currentAskerIndex = (game.currentAskerIndex + 1) % game.players.length;

	// Select new question card
	const availableQuestions = questions.filter((q) => !game.usedQuestionCards.has(q));
	const questionCard =
		availableQuestions.length > 0
			? availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
			: questions[Math.floor(Math.random() * questions.length)];

	game.questionCard = questionCard;
	game.usedQuestionCards.add(questionCard);

	// Reset round state
	game.submittedCards = [];
	game.isInRetro = false;
	game.winner = '';
	game.roundNumber++;

	return game;
}

export function getPlayerCards(gameId: string, playerId: string): string[] {
	const game = games.get(gameId);
	if (!game) return [];
	return game.playerCards.get(playerId) || [];
}
