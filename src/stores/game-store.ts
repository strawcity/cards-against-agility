import { writable } from "svelte/store";

interface PlayerStore {
  playerId: string;
  nickname: string;
  answerCards: string[];
  isAskingQuestion: boolean;
}

interface GameStore {
  id: string;
  players: Player[];
  questionCard: string;
  submittedCards: SubmittedCard[];
  isReviewingCards: boolean;
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

export const playerStore = writable<PlayerStore>({
  playerId: null,
  nickname: null,
  answerCards: null,
  isAskingQuestion: false,
});

export const gameStore = writable<GameStore>({
  id: null,
  players: null,
  questionCard: null,
  submittedCards: null,
  isReviewingCards: false,
});
