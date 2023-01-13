<script lang="ts">
	import GameOverSidebars from './../../components/GameOverSidebars.svelte';
	import SideBars from './../../components/SideBars.svelte';
	import AskerView from '../../components/views/AskerView.svelte';
	import PlayingCardView from '../../components/views/PlayingCardView.svelte';
	import { gameStore, playerStore } from './../../stores/game-store';
</script>

{#if $playerStore.wonCards > 0 && !$gameStore.winner}
	<div class="w-full h-4 absolute top-20 left-20">
		Points: {$playerStore.wonCards}
	</div>
{/if}

{#if $gameStore.isGameOver}
	<GameOverSidebars />
{:else}
	<SideBars />
{/if}

{#if $gameStore.isGameOver}
	<div>Game over</div>
{:else if $playerStore.isAskingQuestion}
	<AskerView />
{:else}
	<PlayingCardView />
{/if}
