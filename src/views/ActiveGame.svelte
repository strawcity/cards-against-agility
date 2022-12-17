<script lang="ts">
  import { playerStore, gameStore } from "../stores/game-store";
  import classNames from "classnames";
  import AskerView from "./../components/AskerView.svelte";
  import PlayingCardView from "src/components/PlayingCardView.svelte";

  let playerId;
  let selectedCard;
  const oneLineRegex = /---/;
  const twoLineRegex = /----/;
  const threeLineRegex = /-----/;

  playerStore.subscribe((store) => {
    const playerStore = store;
    playerId = playerStore.playerId;
  });

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
  <PlayingCardView />
{:else}
  <AskerView />
{/if}
