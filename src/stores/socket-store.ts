import { PUBLIC_SOCKET_URL } from '$env/static/public';
import ioClient from 'socket.io-client';

const socket = ioClient(PUBLIC_SOCKET_URL);

export const io = socket;
