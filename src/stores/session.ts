import type { PlayerData } from "src/gameLogic";
import { writable } from "svelte/store";

export default writable({
  playerData: {},
});
