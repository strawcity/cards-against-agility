import { writable } from 'svelte/store';

interface PlayerStore {
	playerId: string;
	nickname: string;
	answerCards: string[];
	isAskingQuestion: boolean;
	wonCards: number;
}

interface GameStore {
	id: string;
	players: Player[];
	questionCard: string;
	submittedCards: SubmittedCard[];
	isInRetro: boolean;
	isGameOver: boolean;
	answerInFocus: AnswerInFocus;
	winner: string;
}

export type Player = {
	playerId: string;
	nickname: string;
	card?: string;
};

export type SubmittedCard = {
	playerId: string;
	card: string;
};
type AnswerInFocus = {
	player: string;
	answer: string;
};

export const playerStore = writable<PlayerStore>({
	playerId: '',
	nickname: '',
	answerCards: [],
	isAskingQuestion: false,
	wonCards: 0
});

export const gameStore = writable<GameStore>({
	id: '',
	players: [],
	questionCard: '',
	submittedCards: [],
	isInRetro: false,
	isGameOver: false,
	answerInFocus: { player: '', answer: '' },
	winner: ''
});
