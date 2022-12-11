import { writable } from "svelte/store";

interface GameState {
  clientId: string | null;
  playerTitle: string | null;
  nickname: string | null;
  gameId: string | null;
}

const createGameStore = () => {
  const { subscribe, set, update } = writable<any>({
    clientId: null,
    playerTitle: null,
    nickname: null,
    gameId: null,
  });

  const setClientId = (id: string) => {
    set((state: GameState) => {
      ({ ...state, clientId: id });
    });
  };

  const setPlayerTitle = (title: string) => {
    set((state: GameState) => ({ ...state, playerTitle: title }));
  };

  const setNickname = (name: string) => {
    set((state: GameState) => ({ ...state, nickname: name }));
  };

  const setGameId = (id: string) => {
    set((state: GameState) => ({ ...state, gameId: id }));
  };

  return {
    subscribe,
    setClientId,
    setPlayerTitle,
    setNickname,
    setGameId,
  };
};

export const gameStore = createGameStore();
