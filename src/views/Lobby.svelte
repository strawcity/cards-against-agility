<script lang="ts">
  import { gameStore } from "./../stores/game-store";
  import { joinGame, createNewGame } from "./../helpers/gameFunctions";
  import { websocketStore } from "./../stores/websocket-store";

  websocketStore.connect("ws://localhost:9090");
  websocketStore.subscribe((store) => {
    const wsStore = store;
    console.log("🚀 ~ websocketStore.subscribe ~ wsStore", wsStore);
  });

  let tempGameId;

  function handleJoinGameClick() {
    joinGame(tempGameId);
  }

  function handleNewGameClick() {
    createNewGame();
  }
</script>

<h1>Lobby Welcome, to Cards Against Agility!</h1>
{$gameStore.clientId}
<button
  class="border border-emerald-300 rounded-2xl p-3"
  on:click|once={handleNewGameClick}>New Game</button
>
<input class="border border-green-300  mt-5" bind:value={tempGameId} />
<button
  class="border border-emerald-300 rounded-2xl p-3"
  on:click={handleJoinGameClick}
  id="btnJoin">Join Game</button
>
