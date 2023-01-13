<script lang="ts">
	import { io } from './../stores/socket-store';
	import { onMount } from 'svelte';
	import Footer from './Footer.svelte';
	import '../app.css';
	import { playerStore, gameStore } from './../stores/game-store';
	import { goto } from '$app/navigation';

	onMount(() => {
		io.on('connected', (playerId) => {
			$playerStore.playerId = playerId;
		});

		io.on('create-game', (response) => {
			$gameStore.id = response.game.id;
			$gameStore.players = response.game.players;
			$playerStore.nickname = response.nickname;
			if (response.game.id && response.nickname) {
				goto(`lobby/${response.game.id}`);
			}
		});

		io.on('join-game', (response) => {
			$playerStore.nickname = response.nickname;
			$gameStore.players = response.game.players;
			$gameStore.id = response.game.id;
			$playerStore.nickname = response.nickname;
		});

		io.on('start-game', (response) => {
			$playerStore.answerCards = response.answerCards;
			$playerStore.answerCards = response.answerCards;
			$playerStore.isAskingQuestion = response.isAskingQuestion;
			$gameStore.questionCard = response.questionCard;
			if ($playerStore.answerCards) {
				goto('/active-game');
			}
		});

		io.on('receive-answer-card', (response) => {
			$gameStore.submittedCards = response.submittedCards;
		});

		io.on('start-card-review', () => {
			$gameStore.isInRetro = true;
		});

		io.on('show-answer', (response) => {
			$gameStore.answerInFocus = response.inFocusCard;
		});

		io.on('show-round-winner', (response) => {
			$gameStore.winner = response.winningPlayer;
			$playerStore.wonCards = response.wonCards;
		});

		io.on('new-round', (response) => {
			$gameStore.isInRetro = false;
			$gameStore.answerInFocus = { player: '', answer: '' };
			$gameStore.winner = '';
			$playerStore.answerCards = response.answerCards;
			$playerStore.isAskingQuestion = response.isAskingQuestion;
			$gameStore.questionCard = response.questionCard;
		});

		io.on('show-game-winner', (response) => {
			$gameStore.isGameOver = true;
			$gameStore.winner = response.winningPlayer;
		});
	});
</script>

<main class="flex flex-col w-full h-screen items-center justify-center font-unbounded">
	<slot />
	<Footer />
</main>
