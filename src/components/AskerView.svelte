<script>
  import { gameStore, playerStore } from "../stores/game-store";
  import classNames from "classnames";

  let cards = $gameStore.players.filter(
    (player) => player.playerId !== $playerStore.playerId
  );

  $: $gameStore.submittedCards;
</script>

<div class="flex w-full justify-center flex-wrap gap-4 px-5">
  {#each cards as cardPlaceHolders}
    <div
      class={classNames(
        "rounded-2xl shrink-0 border transition-all border-dashed bg-white duration-150 text-blue-700 border-blue-700 w-40 h-52 flex justify-center items-center text-center p-5 shadow opacity-40"
      )}
    >
      {cardPlaceHolders.nickname}'s card
    </div>
  {/each}
</div>
