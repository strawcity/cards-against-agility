import { playerStore } from "./../stores/game-store";
import { websocketStore } from "./../stores/websocket-store";

let playerId;
let nicnkame;

playerStore.subscribe((state) => {
  const playerStore = state;
  playerId = playerStore.playerId;
  nicnkame = playerStore.nickname;
});

export function createGame(nickname) {
  const payLoad = {
    method: "create-game",
    playerId: playerId,
    nickname: nickname,
  };

  websocketStore.send(payLoad);
}

export function joinGame(gameId: string) {
  const payLoad = {
    method: "join",
    playerId: playerId,
    nicnkame: nicnkame,
    gameId: gameId,
  };

  websocketStore.send(payLoad);
}

function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateJobTitle() {
  const levels = randomFromArray([
    "Junior",
    "Senior",
    "10x",
    "Staff",
    "Rockstar",
    "Mid",
    "Basic ass",
    "Ninja",
    "Guru",
    "Maverick",
    "Wizard",
  ]);

  const roles = randomFromArray([
    "PM",
    "Developer",
    "Designer",
    "PO",
    "Scrum Master",
    "Enginner",
    "UX Researcher",
    "Dev Rel",
    "Engineering Manger",
  ]);

  return `${levels} ${roles}`;
}
