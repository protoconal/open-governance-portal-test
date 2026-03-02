<!--
  routes/+page.svelte — Dashboard / home page.

  Renders a grid of PluginCard components — one per registered plugin.
  Because the grid is driven by the plugin store, no code change is
  required when a new plugin is added to the backend.

  Traceability: ADR-004
-->
<script lang="ts">
  import PluginCard from '$lib/components/PluginCard.svelte';
  import { plugins, pluginsLoading } from '$lib/plugins/registry';
</script>

<svelte:head>
  <title>Dashboard — Open Governance Portal</title>
</svelte:head>

<section class="dashboard">
  <header class="dashboard-header">
    <h1>Dashboard</h1>
    <p class="subtitle">Select a module below to get started.</p>
  </header>

  {#if $pluginsLoading}
    <p class="status">Loading modules…</p>
  {:else if $plugins.length === 0}
    <p class="status empty">
      No modules are currently registered.
      Check that the backend API is running and has plugins loaded.
    </p>
  {:else}
    <div class="plugin-grid" role="list" aria-label="Available governance modules">
      {#each $plugins as plugin (plugin.pluginId)}
        <div role="listitem">
          <PluginCard manifest={plugin} />
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .dashboard-header {
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
    font-weight: 700;
  }

  .subtitle {
    margin: 0;
    color: var(--color-muted);
  }

  .plugin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }

  .status {
    color: var(--color-muted);
    font-size: 1rem;
  }

  .empty {
    padding: 2rem;
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: 0.75rem;
    text-align: center;
  }
</style>
