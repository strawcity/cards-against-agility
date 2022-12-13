<script lang="ts">
  import Routes from "./Routes.svelte";
  import { gameStore, playerList } from "./stores/game-store";
  import { websocketStore } from "./stores/websocket-store";

  websocketStore.connect("ws://localhost:9090");
  websocketStore.onmessage((message) => {
    const response = JSON.parse(message.data);

    switch (response.method) {
      case "connect":
        $gameStore.clientId = response.clientId;
        $gameStore.playerTitle = response.playerTitle;
        return;

      case "return-nickname":
        $gameStore.nickname = response.nickname;
        return;

      case "create":
        if (response.game.id) {
          location.href = `/${response.game.id}`;
        }
        return;

      case "invalid-game-id":
        alert("Couldn't find that game!");
        return;

      case "join":
        const game = response.game;
        function flatMap(arr, callback) {
          return arr.map(callback).flat();
        }

        $playerList = flatMap(game.clients, (obj) => {
          return [`${obj.playerTitle} ${obj.nickname}`];
        });
        let curentClient = game.clients.find((client) => {
          return client.clientId === $gameStore.clientId;
        });

        if (curentClient.answerCards) {
          $gameStore.answerCards = curentClient.answerCards;
        }

        return;
    }
  });

  // warn before reload
  // window.onbeforeunload = function () {
  //   return "Data will be lost if you leave the page, are you sure?";
  // };
</script>

<main class="flex flex-col w-full h-screen items-center justify-center">
  <Routes />
</main>
