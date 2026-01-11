import ioClient from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { writable } from 'svelte/store';

export const io = writable<Socket>();

export function setIo(socket: Socket) {
	io.set(socket);
}

// export const io = socket;
