import { gameStore } from "./../stores/game-store";
import { websocketStore } from "./../stores/websocket-store";

let clientId;
let nicnkame;
let gameId;

gameStore.subscribe((state) => {
  const gameStore = state;
  clientId = gameStore.clientId;
  nicnkame = gameStore.nickname;
  gameId = gameStore.gameId;
});

export function saveNickname(tempNickname) {
  const payLoad = {
    method: "save-nickname",
    clientId: clientId,
    nickname: tempNickname,
  };

  websocketStore.send(payLoad);
}

export function handleNewGameClick() {
  const payLoad = {
    method: "create",
    clientId: clientId,
    nickname: nicnkame,
  };

  websocketStore.send(payLoad);
}

export function handleJoinGameClick() {
  // if (gameId === null) gameId = gameId;

  const payLoad = {
    method: "join",
    clientId: clientId,
    gameId: gameId,
  };

  websocketStore.send(payLoad);
}
