<script lang="ts">
  import { gameStore, playerStore, Player } from "../stores/game-store";
  import classNames from "classnames";
  import { distributeCurrentAnswerInFocus } from "../helpers/gameFunctions";

  let cards = $gameStore.players.filter(
    (player) => player.playerId !== $playerStore.playerId
  );

  $: if ($gameStore.submittedCards?.length > 0) {
    cards = addCard(cards, $gameStore.submittedCards);
  }

  function addCard(playersArray, cardsArray) {
    for (let i = 0; i < playersArray.length; i++) {
      for (let j = 0; j < cardsArray.length; j++) {
        if (playersArray[i].playerId === cardsArray[j].player) {
          playersArray[i].card = cardsArray[j].card;
        }
      }
    }
    return playersArray;
  }

  function handleRevealClick(card: Player) {
    distributeCurrentAnswerInFocus(card.playerId, card.card);
  }
</script>

<div class="flex w-full justify-center flex-wrap gap-4 px-5">
  {#each cards as card}
    <div
      on:click={() =>
        $gameStore.isReviewingCards ? handleRevealClick(card) : null}
      class={classNames(
        "rounded-2xl shrink-0 border transition-all border-dashed duration-150 w-40 h-52 flex justify-center items-center text-center p-5 shadow",
        {
          "bg-black text-white  border-none": card.card,
          "text-blue-700 border-blue-700 bg-white opacity-40": !card.card,
          "cursor-pointer": $gameStore.isReviewingCards,
        }
      )}
    >
      {card.nickname}'s card
    </div>
  {/each}
</div>
