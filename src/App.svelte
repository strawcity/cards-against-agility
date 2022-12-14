<script lang="ts">
  import Routes from "./Routes.svelte";
  import { playerStore, gameStore } from "./stores/game-store";
  import { navigate } from "svelte-routing";
  import { websocketStore } from "./stores/websocket-store";

  websocketStore.connect("ws://localhost:1999");
  websocketStore.onmessage((message) => {
    const response = JSON.parse(message.data);

    switch (response.method) {
      case "connect":
        $playerStore.playerId = response.playerId;
        break;

      case "create-game":
        $gameStore.id = response.game.id;
        $gameStore.players = response.game.players;
        $playerStore.nickname = response.nickname;
        if (response.game.id && response.nickname) {
          navigate(`/${response.game.id}`);
        }

        break;
      case "join-game":
        $playerStore.nickname = response.nickname;
        $gameStore.players = response.game.players;
        $playerStore.nickname = response.nickname;

        break;

      case "invalid-game-id":
        alert("Couldn't find that game!");
        break;

      // case "join":
      //   const game = response.game;

      //   $playerList = response.playerList;
      //   let curentClient = game.clients.find((client) => {
      //     return client.playerId === $playerStore.playerId;
      //   });

      //   if (curentClient.answerCards) {
      //     $playerStore.answerCards = curentClient.answerCards;
      //   }

      //   return;
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
