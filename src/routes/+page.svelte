<script lang="ts">
	import { playerStore } from '../stores/game-store';
	import { createGame, generateJobTitle } from '../helpers/gameFunctions';
	import classNames from 'classnames';
	import Header from './Header.svelte';
	import { PUBLIC_SOCKET_URL } from '$env/static/public';
	import ioClient from 'socket.io-client';
	import { io, setIo } from '../stores/socket-store';

	let playerId;
	let tempNickname: string;
	let jobTitle = generateJobTitle();

	playerStore.subscribe((store) => {
		const playerStore = store;
		playerId = playerStore.playerId;
	});

	function getNewJobTitle() {
		jobTitle = generateJobTitle();
	}

	async function handleSaveNicknameClick() {
		const response = await fetch(`${PUBLIC_SOCKET_URL}/connect`);
		await response.json().then((data) => {
			let socket = ioClient(PUBLIC_SOCKET_URL, {
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
		{jobTitle}
	</div>

	<div>
		<button class="border border-blue-300 rounded-2xl p-3" on:click|preventDefault={getNewJobTitle}
			>Generate new job title
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
