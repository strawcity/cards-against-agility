<script lang="ts">
  import session from "./../stores/session";
  export let roomId;

  // function playCard() {
  // 	 room.send("move", { answer: 'some text' });
  // }
</script>

<h1>Welcome, {$session.playerName}!</h1>
<h1>Welcome, {$session.playerId}!</h1>

<h1>{roomId}</h1>

<!-- <button on:click={playCard}> Play card</button> -->
