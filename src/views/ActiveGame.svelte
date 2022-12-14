<script lang="ts">
  import { playerStore, gameStore } from "./../stores/game-store";
  import { fly } from "svelte/transition";
  import classNames from "classnames";

  export let gameId;
  let playerId;
  let nickname;
  let showCopiedBanner = false;
  let selectedCard;

  playerStore.subscribe((store) => {
    const playerStore = store;
    playerId = playerStore.playerId;
    nickname = playerStore.nickname;
  });

  function selectCard(card) {
    selectedCard = card;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(`http://localhost:5173/${gameId}`);
    showCopiedBanner = true;

    setTimeout(() => {
      showCopiedBanner = false;
    }, 3000);
  }
</script>

{#if showCopiedBanner}
  <div
    in:fly={{ y: -64, duration: 500 }}
    out:fly={{ y: -64, duration: 500 }}
    class="absolute p-5 top-0 w-full bg-blue-300 flex justify-center items-center"
  >
    http://localhost:5173/{gameId} successfully copied to clipboard!
  </div>
{/if}

<div>
  {#each $gameStore.players as player}
    <p>{player.nickname}</p>
  {/each} is in the lobby!
</div>

<!-- {#if !$playerStore.nickname}
  <h1 class="text-orange-500">
    Welcome, {playerTitle}
    <input class="border border-green-300" bind:value={tempNickname} />!
  </h1>
{:else}
  <h1 class="text-orange-500">
    Welcome, {playerTitle}
    {$playerStore.nickname}
  </h1>
{/if} -->
<!-- 
<button
  disabled={!$playerStore.nickname}
  class={classNames(
    "border w-72 bg-blue-800 text-white border-blue-300 rounded-2xl p-3 mt-5",
    {
      "opacity-30": !$playerStore.nickname,
    }
  )}
  on:click={handleJoinGameClick}
  id="btnJoin">Join Game</button
> -->

<button
  class="border w-72 border-blue-300 rounded-2xl p-3 mt-5"
  on:click={copyToClipboard}>Share a link with your friend</button
>

<div class="flex gap-2">
  {#if $playerStore.answerCards}
    {#each $playerStore.answerCards as card}
      <div
        on:click={() => selectCard(card)}
        class={classNames(
          "rounded-2xl border transition-all bg-white duration-150 border-blue-700 w-40 h-60 flex justify-center items-center text-center p-4",
          { "border-4 scale-125 -translate-y-5": card === selectedCard }
        )}
      >
        <h3>{card}</h3>
      </div>
    {/each}{/if}
</div>
