<script lang="ts">
  import { playerStore } from "../stores/game-store";
  import AskerView from "./../components/AskerView.svelte";
  import PlayingCardView from "./../components/PlayingCardView.svelte";
</script>

{#if $playerStore.isAskingQuestion}
  <AskerView />
{:else}
  <PlayingCardView />
{/if}
