<script lang="ts">
  import { playerStore } from "../stores/game-store";
  import { createGame, generateJobTitle } from "../helpers/gameFunctions";
  import classNames from "classnames";

  let playerId;
  let tempNickname;
  let jobTitle = generateJobTitle();

  playerStore.subscribe((store) => {
    const playerStore = store;
    playerId = playerStore.playerId;
  });

  function getNewJobTitle() {
    jobTitle = generateJobTitle();
  }

  function handleSaveNicknamelick() {
    console.log("🚀 ~ handleSaveNicknamelick ~ handleSaveNicknamelick");
    createGame(tempNickname + ", " + jobTitle);
  }
</script>

<div class="flex flex-col gap-5">
  <h1 class="font-bold text-2xl uppercase">Cards Against Agility</h1>

  <div>
    <form on:submit|preventDefault={handleSaveNicknamelick}>
      <label>
        <div class="flex items-center">
          <input
            class="border-b border-blue-700 font-semibold"
            bind:value={tempNickname}
          />
        </div>
      </label>
    </form>
    {jobTitle}
  </div>

  <div>
    <button
      class="border border-blue-300 rounded-2xl p-3"
      on:click={getNewJobTitle}>Generate new job title</button
    >
  </div>
  <button
    on:click|once={handleSaveNicknamelick}
    disabled={!tempNickname}
    class={classNames("border text-white bg-blue-700 rounded-2xl p-3", {
      "opacity-30": !tempNickname,
    })}
    >Save nickname and open a lobby
  </button>
</div>
