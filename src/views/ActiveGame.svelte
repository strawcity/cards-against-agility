<script lang="ts">
  import classNames from "classnames";
  import { playerStore, gameStore } from "../stores/game-store";
  import AskerView from "./../components/AskerView.svelte";
  import PlayingCardView from "./../components/PlayingCardView.svelte";
</script>

{#if $playerStore.wonCards > 0}
  <div class="w-full h-4 absolute top-20 left-20">
    Points: {$playerStore.wonCards}
  </div>
{/if}

<div
  class={classNames(
    "absolute p-5 top-0 w-full -16 text-white flex justify-center items-center",
    {
      "bg-blue-700": $gameStore.isInRetro,
      "bg-black": !$gameStore.isInRetro,
    }
  )}
>
  {$gameStore.isInRetro ? "R E T R O S P E C T I V E" : " S P R I N T"}
</div>

<div
  style="left:calc(50vw + -32px)"
  class={classNames(
    "absolute p-5 w-full rotate-90 -16 text-white flex justify-center items-center",
    {
      "bg-blue-700": $gameStore.isInRetro,
      "bg-black": !$gameStore.isInRetro,
    }
  )}
>
  {$gameStore.isInRetro ? "R E T R O S P E C T I V E" : " S P R I N T"}
</div>

<div
  style="right:calc(50vw + -32px)"
  class={classNames(
    "absolute p-5 w-full -rotate-90 -16 text-white flex justify-center items-center",
    {
      "bg-blue-700": $gameStore.isInRetro,
      "bg-black": !$gameStore.isInRetro,
    }
  )}
>
  {$gameStore.isInRetro ? "R E T R O S P E C T I V E" : " S P R I N T"}
</div>

{#if $playerStore.isAskingQuestion}
  <AskerView />
{:else}
  <PlayingCardView />
{/if}
