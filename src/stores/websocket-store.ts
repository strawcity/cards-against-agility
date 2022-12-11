import { writable } from "svelte/store";
import { gameStore } from "./../stores/game-store";
let websocket;

const createWebSocketStore = () => {
  const { subscribe, set } = writable(null);

  const connect = (url) => {
    websocket = new WebSocket(url);
    websocket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.method === "connect") {
        gameStore.setClientId(response.clientId);
        gameStore.setPlayerTitle(response.playerTitle);
      }
      if (response.method === "return-nickname") {
        gameStore.setNickname(response.nickname);
      }
      if (response.method === "create") {
        gameStore.setGameId(response.game.id);
        console.log(
          "game successfully created with id " +
            response.game.id +
            " with " +
            response.game.balls +
            " balls"
        );
        if (response.game.id) {
          location.href = `/room/${response.game.id}`;
        }
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
