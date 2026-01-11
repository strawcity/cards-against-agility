<script lang="ts">
	import { io } from './../stores/socket-store';
	import { onDestroy } from 'svelte';
	import Footer from './Footer.svelte';
	import '../app.css';
	import { playerStore, gameStore } from './../stores/game-store';
	import { goto } from '$app/navigation';
	import type { Socket } from 'socket.io-client';

	let socket: Socket;
	let handlersRegistered = false;
	const unsubscribe = io.subscribe((value) => {
		socket = value;
	});

	$: if (socket && !handlersRegistered) {
		handlersRegistered = true;

		socket.on('connected', (playerId) => {
			$playerStore.playerId = playerId;
		});

		socket.on('create-game', (response) => {
			$gameStore.id = response.game.id;
			$gameStore.players = response.game.players;
			$gameStore.creatorId = response.game.creatorId;
			$playerStore.nickname = response.nickname;
			if (response.game.id && response.nickname) {
				goto(`lobby/${response.game.id}`);
			}
		});

		socket.on('join-game', (response) => {
			$playerStore.nickname = response.nickname;
			$gameStore.players = response.game.players;
			$gameStore.id = response.game.id;
			$gameStore.creatorId = response.game.creatorId;
		});

		socket.on('start-game', (response) => {
			$playerStore.answerCards = response.answerCards;
			$playerStore.isAskingQuestion = response.isAskingQuestion;
			$gameStore.questionCard = response.questionCard;
			if ($playerStore.answerCards) {
				goto('/active-game');
			}
		});

		socket.on('receive-answer-card', (response) => {
			$gameStore.submittedCards = response.submittedCards;
		});

		socket.on('start-card-review', () => {
			$gameStore.isInRetro = true;
		});

		socket.on('show-answer', (response) => {
			$gameStore.answerInFocus = response.inFocusCard;
		});

		socket.on('show-round-winner', (response) => {
			$gameStore.winner = response.winningPlayer;
			$playerStore.wonCards = response.wonCards;
		});

		socket.on('new-round', (response) => {
			$gameStore.isInRetro = false;
			$gameStore.answerInFocus = { player: '', answer: '' };
			$gameStore.winner = '';
			$gameStore.submittedCards = [];
			$playerStore.answerCards = response.answerCards;
			$playerStore.isAskingQuestion = response.isAskingQuestion;
			$gameStore.questionCard = response.questionCard;
		});

		socket.on('show-game-winner', (response) => {
			$gameStore.isGameOver = true;
			$gameStore.winner = response.winningPlayer;
		});
	}

	onDestroy(() => {
		if (socket) {
			socket.removeAllListeners();
		}
		unsubscribe();
	});
</script>

<main class="flex flex-col w-full h-screen items-center justify-center font-unbounded">
	<slot />
	<Footer />
</main>
