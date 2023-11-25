import { PUBLIC_SOCKET_URL } from '$env/static/public';
import ioClient from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { playerStore, type PlayerStore } from './../stores/game-store';
import { onMount } from 'svelte';
import { writable } from 'svelte/store';

export const io = writable<Socket>();

export function setIo(socket: Socket) {
	io.set(socket);
}

// export const io = socket;
