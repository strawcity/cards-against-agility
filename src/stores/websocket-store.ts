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

const createWebSocketStore = () => {
  const { subscribe } = writable(null);

  const connect = (url) => {
    websocket = new WebSocket(url);
    websocket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      switch (response.method) {
        case "connect":
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
              response.game.answerCards.length +
              " cards"
          );
          if (response.game.id) {
            location.href = `/${response.game.id}`;
          }
          return;
        case "invalid-game-id":
          alert("Couldn't find that game!");
        case "join":
          const game = response.game;
          let curentClient = game.clients.find((client) => {
            return client.clientId === clientId;
          });

          gameStore.setAnswerCards(curentClient.answerCards);
          return;
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
