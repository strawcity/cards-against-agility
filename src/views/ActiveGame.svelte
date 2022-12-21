<script lang="ts">
  import { playerStore } from "../stores/game-store";
  import AskerView from "./../components/AskerView.svelte";
  import PlayingCardView from "./../components/PlayingCardView.svelte";

  let playerId;

  playerStore.subscribe((store) => {
    const playerStore = store;
    console.log("🚀 ~ playerStore.subscribe ~ playerStore", playerStore);
    playerId = playerStore.playerId;
  });
</script>

{#if !$playerStore.isAskingQuestion}
  <PlayingCardView />
{:else}
  <AskerView />
{/if}
