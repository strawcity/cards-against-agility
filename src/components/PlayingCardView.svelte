<script lang="ts">
  import classNames from "classnames";
  import { getPlayerNickname } from "./../helpers/getPlayerNickname";
  import { submitCard } from "../helpers/gameFunctions";
  import { playerStore, gameStore } from "../stores/game-store";
  import { replaceLine } from "./../helpers/replaceLine";

  let hasSubmittedCard;
  let selectedCard;
  let secondSelectedCard;
  let thirdSelectedCard;
  let playerId;

  const oneLineRegex = /---/;
  const twoLineRegex = /----/;
  const threeLineRegex = /-----/;

  playerStore.subscribe((store) => {
    const playerStore = store;
    playerId = playerStore.playerId;
  });
  function selectAnswer(card) {
    console.log("🚀 ~ selectAnswer ~ card", card);
    selectedCard = replaceLine($gameStore.questionCard, card);
    console.log("🚀 ~ selectAnswer ~ selectedCard", selectedCard);
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
    {#if $gameStore.answerInFocus}
      {getPlayerNickname($gameStore.answerInFocus.player, $gameStore.players)} says:
      {@html $gameStore.answerInFocus.answer}
    {:else}
      {@html selectedCard ? selectedCard : replaceLine($gameStore.questionCard)}
    {/if}
  </h3>
</div>

{#if hasSubmittedCard}
  {#if !$gameStore.isReviewingCards}
    <div class="flex flex-col items-center">Waiting for other players</div>
  {/if}
{:else}<div class="flex flex-col items-center">
    <div class="flex w-full justify-center flex-wrap gap-4 px-5">
      {#each $playerStore.answerCards as card}
        <button
          on:click={() => selectAnswer(card)}
          class={classNames(
            "rounded-2xl shrink-0 border transition-all bg-white duration-150 text-blue-700 border-blue-700 w-40 h-52 flex justify-center items-center text-center p-5 shadow cursor-pointer",
            {
              "border-4 scale-125 -translate-y-5 shadow-xl":
                card === selectedCard,
            }
          )}
        >
          <h3>{card}</h3>
        </button>
      {/each}
    </div>
    <button
      class="border w-72 bg-blue-700 text-white rounded-2xl p-3 mt-5"
      on:click={handleSubmitCardClick}>Submit card</button
    >
  </div>
{/if}
