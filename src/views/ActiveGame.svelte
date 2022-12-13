<script lang="ts">
  import { joinGame, saveNickname } from "./../helpers/gameFunctions";
  import { gameStore } from "./../stores/game-store";

  export let gameId;
  let tempNickname;

  function handleSaveNicknamelick() {
    saveNickname(tempNickname);
  }

  function handleJoinGameClick() {
    joinGame(gameId);
  }
</script>

{#if !$gameStore.nickname}
  <h1>
    Active game Welcome, {$gameStore.playerTitle}
    <input class="border border-green-300" bind:value={tempNickname} />!
  </h1>
  <button
    class="border border-emerald-300 rounded-2xl p-3"
    on:click|once={handleSaveNicknamelick}>Enter nickname</button
  >
{:else if !$gameStore.answerCards}
  <h1>{$gameStore.playerTitle}, {$gameStore.nickname}</h1>
  http://localhost:5173/room/{$gameStore.gameId}
  <button
    class="border border-emerald-300 rounded-2xl p-3 mt-5"
    on:click={handleJoinGameClick}
    id="btnJoin">Join Game</button
  >
{:else}<div class="flex flex-col" />
  {#each $gameStore.answerCards as card}
    <div>
      {card}
    </div>
  {/each}
{/if}
