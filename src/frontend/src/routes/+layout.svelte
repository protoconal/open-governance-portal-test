<!--
  routes/+layout.svelte — Root layout applied to every page.

  Responsibilities
  ────────────────
  1. Load plugin manifests from the backend on first render.
  2. Render the persistent NavBar.
  3. Provide CSS custom properties (design tokens) used by all components.

  Traceability: ADR-004
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import NavBar from '$lib/components/NavBar.svelte';
  import { loadPlugins, pluginsError } from '$lib/plugins/registry';

  // Kick off the plugin manifest load as soon as the layout mounts.
  onMount(async () => {
    await loadPlugins();
  });
</script>

<svelte:head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Open Governance Portal</title>
</svelte:head>

<NavBar />

{#if $pluginsError}
  <div class="global-error" role="alert">
    ⚠️ Could not load plugins from the backend: {$pluginsError}.
    Ensure the API is running at the configured address.
  </div>
{/if}

<main class="main-content">
  <slot />
</main>

<style>
  :global(:root) {
    --color-surface: #ffffff;
    --color-bg: #f8fafc;
    --color-border: #e2e8f0;
    --color-accent: #3b82f6;
    --color-muted: #64748b;
    --color-nav-bg: #1e293b;
    font-family: system-ui, -apple-system, sans-serif;
  }

  :global(body) {
    margin: 0;
    background: var(--color-bg);
    color: #0f172a;
  }

  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .global-error {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #dc2626;
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
    text-align: center;
  }
</style>
