<script lang="ts">
  import classNames from "classnames";
  import { getPlayerNickname } from "./../helpers/getPlayerNickname";
  import { submitCard } from "../helpers/gameFunctions";
  import { playerStore, gameStore } from "../stores/game-store";
  import { replaceLine } from "./../helpers/replaceLine";
  import QuestionCard from "./QuestionCard.svelte";

  let hasSubmittedCard;
  let selectedCard;
  let playerId;

  playerStore.subscribe((store) => {
    const playerStore = store;
    playerId = playerStore.playerId;
  });

  $: if ($gameStore.isInRetro === false) {
    hasSubmittedCard = false;
    selectedCard = null;
  }

  function selectAnswer(card) {
    selectedCard = card;
  }

  function handleSubmitCardClick() {
    submitCard(playerId, selectedCard);
    hasSubmittedCard = true;
  }
</script>

<!-- If we're in the retro: -->
{#if $gameStore.answerInFocus && !$gameStore.winner}
  {getPlayerNickname($gameStore.answerInFocus.player, $gameStore.players)} says:
{/if}
{#if $gameStore.winner}
  {getPlayerNickname($gameStore.winner, $gameStore.players)} won with:
{/if}

<QuestionCard {selectedCard} />

{#if hasSubmittedCard && !$gameStore.isInRetro}
  <h3>Waiting for other players</h3>
{/if}

{#if !hasSubmittedCard}
  <!-- When you're chosing your card: -->
  <div class="flex flex-col items-center">
    <div class="flex w-full justify-center flex-wrap gap-4 px-5">
      {#each $playerStore.answerCards as card}
        <button
          on:click={() => selectAnswer(card)}
          class={classNames(
            "rounded-2xl font-sans shrink-0 border transition-all bg-white duration-150 text-blue-700 border-blue-700 w-40 h-52 flex justify-center items-center text-center p-5 shadow cursor-pointer",
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
