<script lang="ts">
  import { playerStore, gameStore } from "../stores/game-store";
  import { fly } from "svelte/transition";
  import classNames from "classnames";
  import {
    generateJobTitle,
    joinGame,
    startGame,
  } from "../helpers/gameFunctions";

  export let gameId;
  let playerId;
  let nickname;
  let showCopiedBanner = false;
  let selectedCard;
  let jobTitle = generateJobTitle();
  let tempNickname;
  const regex = /---/;

  playerStore.subscribe((store) => {
    const playerStore = store;
    playerId = playerStore.playerId;
    nickname = playerStore.nickname;
  });

  function handleJoinGameClick() {
    joinGame(tempNickname + ", " + jobTitle, gameId);
  }
  function handleStartGameClick() {
    startGame(gameId);
  }

  function selectCard(card) {
    selectedCard = card;
  }

  function getNewJobTitle() {
    jobTitle = generateJobTitle();
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

<div class="flex flex-col gap-5">
  {#if $gameStore.players}
    <div>
      {#each $gameStore.players as player}
        <p class="font-semibold">{player.nickname}</p>
      {/each} is in the lobby!
    </div>
    <button
      class="border w-72 border-blue-300 rounded-2xl p-3 mt-5"
      on:click={copyToClipboard}>Share a link with your friend</button
    >
    {#if $gameStore.players.length >= 3}
      <button
        class="border w-72 bg-blue-700 text-white rounded-2xl p-3 mt-5"
        on:click|once={handleStartGameClick}>Start game</button
      >
    {/if}
  {/if}
</div>

{#if !$gameStore.players}
  <div class="flex flex-col gap-5">
    <h1 class="font-bold text-2xl uppercase">Cards Against Agility</h1>

    <div>
      <form on:submit|preventDefault={handleJoinGameClick}>
        <label>
          <div class="flex items-center">
            <input
              class="border-b border-blue-700 font-semibold"
              bind:value={tempNickname}
            />
          </div>
        </label>
      </form>
      {jobTitle}
    </div>

    <div>
      <button
        class="border border-blue-300 rounded-2xl p-3"
        on:click={getNewJobTitle}>Generate new job title</button
      >
    </div>
    <button
      on:click|once={handleJoinGameClick}
      disabled={!tempNickname}
      class={classNames("border text-white bg-blue-700 rounded-2xl p-3", {
        "opacity-30": !tempNickname,
      })}
    >
      Save nickname and join lobby
    </button>
  </div>
  <!-- <div class="flex flex-col gap-5">
    <div>
      <form on:submit|preventDefault={handleJoinGameClick}>
        <label>
          Choose a job title and a nickname
          <div class="flex items-center">
            <input
              class="border-b border-blue-700 font-semibold"
              bind:value={tempNickname}
            />
          </div>
        </label>
        {jobTitle}
      </form>
    </div>
    <div>
      <button
        class="border border-blue-300 rounded-2xl p-3"
        on:click={getNewJobTitle}>Generate new job title</button
      >
      <button
        disabled={!tempNickname}
        class={classNames("border text-white bg-blue-700 rounded-2xl p-3", {
          "opacity-30": !tempNickname,
        })}
      >
        Save nickname and join lobby
      </button>
    </div>
  </div> -->
{/if}
