import { getDefaultUserName } from "./../helpers/getDefaultUserName";
import { writable } from "svelte/store";

export default writable({
  playerName: getDefaultUserName(),
  roomId: "",
  playerId: "",
});
