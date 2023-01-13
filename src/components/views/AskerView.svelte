<script lang="ts">
	import { gameStore, playerStore, type Player } from '../../stores/game-store';
	import classNames from 'classnames';
	import {
		distributeCurrentAnswerInFocus,
		newRound,
		selectWinner
	} from '../../helpers/gameFunctions';
	import { getPlayerNickname } from './../../helpers/getPlayerNickname';
	import QuestionCard from './../QuestionCard.svelte';

	let players = $gameStore.players.filter((player) => player.playerId !== $playerStore.playerId);

	$: if ($gameStore.submittedCards?.length > 0) {
		players = addCard(players, $gameStore.submittedCards);
	}

	function addCard(playersArray: Player[], cardsArray: any) {
		console.log('🚀 ~ addCard ~ cardsArray', cardsArray);
		for (let i = 0; i < playersArray.length; i++) {
			for (let j = 0; j < cardsArray.length; j++) {
				if (playersArray[i].playerId === cardsArray[j].player) {
					playersArray[i].card = cardsArray[j].card;
				}
			}
		}
		return playersArray;
	}

	function handleRevealClick(player: Player) {
		distributeCurrentAnswerInFocus(player.playerId, player.card || '');
	}

	function handleSelectWinnerClick() {
		selectWinner($gameStore.answerInFocus.player);
	}

	function handleNextRoundClick() {
		newRound();
	}
</script>

<QuestionCard />

<div class="flex w-full justify-center flex-wrap gap-4 px-5">
	{#each players as player}
		<button
			on:click={() => ($gameStore.isInRetro ? handleRevealClick(player) : null)}
			class={classNames(
				'rounded-2xl shrink-0 border font-sans transition-all border-dashed duration-150 w-40 h-52 flex justify-center items-center text-center p-5 shadow',
				{
					'bg-black text-white  border-none ': player.card,
					'text-blue-700 border-blue-700 bg-white opacity-40 ': !player.card,
					'cursor-pointer': $gameStore.isInRetro,
					'opacity-40': player.card !== $gameStore?.answerInFocus?.answer
				}
			)}
		>
			{player.nickname}'s card
		</button>
	{/each}
</div>

{#if $gameStore.answerInFocus}
	{#if $gameStore.winner}
		<button
			on:click={handleNextRoundClick}
			class="border  text-white bg-blue-700 rounded-2xl p-3 mt-5">Start next round!</button
		>
	{:else}
		<button
			on:click={handleSelectWinnerClick}
			class="border border-blue-700  bg-white text-blue-700 rounded-2xl p-3 mt-5"
			>Select <b
				>{getPlayerNickname($gameStore.answerInFocus.player, $gameStore.players)}'s
			</b>answer as the winner</button
		>
	{/if}
{/if}
