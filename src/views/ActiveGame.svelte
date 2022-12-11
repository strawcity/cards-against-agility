<script lang="ts">
  import { saveNickname } from "./../helpers/gameFunctions";
  import { gameStore } from "./../stores/game-store";
  console.log("🚀 ~ gameStore", $gameStore);
  import { websocketStore } from "./../stores/websocket-store";
  websocketStore.connect("ws://localhost:9090");

  export let gameId;

  if (gameId) {
  }

  let tempNickname;

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

  <h1>{gameId}</h1>
{/if}
