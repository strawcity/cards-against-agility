<script lang="ts">
	import { playerStore, gameStore } from './../../../stores/game-store';
	import { fly } from 'svelte/transition';
	import classNames from 'classnames';
	import { generateJobTitle, joinGame, startGame } from './../../../helpers/gameFunctions';

	let gameId = $page.params.room;
	let playerId;
	let nickname;
	let showCopiedBanner = false;
	let jobTitle = '';

	onMount(() => {
		if (!jobTitle) {
			jobTitle = generateJobTitle();
		}
	});

	let tempNickname: string;
	import { page } from '$app/stores';
	import ioClient from 'socket.io-client';
	import { setIo } from './../../../stores/socket-store';
	import { onMount } from 'svelte';

	playerStore.subscribe((store) => {
		const playerStore = store;
		playerId = playerStore.playerId;
		nickname = playerStore.nickname;
	});

	async function handleJoinGameClick() {
		const response = await fetch('/api/connect');
		await response.json().then((data) => {
			let socket = ioClient(window.location.origin, {
				auth: {
					token: data.token
				}
			});
			socket.on('connected', (playerId) => {
				$playerStore.playerId = playerId;
				joinGame(tempNickname + ', ' + jobTitle, gameId);
			});
			setIo(socket);
		});
	}
	function handleStartGameClick() {
		startGame(gameId);
	}

	function getNewJobTitle() {
		jobTitle = generateJobTitle();
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(document.location.href);
		showCopiedBanner = true;

		setTimeout(() => {
			showCopiedBanner = false;
		}, 3000);
	}
</script>

{#if showCopiedBanner}
	<div
		in:fly={{ y: -64, duration: 500 }}
		out:fly={{ y: -64, duration: 500 }}
		class="absolute p-5 top-0 w-full bg-blue-300 flex justify-center items-center"
	>
		<p>
			<strong>{document.location.href}</strong> successfully copied to clipboard!
		</p>
	</div>
{/if}

<div class="flex flex-col gap-5">
	{#if $gameStore.players.length > 0}
		LOBBY
		<div class="p-4 border border-blue-700">
			{#each $gameStore.players as player, index}
				<p class="font-semibold">{index + 1}. {player.nickname}</p>
			{/each}
		</div>
		<button class="border border-blue-300 rounded-2xl p-3 mt-5" on:click={copyToClipboard}
			>Share a link with your friend</button
		>
		{#if $gameStore.players.length >= 3}
			<button
				class="border w-72 bg-blue-700 text-white rounded-2xl p-3 mt-5"
				on:click|once={handleStartGameClick}>Start game</button
			>
		{/if}
	{/if}
</div>

{#if $gameStore.players.length < 1}
	<div class="flex flex-col gap-5">
		<div>
			<form on:submit|preventDefault={handleJoinGameClick}>
				<label>
					<div class="flex items-center">
						<input class="border-b border-blue-700 font-semibold" bind:value={tempNickname} />
					</div>
				</label>
			</form>
			<div class="h-4 transition-opacity duration-500 {jobTitle ? 'opacity-100' : 'opacity-0'}">
				{jobTitle}
			</div>
		</div>

		<div>
			<button class="border border-blue-300 rounded-2xl p-3" on:click={getNewJobTitle}
				>Generate new job title</button
			>
		</div>
		<button
			on:click|once={handleJoinGameClick}
			disabled={!tempNickname}
			class={classNames('border text-white bg-blue-700 rounded-2xl p-3', {
				'opacity-30': !tempNickname
			})}
		>
			Save nickname and join lobby
		</button>
	</div>
{/if}
