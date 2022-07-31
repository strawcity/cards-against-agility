<script lang="ts">
  import { createNewGame, initAuth } from "./../gameLogic";
  import { navigate } from "svelte-routing";

  let gameId = "";
  const { joinGame, playerData, playerRef } = initAuth();
  console.log("🚀 ~ playerRef", playerRef);
  console.log("🚀 ~ playerDataStore", playerData);

  function handleCreateGameClick() {
    createNewGame("ABC123");
    navigate(`/room/ABC123`);
  }
</script>

{playerData}

<button
  class="mt-5 w-56 py-7 rounded-lg bg-green-100"
  on:click={() => handleCreateGameClick()}>Create game</button
>
