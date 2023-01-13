<script>
	import { replaceLine } from './../helpers/replaceLine';
	import { gameStore } from '../stores/game-store';

	export let answer = '';
</script>

<div
	class={'mb-12 font-sans rounded-2xl shrink-0 border transition-all text-white duration-150 bg-blue-700 w-52 h-64 flex justify-center items-center text-center p-5 shadow-md'}
>
	<h3>
		{#if $gameStore.answerInFocus.answer}
			{@html replaceLine($gameStore.questionCard, $gameStore.answerInFocus.answer)}
		{:else}
			{@html replaceLine($gameStore.questionCard, answer)}
		{/if}
	</h3>
</div>
