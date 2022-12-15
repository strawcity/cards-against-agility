import { writable } from "svelte/store";

interface PlayerStore {
  playerId: string;
  nickname: string;
  answerCards: string[];
  isAskingQuestion: boolean;
}

interface GameStore {
  id: string;
  players: any[];
  questionCard: string;
}

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
});
