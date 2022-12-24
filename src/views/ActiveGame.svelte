<script lang="ts">
  import { playerStore, gameStore } from "../stores/game-store";
  import AskerView from "./../components/AskerView.svelte";
  import PlayingCardView from "./../components/PlayingCardView.svelte";
</script>

{#if $playerStore.wonCards > 0}
  <div class="w-full h-4 absolute top-0">Points: {$playerStore.wonCards}</div>
{/if}

{#if $gameStore.isInRetro}
  <div
    class="absolute p-5 top-0 w-full bg-blue-700 flex justify-center items-center"
  >
    R E T R O S P E C T I V E
  </div>
{:else}
  <div
    class="absolute p-5 top-0 w-full bg-blue-307 flex justify-center items-center"
  >
    S P R I N T
  </div>
{/if}

{#if $playerStore.isAskingQuestion}
  <AskerView />
{:else}
  <PlayingCardView />
{/if}
