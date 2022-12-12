import { writable } from "svelte/store";

interface GameState {
  clientId: string | null;
  playerTitle: string | null;
  nickname: string | null;
  gameId: string | null;
  answerCards: string[] | null;
}

const createGameStore = () => {
  const { subscribe, set, update } = writable<any>({
    clientId: null,
    playerTitle: null,
    nickname: null,
    gameId: null,
    answerCards: null,
  });

  const setClientId = (id: string) => {
    update((state: GameState) => ({ ...state, clientId: id }));
  };

  const setPlayerTitle = (title: string) => {
    update((state: GameState) => ({ ...state, playerTitle: title }));
  };

  const setNickname = (name: string) => {
    update((state: GameState) => ({ ...state, nickname: name }));
  };

  const setGameId = (id: string) => {
    update((state: GameState) => ({ ...state, gameId: id }));
  };

  const setAnswerCards = (cards: string[]) => {
    update((state: GameState) => ({ ...state, answerCards: cards }));
  };

  return {
    subscribe,
    setClientId,
    setPlayerTitle,
    setNickname,
    setGameId,
    setAnswerCards,
  };
};

export const gameStore = createGameStore();
