import { writable } from "svelte/store";
import { gameStore } from "./../stores/game-store";
let websocket;

type Game = {
  id: string;
  color?: string;
  answerCards: string[];
  questionCards: string[];
  clients: Client[];
  state?: any;
};

interface Games {
  [key: string]: Game;
}

interface Clients {
  [key: string]: Client;
}

type Client = {
  connection?: any;
  clientId: string;
  nickname: string | null;
  answerCards?: string[];
  questionCard?: string[];
  wonCards?: string[];
};

let clientId;

gameStore.subscribe((state) => {
  const gameState = state;
  clientId = gameState.clientId;
});

const createWebSocketStore = () => {
  const { subscribe } = writable(null);

  const connect = (url) => {
    websocket = new WebSocket(url);
    websocket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      switch (response.method) {
        case "connect":
          console.log(response.clientId);
          gameStore.setClientId(response.clientId);
          gameStore.setPlayerTitle(response.playerTitle);
          return;
        case "return-nickname":
          gameStore.setNickname(response.nickname);
          return;
        case "create":
          gameStore.setGameId(response.game.id);
          console.log(
            "game successfully created with id " +
              response.game.id +
              " with " +
              response.game.answerCards +
              " balls"
          );
          if (response.game.id) {
            location.href = `/room/${response.game.id}`;
          }
          return;
        case "join":
          const game = response.game;
          let curentClient = game.clients.find((client) => {
            return client.clientId === clientId;
          });

          gameStore.setAnswerCards(curentClient.answerCards);
      }
    };
  };

  const send = (data) => {
    if (websocket) {
      websocket.send(JSON.stringify(data));
    }
  };

  const onmessage = (callback) => {
    if (websocket) {
      websocket.onmessage = callback;
    }
  };

  return {
    subscribe,
    connect,
    send,
    onmessage,
  };
};

export const websocketStore = createWebSocketStore();
