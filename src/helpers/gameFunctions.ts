import { gameStore } from "./../stores/game-store";
import { websocketStore } from "./../stores/websocket-store";

let clientId;
let nicnkame;

gameStore.subscribe((state) => {
  const gameStore = state;
  clientId = gameStore.clientId;
  nicnkame = gameStore.nickname;
});

export function saveNickname(tempNickname) {
  const payLoad = {
    method: "save-nickname",
    clientId: clientId,
    nickname: tempNickname,
  };

  websocketStore.send(payLoad);
}

export function createNewGame() {
  const payLoad = {
    method: "create",
    clientId: clientId,
    nickname: nicnkame,
  };

  websocketStore.send(payLoad);
}

export function joinGame(gameId: string) {
  // if (gameId === null) gameId = gameId;

  const payLoad = {
    method: "join",
    clientId: clientId,
    gameId: gameId,
  };

  websocketStore.send(payLoad);
}
