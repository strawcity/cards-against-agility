import { gameStore, playerStore } from "./../stores/game-store";
import { websocketStore } from "./../stores/websocket-store";

let playerId;
let nicnkame;
let storedGameId;

playerStore.subscribe((state) => {
  const playerStore = state;
  playerId = playerStore.playerId;
  nicnkame = playerStore.nickname;
});

gameStore.subscribe((state) => {
  const gameStore = state;
  console.log("🚀 ~ gameStore.subscribe ~ gameStore", gameStore);
  storedGameId = gameStore.id;
});

export function createGame(nickname) {
  const payLoad = {
    method: "create-game",
    playerId: playerId,
    nickname: nickname,
  };

  websocketStore.send(payLoad);
}

export function joinGame(nickname, gameId: string) {
  const payLoad = {
    method: "join-game",
    playerId: playerId,
    nickname: nickname,
    gameId: gameId,
  };

  websocketStore.send(payLoad);
}

export function startGame(gameId: string) {
  const payLoad = {
    method: "start-game",
    gameId: gameId,
  };

  websocketStore.send(payLoad);
}

export function submitCard(playerId: string, submittedCard: string) {
  const payLoad = {
    method: "submit-card",
    gameId: storedGameId,
    playerId: playerId,
    submittedCard: submittedCard,
  };
  console.log("🚀 ~ submitCard ~ payLoad", payLoad);

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
