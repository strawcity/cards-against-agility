<script lang="ts">
  import { gameStore } from "./../stores/game-store";
  import { joinGame, createNewGame } from "./../helpers/gameFunctions";
  import { websocketStore } from "./../stores/websocket-store";

  websocketStore.connect("ws://localhost:9090");
  if ($gameStore.clientId === null) {
    // Todo: save clientId/game store to local storage and don't make a new client ID connection
  }

  let tempGameId;

  function handleJoinGameClick() {
    joinGame(tempGameId);
  }

  function handleNewGameClick() {
    createNewGame();
  }
</script>

<h1>Lobby Welcome, to Cards Against Agility!</h1>
<button
  class="border border-emerald-300 rounded-2xl p-3"
  on:click|once={handleNewGameClick}>New Game</button
>
<button
  class="border border-emerald-300 rounded-2xl p-3 mt-5"
  on:click={handleJoinGameClick}
  id="btnJoin">Join Game</button
>
