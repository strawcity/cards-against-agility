import { writable } from "svelte/store";
import { gameStore } from "./../stores/game-store";
let websocket;

let clientId;

const createWebSocketStore = () => {
  const { subscribe } = writable(null);

  const connect = (url) => {
    websocket = new WebSocket(url);
    websocket.onmessage = (event) => {
      const response = JSON.parse(event.data);

      switch (
        response.method
        // case "connect":
        //   gameStore.setClientId(response.clientId);
        //   gameStore.setPlayerTitle(response.playerTitle);
        //   return;

        // case "return-nickname":
        //   gameStore.setNickname(response.nickname);
        //   return;

        // case "create":
        //   gameStore.setGameId(response.game.id);
        //   console.log(
        //     "game successfully created with id " +
        //       response.game.answerCards.length +
        //       " cards"
        //   );
        //   if (response.game.id) {
        //     location.href = `/${response.game.id}`;
        //   }
        //   return;

        // case "invalid-game-id":
        //   alert("Couldn't find that game!");
        //   return;

        // case "join":
        //   const game = response.game;
        //   let curentClient = game.clients.find((client) => {
        //     return client.clientId === clientId;
        //   });

        //   gameStore.setAnswerCards(curentClient.answerCards);
        //   return;
      ) {
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
