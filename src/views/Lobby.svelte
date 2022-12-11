<script lang="ts">
  import { websocketStore } from "./../stores/websocket-store";
  import { gameStore } from "./../stores/game-store";
  import {
    joinGame,
    createNewGame,
    saveNickname,
  } from "./../helpers/gameFunctions";

  if ($gameStore.clientId === null) {
    // Todo: save clientId/game store to local storage and don't make a new client ID connection
    console.log("🚀 ~ gameStore.clientID", $gameStore.clientId);
    websocketStore.connect("ws://localhost:9090");
  }

  let tempNickname;
  let tempGameId;

  function handleSaveNicknamelick() {
    saveNickname(tempNickname);
  }

  function handleJoinGameClick() {
    joinGame(tempGameId);
  }

  function handleNewGameClick() {
    console.log("click");
    createNewGame();
  }
</script>

{#if !$gameStore.nickname}
  <h1>
    Welcome, {$gameStore.playerTitle}
    <input class="border border-green-300" bind:value={tempNickname} />!
  </h1>
  <button
    class="border border-emerald-300 rounded-2xl p-3"
    on:click|once={handleSaveNicknamelick}>Enter nickname</button
  >
{:else}
  <h1>
    Welcome, {$gameStore.playerTitle}
    {$gameStore.nickname}!
  </h1>
  <button
    class="border border-emerald-300 rounded-2xl p-3"
    on:click|once={handleNewGameClick}>New Game</button
  >
  <button
    class="border border-emerald-300 rounded-2xl p-3 mt-5"
    on:click={handleJoinGameClick}
    id="btnJoin">Join Game</button
  >
  <input class="border border-green-300" bind:value={tempGameId} />
  <h1>{tempGameId}</h1>
{/if}
