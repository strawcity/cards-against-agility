<script lang="ts">
  let clientId;
  let playerTitle;
  let nickname;
  let tempNickname;
  let gameId;
  let ws = new WebSocket("ws://localhost:9090");
  ws.onmessage = (message) => {
    //message.data
    const response = JSON.parse(message.data);
    if (response.method === "connect") {
      clientId = response.clientId;
      playerTitle = response.playerTitle;
      console.log("Client id Set successfully " + clientId);
    }
    if (response.method === "create") {
      gameId = response.game.id;
      console.log(
        "game successfully created with id " +
          response.game.id +
          " with " +
          response.game.balls +
          " balls"
      );
      if (gameId) {
        location.href = `/room/${gameId}`;
      }
    }
    if (response.method === "return-nickname") {
      nickname = response.nickname;
      console.log("🚀 ~ nickname", nickname);
    }
  };

  function handleSaveNicknamelick() {
    const payLoad = {
      method: "save-nickname",
      clientId: clientId,
      nickname: tempNickname,
    };

    ws.send(JSON.stringify(payLoad));
  }

  function handleNewGameClick() {
    const payLoad = {
      method: "create",
      clientId: clientId,
      nickname: nickname,
    };

    ws.send(JSON.stringify(payLoad));
  }

  function handleJoinGameClick() {
    // if (gameId === null) gameId = gameId;

    const payLoad = {
      method: "join",
      clientId: clientId,
      gameId: gameId,
    };

    ws.send(JSON.stringify(payLoad));
  }
</script>

{#if !nickname}
  <h1>
    Welcome, {playerTitle}
    <input class="border border-green-300" bind:value={tempNickname} />!
  </h1>
  <button
    class="border border-emerald-300 rounded-2xl p-3"
    on:click|once={handleSaveNicknamelick}>Enter nickname</button
  >
{:else}
  <h1>
    Welcome, {playerTitle}
    {nickname}!
  </h1>
  <button
    class="border border-emerald-300 rounded-2xl p-3"
    on:click|once={handleNewGameClick}>New Game</button
  >
  <button
    class="border border-emerald-300 rounded-2xl p-3 mt-5"
    on:click={handleJoinGameClick}
    id="btnJoin">Join Game</button
  >
  <input class="border border-green-300" bind:value={gameId} />
  <h1>{gameId}</h1>
{/if}
