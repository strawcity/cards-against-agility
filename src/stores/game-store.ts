import { writable } from "svelte/store";

interface PlayerStore {
  playerId: string;
  nickname: string;
  answerCards: string[];
}

interface GameStore {
  id: string;
  players: any[];
}

export const playerStore = writable<PlayerStore>({
  playerId: null,
  nickname: null,
  answerCards: null,
});

export const gameStore = writable<GameStore>({
  id: null,
  players: null,
});
