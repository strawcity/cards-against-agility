import { getDefaultUserName } from "./../helpers/getDefaultUserName";
import { writable } from "svelte/store";

export interface PlayerData {
  playerName: string;
  roomId: string;
  playerId: string;
}

export default writable({
  playerName: getDefaultUserName(),
  roomId: "",
  playerId: "",
});
