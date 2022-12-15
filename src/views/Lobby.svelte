<script lang="ts">
  import { playerStore, gameStore } from "../stores/game-store";
  import { fly } from "svelte/transition";
  import classNames from "classnames";
  import {
    generateJobTitle,
    joinGame,
    startGame,
    submitCard,
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

  function handleSubmitCardClick() {
    submitCard(playerId, selectedCard);
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
  {#if $gameStore.players}
    {#each $gameStore.players as player}
      <p>{player.nickname}</p>
    {/each} is in the lobby!

    <button
      class="border w-72 border-blue-300 rounded-2xl p-3 mt-5"
      on:click={copyToClipboard}>Share a link with your friend</button
    >
    <!-- {#if $gameStore.players.length >= 3} -->
    <button
      class="border w-72 bg-blue-700 text-white rounded-2xl p-3 mt-5"
      on:click|once={handleStartGameClick}>Start game</button
    >
    <!-- {/if} -->
  {/if}
</div>

{#if !$gameStore.players}
  <h1 class="text-green-500">Choose a job title and a nickname</h1>
  <div class="flex flex-col">
    <input class="border border-green-300 " bind:value={tempNickname} />
    {jobTitle}
  </div>

  <button
    class="border border-blue-300 rounded-2xl p-3"
    on:click={getNewJobTitle}>Generate new job title</button
  >
  <button
    disabled={!tempNickname}
    class={classNames("border text-white bg-blue-700 rounded-2xl p-3", {
      "opacity-30": !tempNickname,
    })}
    on:click={handleJoinGameClick}>Save nickname and join lobby</button
  >
{/if}
