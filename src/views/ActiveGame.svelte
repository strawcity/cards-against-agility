<script lang="ts">
  import { playerStore, gameStore } from "../stores/game-store";
  import classNames from "classnames";
  import { submitCard } from "../helpers/gameFunctions";
  import AskerView from "./../components/AskerView.svelte";

  let playerId;
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
  });

  function selectAnswer(card) {
    selectedCard = $gameStore.questionCard
      .replace(oneLineRegex, `<b> ${card}</b>`)
      .replace(twoLineRegex, `<b> ${secondSelectedCard}</b>`)
      .replace(threeLineRegex, `<b> ${thirdSelectedCard}</b>`);
  }

  function handleSubmitCardClick() {
    submitCard(playerId, selectedCard);
    hasSubmittedCard = true;
  }

  function getPlayerNickname(playerId, players) {
    for (const player of players) {
      if (player.playerId === playerId) {
        return player.nickname;
      }
    }
    return null;
  }
</script>

{#if $gameStore.answerInFocus}
  {getPlayerNickname($gameStore.answerInFocus.player, $gameStore.players)} says:
{/if}
<div
  class={classNames(
    "mb-12 rounded-2xl shrink-0 border transition-all text-white duration-150 bg-blue-700 w-44 h-56 flex justify-center items-center text-center p-5 shadow-md"
  )}
>
  <h3>
    {#if $gameStore.answerInFocus}
      {@html $gameStore.answerInFocus.answer}
    {:else}
      {@html selectedCard
        ? selectedCard
        : $gameStore.questionCard
            .replace(oneLineRegex, " _________")
            .replace(twoLineRegex, " _________")
            .replace(threeLineRegex, " _________")}
    {/if}
  </h3>
</div>

{#if !$playerStore.isAskingQuestion}
  {#if hasSubmittedCard}
    {#if !$gameStore.isReviewingCards}
      <div class="flex flex-col items-center">Waiting for other players</div>
    {/if}
  {:else}<div class="flex flex-col items-center">
      <div class="flex w-full justify-center flex-wrap gap-4 px-5">
        {#each $playerStore.answerCards as card}
          <div
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
