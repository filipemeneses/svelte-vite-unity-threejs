<script lang="ts">
  import { onMount } from "svelte";
  import { mountThreeJsExample } from "./lib/mountThreeJsExample";

  let container: Element;

  onMount(async () => {
    mountThreeJsExample(container);
  });
</script>

<div bind:this={container} />

<style>
  :global(html) {
    overflow: hidden;
  }
</style>
