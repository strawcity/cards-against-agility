import { writable } from "svelte/store";

interface GameStore {
  clientId: string | null;
  playerTitle: string | null;
  nickname: string | null;
  answerCards: string[] | null;
}

export const gameStore = writable<GameStore>({
  clientId: null,
  playerTitle: null,
  nickname: null,
  answerCards: null,
});
