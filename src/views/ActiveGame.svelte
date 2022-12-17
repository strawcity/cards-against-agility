<script lang="ts">
  import { playerStore, gameStore } from "../stores/game-store";
  import classNames from "classnames";
  import { submitCard } from "../helpers/gameFunctions";
  import AskerView from "./../components/AskerView.svelte";

  let playerId;
  let nickname;
  let selectedCard;
  let secondSelectedCard;
  let thirdSelectedCard;
  let hasSubmittedCard;
  const oneLineRegex = /---/;
  const twoLineRegex = /----/;
  const threeLineRegex = /-----/;

  playerStore.subscribe((store) => {
    const playerStore = store;
    playerId = playerStore.playerId;
    nickname = playerStore.nickname;
  });

  function selectCard(card) {
    selectedCard = card;
  }

  function handleSubmitCardClick() {
    submitCard(playerId, selectedCard);
    hasSubmittedCard = true;
  }
</script>

<div
  class={classNames(
    "mb-12 rounded-2xl shrink-0 border transition-all text-white duration-150 bg-blue-700 w-44 h-56 flex justify-center items-center text-center p-5 shadow-md"
  )}
>
  <h3>
    {@html selectedCard
      ? $gameStore.questionCard
          .replace(oneLineRegex, `<b> ${selectedCard}</b>`)
          .replace(twoLineRegex, `<b> ${secondSelectedCard}</b>`)
          .replace(threeLineRegex, `<b> ${thirdSelectedCard}</b>`)
      : $gameStore.questionCard
          .replace(oneLineRegex, " _________")
          .replace(twoLineRegex, " _________")
          .replace(threeLineRegex, " _________")}
  </h3>
</div>

{#if !$playerStore.isAskingQuestion}
  {#if hasSubmittedCard}
    <div class="flex flex-col items-center">Waiting for other players</div>
  {:else}<div class="flex flex-col items-center">
      <div class="flex w-full justify-center flex-wrap gap-4 px-5">
        {#each $playerStore.answerCards as card}
          <div
            on:click={() => selectCard(card)}
            class={classNames(
              "rounded-2xl shrink-0 border transition-all bg-white duration-150 text-blue-700 border-blue-700 w-40 h-52 flex justify-center items-center text-center p-5 shadow cursor-pointer",
              {
                "border-4 scale-125 -translate-y-5 shadow-xl":
                  card === selectedCard,
              }
            )}
          >
            <h3>{card}</h3>
          </div>
        {/each}
      </div>
      <button
        class="border w-72 bg-blue-700 text-white rounded-2xl p-3 mt-5"
        on:click={handleSubmitCardClick}>Submit card</button
      >
    </div>{/if}
{:else}
  <AskerView />
{/if}
