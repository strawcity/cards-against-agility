<script lang="ts">
  import session from "./../stores/session";
  import clientStore from "./../stores/colyseusClient";
  export let roomId;

  let client = $clientStore;
  let playerData;

  session.subscribe((value) => {
    playerData = value;
  });

  console.log("🚀 ~ playerData", playerData);
  var room;

  // if (playerData.playerId) {
  //   client
  //     .joinById(playerData.roomId)
  //     .then((room_instance) => {
  //       room = room_instance;
  //       console.log(room_instance.sessionId, "joined", room_instance.name);
  //     })
  //     .catch((e) => {
  //       console.log("JOIN ERROR", e);
  //     });
  // }

  function playCard() {
    room.send("playCard", { answer: "some text" });
  }
</script>

<h1>Welcome, {$session.playerName}!</h1>
<h1>Welcome, {$session.playerId}!</h1>

<h1>{roomId}</h1>

<button on:click={playCard}> Play card</button>
