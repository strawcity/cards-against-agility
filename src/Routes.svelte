<script lang="ts">
  import { Router, Route } from "svelte-routing";
  import Lobby from "./views/Lobby.svelte";
  import Entrance from "./views/Entrance.svelte";
  import ActiveGame from "./views/ActiveGame.svelte";
</script>

<Router>
  <Route path="/" component={Entrance} />
  <Route path="/lobby/:gameId" let:params>
    <Lobby gameId={params.gameId} />
  </Route>
  <Route path="/active-game" component={ActiveGame} />
</Router>
