<script lang="ts">
	import { gameStore, playerStore, type Player, type SubmittedCard } from '../../stores/game-store';
	import classNames from 'classnames';
	import {
		distributeCurrentAnswerInFocus,
		newRound,
		selectWinner
	} from '../../helpers/gameFunctions';
	import { getPlayerNickname } from './../../helpers/getPlayerNickname';
	import QuestionCard from './../QuestionCard.svelte';

	// Show winner announcement similar to PlayingCardView
	$: showWinnerAnnouncement = $gameStore.winner && !$gameStore.isGameOver;

	$: playersWithCards = addAnswerCardsToPlayers(
		$gameStore.players.filter((player) => player.playerId !== $playerStore.playerId),
		$gameStore.submittedCards || []
	);

	function addAnswerCardsToPlayers(players: Player[], submittedCards: SubmittedCard[]): Player[] {
		const updatedPlayers = players.map((player) => ({ ...player }));

		submittedCards.forEach((submittedCard) => {
			const playerIndex = updatedPlayers.findIndex(
				(player) => player.playerId === submittedCard.playerId
			);

			if (playerIndex !== -1) {
				updatedPlayers[playerIndex] = {
					...updatedPlayers[playerIndex],
					roundCards: submittedCard.cards
				};
			}
		});

		return updatedPlayers;
	}

	function handleRevealClick(player: Player) {
		distributeCurrentAnswerInFocus(player.playerId, player?.roundCards?.[0] || '');
	}

	function handleSelectWinnerClick() {
		selectWinner($gameStore.answerInFocus.player);
	}

	function handleNextRoundClick() {
		newRound();
	}
</script>

<!-- Show winner announcement if winner is set -->
{#if showWinnerAnnouncement}
	{getPlayerNickname($gameStore.winner, $gameStore.players)} won with:
{/if}

<QuestionCard />

<div class="flex w-full justify-center flex-wrap gap-4 px-5">
	{#each playersWithCards as player}
		<button
			on:click={() => ($gameStore.isInRetro ? handleRevealClick(player) : null)}
			class={classNames(
				'rounded-2xl shrink-0 border font-sans transition-all border-dashed duration-150 w-40 h-52 flex justify-center items-center text-center p-5 shadow',
				{
					'bg-black text-white border-none':
						player.roundCards?.[0] === $gameStore.answerInFocus.answer,
					'text-blue-700 border-blue-700 bg-white opacity-40': !!player.roundCards,
					'cursor-pointer': $gameStore.isInRetro,
					'opacity-40': player.roundCards?.[0] !== $gameStore.answerInFocus.answer
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
			class="border text-white bg-blue-700 rounded-2xl p-3 mt-5">Start next round!</button
		>
	{:else if $gameStore.isInRetro}
		<button
			on:click={handleSelectWinnerClick}
			disabled={!$gameStore.answerInFocus.answer}
			class="border border-blue-700 bg-white text-blue-700 rounded-2xl p-3 mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Select <b
				>{getPlayerNickname($gameStore.answerInFocus.player, $gameStore.players)}'s
			</b> answer as the winner</button
		>
	{:else}
		Waiting for players
	{/if}
{/if}
