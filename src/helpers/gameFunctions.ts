import { gameStore } from "./../stores/game-store";
import { websocketStore } from "./../stores/websocket-store";

let clientId;
let nicnkame;
let playerTitle;

gameStore.subscribe((state) => {
  const gameStore = state;
  clientId = gameStore.clientId;
  nicnkame = gameStore.nickname;
  playerTitle = gameStore.playerTitle;
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
  const payLoad = {
    method: "join",
    clientId: clientId,
    nicnkame: nicnkame,
    playerTitle: playerTitle,
    gameId: gameId,
  };

  websocketStore.send(payLoad);
}
