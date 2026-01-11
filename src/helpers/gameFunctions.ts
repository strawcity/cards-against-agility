import { get } from 'svelte/store';
import { io } from './../stores/socket-store';
import { gameStore, playerStore } from './../stores/game-store';
import type { Socket } from 'socket.io-client';

export function createGame(playerId: string, nickname: string) {
	const ioStore = get(io);
	if (!ioStore) return;
	ioStore.emit('create-game', {
		playerId: playerId,
		nickname: nickname
	});
}

export function joinGame(nickname: string, gameId: string) {
	const ioStore = get(io);
	const playerId = get(playerStore).playerId;
	if (!ioStore || !playerId) return;
	ioStore.emit('join-game', {
		playerId: playerId,
		nickname: nickname,
		gameId: gameId
	});
}

export function startGame(gameId: string) {
	const ioStore = get(io);
	if (!ioStore) {
		console.error('Socket not connected. Cannot start game.');
		return;
	}
	if (!ioStore.connected) {
		console.error('Socket not connected. Cannot start game.');
		return;
	}
	ioStore.emit('start-game', {
		gameId: gameId
	});
}

export function submitCard(playerId: string, submittedCard: string) {
	const ioStore = get(io);
	const storedGameId = get(gameStore).id;
	if (!ioStore || !storedGameId) return;
	ioStore.emit('submit-card', {
		gameId: storedGameId,
		playerId: playerId,
		submittedCard: submittedCard
	});
}

export function distributeCurrentAnswerInFocus(
	/* This function takes the current answering-player-in-focus's ID and the completed answer string with <b></b> tags and sends this information to everyone */
	answeringPlayer: string,
	answerInFocus: string
) {
	const ioStore = get(io);
	const storedGameId = get(gameStore).id;
	if (!ioStore || !storedGameId) return;
	ioStore.emit('show-current-answer', {
		gameId: storedGameId,
		playerId: answeringPlayer,
		answer: answerInFocus
	});
}

export function selectWinner(winningPlayer: string) {
	const ioStore = get(io);
	const storedGameId = get(gameStore).id;
	if (!ioStore || !storedGameId) return;
	ioStore.emit('select-winner', { winningPlayer: winningPlayer, gameId: storedGameId });
}

export function newRound() {
	const ioStore = get(io);
	const storedGameId = get(gameStore).id;
	if (!ioStore || !storedGameId) return;
	ioStore.emit('new-round', { gameId: storedGameId });
}

function randomFromArray(array: string[]) {
	return array[Math.floor(Math.random() * array.length)];
}

export function generateJobTitle() {
	const levels = randomFromArray([
		'Junior',
		'Senior',
		'10x',
		'Staff',
		'Rockstar',
		'Mid',
		'Basic ass',
		'Ninja',
		'Guru',
		'Maverick',
		'Wizard'
	]);

	const roles = randomFromArray([
		'PM',
		'Developer',
		'Designer',
		'PO',
		'Scrum Master',
		'Enginner',
		'UX Researcher',
		'Dev Rel',
		'Engineering Manger'
	]);

	return `${levels} ${roles}`;
}
