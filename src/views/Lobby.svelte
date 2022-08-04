<script lang="ts">
  import * as Colyseus from "colyseus.js"; // not necessary if included via <script> tag.
  import session from "./../stores/session";
  import clientStore from "./../stores/colyseusClient";
  import { getDefaultUserName } from "../helpers/getDefaultUserName";

  clientStore.set(new Colyseus.Client("ws://localhost:2567"));

  let client = $clientStore;
  let playerData;

  session.subscribe((value) => {
    playerData = value;
    console.log("🚀 ~ session.subscribe ~ playerData", playerData);
  });

  // if (roomId) {
  //   client
  //     .reconnect(roomId, $session.playerId)
  //     .then((room) => {
  //       console.log(room.sessionId, "joined", room.name);
  //     })
  //     .catch((e) => {
  //       console.log("JOIN ERROR", e);
  //     });
  // } else {
  client
    .joinOrCreate("conference_room")
    .then((room) => {
      session.set({
        playerName: getDefaultUserName(),
        playerId: room.sessionId,
        roomId: room.id,
      });
    })
    .catch((e) => {
      console.log("JOIN ERROR", e);
    });
  // }
</script>

<h1>Welcome, {playerData.playerName}!</h1>
<h1>Welcome, {playerData.playerId}!</h1>
<a href={`/room/${playerData.roomId}`}>Create room</a>
