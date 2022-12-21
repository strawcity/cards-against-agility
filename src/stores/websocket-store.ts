import { writable } from "svelte/store";
let websocket;

const createWebSocketStore = () => {
  const { subscribe } = writable(null);

  const connect = (url) => {
    websocket = new WebSocket(url);
    websocket.onmessage = () => {};
  };

  const send = (data) => {
    if (websocket) {
      websocket.send(JSON.stringify(data));
    }
  };

  const onmessage = (callback) => {
    if (websocket) {
      websocket.onmessage = callback;
    }
  };

  return {
    subscribe,
    connect,
    send,
    onmessage,
  };
};

export const websocketStore = createWebSocketStore();
