<script lang="ts">
  import { Router, Route } from "svelte-routing";
  import ActiveGame from "./views/ActiveGame.svelte";
  import Lobby from "./views/Lobby.svelte";
</script>

<Router>
  <Route path="/" component={Lobby} />
  <!-- <Route path="room/" component={Lobby} /> -->
  <Route path="room/:gameId" let:params>
    <ActiveGame gameId={params.gameId} />
  </Route>
</Router>
