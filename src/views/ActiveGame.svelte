<script lang="ts">
  import { playerStore, gameStore } from "../stores/game-store";
  import classNames from "classnames";
  import AskerView from "./../components/AskerView.svelte";
  import PlayingCardView from "./../components/PlayingCardView.svelte";

  let playerId;
  let selectedCard;
  const oneLineRegex = /---/;
  const twoLineRegex = /----/;
  const threeLineRegex = /-----/;

  playerStore.subscribe((store) => {
    const playerStore = store;
    playerId = playerStore.playerId;
  });
</script>

{#if !$playerStore.isAskingQuestion}
  <PlayingCardView />
{:else}
  <AskerView />
{/if}
