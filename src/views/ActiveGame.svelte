<script lang="ts">
  export let gameId;
  let clientId;
  let playerTitle;
  let nickname;
  let tempNickname;
  let ws = new WebSocket("ws://localhost:9090");
  ws.onmessage = (message) => {
    const response = JSON.parse(message.data);
    if (response.method === "connect") {
      clientId = response.clientId;
      playerTitle = response.playerTitle;
      console.log("Client id Set successfully " + clientId);
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

  <h1>{gameId}</h1>
{/if}
