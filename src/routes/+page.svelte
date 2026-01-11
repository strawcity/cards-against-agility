<script lang="ts">
	import { playerStore } from '../stores/game-store';
	import { createGame, generateJobTitle } from '../helpers/gameFunctions';
	import classNames from 'classnames';
	import Header from './Header.svelte';
	import ioClient from 'socket.io-client';
	import { setIo } from '../stores/socket-store';
	import { onMount } from 'svelte';

	let playerId;
	let tempNickname: string;
	let jobTitle = '';

	onMount(() => {
		if (!jobTitle) {
			jobTitle = generateJobTitle();
		}
	});

	playerStore.subscribe((store) => {
		const playerStore = store;
		playerId = playerStore.playerId;
	});

	function getNewJobTitle() {
		jobTitle = generateJobTitle();
	}

	async function handleSaveNicknameClick() {
		const response = await fetch('/api/connect');
		await response.json().then((data) => {
			let socket = ioClient(window.location.origin, {
				auth: {
					token: data.token
				}
			});
			setIo(socket);
			socket.on('connected', (playerId) => {
				$playerStore.playerId = playerId;
				createGame(playerId, tempNickname + ', ' + jobTitle);
			});
		});
	}
</script>

<Header />
<div class="flex flex-col gap-5">
	<div>
		<form on:submit|preventDefault={handleSaveNicknameClick}>
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
		<button class="border border-blue-300 rounded-2xl p-3" on:click|preventDefault={getNewJobTitle}
			>Generate job title
		</button>
	</div>
	<button
		on:click|once={handleSaveNicknameClick}
		disabled={!tempNickname}
		class={classNames('border text-white bg-blue-700 rounded-2xl p-3', {
			'opacity-30': !tempNickname
		})}
		>Save nickname and open a lobby
	</button>
</div>
