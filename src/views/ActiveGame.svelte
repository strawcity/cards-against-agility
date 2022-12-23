<script lang="ts">
  import { playerStore } from "../stores/game-store";
  import AskerView from "./../components/AskerView.svelte";
  import PlayingCardView from "./../components/PlayingCardView.svelte";
</script>

{#if $playerStore.wonCards > 0}
  <div class="w-full h-4 absolute top-0">Points: {$playerStore.wonCards}</div>
{/if}

{#if $playerStore.isAskingQuestion}
  <AskerView />
{:else}
  <PlayingCardView />
{/if}
