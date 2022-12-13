<script lang="ts">
  import { gameStore } from "./../stores/game-store";
  import { joinGame, createNewGame } from "./../helpers/gameFunctions";

  let tempGameId;
  let clientId;

  gameStore.subscribe((store) => {
    const gameStore = store;
    clientId = gameStore.clientId;
  });

  function handleJoinGameClick() {
    joinGame(tempGameId);
  }

  function handleNewGameClick() {
    createNewGame();
  }
</script>

<h1 class="text-green-500">Lobby Welcome, to Cards Against Agility!</h1>
<button
  class="border border-emerald-300 rounded-2xl p-3"
  on:click|once={handleNewGameClick}>New Game</button
>
<!-- <input class="border border-green-300  mt-5" bind:value={tempGameId} />
<button
  class="border border-emerald-300 rounded-2xl p-3"
  on:click={handleJoinGameClick}
  id="btnJoin">Join Game</button
> -->
