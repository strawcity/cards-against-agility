<script lang="ts">
  import Routes from "./Routes.svelte";
  window.onpopstate = function () {
    console.log("change");
    // Handle the websocket connection when the URL changes
    // For example, you might want to send a message to the server to let it know
    // that the URL has changed, or you might want to close the connection and
    // open a new one with the updated URL
  };
  // warn before reload
  // window.onbeforeunload = function () {
  //   return "Data will be lost if you leave the page, are you sure?";
  // };
</script>

<main class="flex flex-col w-full h-screen items-center justify-center">
  <Routes />
</main>
