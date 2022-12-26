<script lang="ts">
  import Routes from "./Routes.svelte";
  import { playerStore, gameStore } from "./stores/game-store";
  import { navigate } from "svelte-routing";
  import { websocketStore } from "./stores/websocket-store";
  import Footer from "./views/Footer.svelte";
  websocketStore.connect(import.meta.env.VITE_WS_URL);

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
        $gameStore.id = response.game.id;
        $playerStore.nickname = response.nickname;
        break;

      case "start-game":
        $playerStore.answerCards = response.answerCards;
        $playerStore.answerCards = response.answerCards;
        $playerStore.isAskingQuestion = response.isAskingQuestion;
        $gameStore.questionCard = response.questionCard;
        if ($playerStore.answerCards) {
          navigate("active-game");
        }
        break;

      case "receive-answer-card":
        $gameStore.submittedCards = response.submittedCards;
        break;

      case "start-card-review":
        $gameStore.isInRetro = true;
        break;

      case "show-answer":
        $gameStore.answerInFocus = response.inFocusCard;
        break;

      case "show-winner":
        $gameStore.winner = response.winningPlayer;
        $playerStore.wonCards = response.wonCards;
        break;

      case "new-round":
        $gameStore.isInRetro = false;
        $gameStore.answerInFocus = null;
        $gameStore.winner = null;
        $playerStore.answerCards = response.answerCards;
        $playerStore.isAskingQuestion = response.isAskingQuestion;
        $gameStore.questionCard = response.questionCard;
        break;

      case "invalid-game-id":
        alert("Couldn't find that game!");
        break;
    }
  });

  // warn before reload
  // window.onbeforeunload = function () {
  //   return "Data will be lost if you leave the page, are you sure?";
  // };
</script>

<main
  class="flex flex-col w-full h-screen items-center justify-center font-unbounded"
>
  <Routes />
  <Footer />
</main>
