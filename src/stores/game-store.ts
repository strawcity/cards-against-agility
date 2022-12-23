import { writable } from "svelte/store";

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
  answerInFocus: AnswerInFocus;
  winner: string;
}

export type Player = {
  playerId: string;
  nickname: string;
  card?: string;
};

type SubmittedCard = {
  playerId: string;
  card: string;
};
type AnswerInFocus = {
  player: string;
  answer: string;
};

export const playerStore = writable<PlayerStore>({
  playerId: null,
  nickname: null,
  answerCards: null,
  isAskingQuestion: false,
  wonCards: 0,
});

export const gameStore = writable<GameStore>({
  id: null,
  players: null,
  questionCard: null,
  submittedCards: null,
  isInRetro: false,
  answerInFocus: null,
  winner: null,
});
