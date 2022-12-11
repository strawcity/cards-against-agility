<script lang="ts">
  import { websocketStore } from "./../stores/websocket-store";
  import { gameStore } from "./../stores/game-store";

  import {
    handleJoinGameClick,
    handleNewGameClick,
    saveNickname,
  } from "./../helpers/gameFunctions";
  websocketStore.connect("ws://localhost:9090");

  let tempNickname;
  let gameId;

  gameStore.subscribe((state) => {
    const { clientId, playerTitle, nickname, gameId } = state;
    console.log(clientId, playerTitle, nickname, gameId);
  });

  function handleSaveNicknamelick() {
    saveNickname(tempNickname);
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
  <input class="border border-green-300" bind:value={gameId} />
  <h1>{gameId}</h1>
{/if}
