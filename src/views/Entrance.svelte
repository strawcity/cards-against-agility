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
    createGame(tempNickname + ", " + jobTitle);
  }
</script>

<div class="flex flex-col gap-5">
  <h1 class="text-green-500">Welcome, to Cards Against Agility!</h1>
  <h1 class="text-green-500">Choose a job title and a nickname</h1>
  <div class="flex flex-col">
    <input class="border border-green-300 " bind:value={tempNickname} />
    {jobTitle}
  </div>

  <button
    class="border border-blue-300 rounded-2xl p-3"
    on:click={getNewJobTitle}>Generate new job title</button
  >
  <button
    disabled={!tempNickname}
    class={classNames("border text-white bg-blue-700 rounded-2xl p-3", {
      "opacity-30": !tempNickname,
    })}
    on:click|once={handleSaveNicknamelick}
    >Save nickname and open a lobby</button
  >
</div>
