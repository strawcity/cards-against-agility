<script lang="ts">
  import * as Colyseus from "colyseus.js"; // not necessary if included via <script> tag.
  import session from "./../stores/session";

  var client = new Colyseus.Client("ws://localhost:2567");
  console.log("🚀 ~ client", client);

  let roomId;

  if (roomId) {
    client
      .reconnect(roomId, $session.playerId)
      .then((room) => {
        console.log(room.sessionId, "joined", room.name);
      })
      .catch((e) => {
        console.log("JOIN ERROR", e);
      });
  } else {
    client
      .joinOrCreate("my_room")
      .then((room) => {
        $session.roomId = room.id;
        roomId = room.id;
        $session.playerId = room.sessionId;

        console.log(room.sessionId, "joined", room.name);
      })
      .catch((e) => {
        console.log("JOIN ERROR", e);
      });
  }
</script>

<h1>Welcome, {$session.playerName}!</h1>
<h1>Welcome, {$session.playerId}!</h1>
<a href={`/room/${roomId}`}>Create room</a>
