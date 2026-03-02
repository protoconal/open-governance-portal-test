<!--
  routes/plugins/[pluginId]/+page.svelte — Generic plugin module page.

  This single route handles ALL plugins.  The page:
    1. Looks up the plugin manifest from the store by ID.
    2. Displays the plugin's name, description, and API endpoint information.
    3. Provides a link to the raw JSON endpoint so developers can explore
       the plugin's data during development.

  In a fully-built application, this page would dynamically import a plugin-
  specific Svelte component (lazy-loaded from the public/plugins/ folder or
  an npm package).  That capability is documented in docs/PLUGIN_SYSTEM.md.

  Traceability: ADR-004
-->
<script lang="ts">
  import { page } from '$app/stores';
  import { pluginMap, pluginsLoading } from '$lib/plugins/registry';
  import { API_BASE } from '$lib/api/client';

  $: pluginId = $page.params.pluginId;
  $: manifest = $pluginMap.get(pluginId);
</script>

<svelte:head>
  <title>{manifest?.displayName ?? pluginId} — Open Governance Portal</title>
</svelte:head>

{#if $pluginsLoading}
  <p>Loading…</p>
{:else if !manifest}
  <article class="not-found">
    <h1>Plugin not found</h1>
    <p>No plugin with ID <code>{pluginId}</code> is currently registered.</p>
    <a href="/">← Back to Dashboard</a>
  </article>
{:else}
  <article class="plugin-page">
    <header class="plugin-header">
      <div>
        <h1>{manifest.displayName}</h1>
        <p class="plugin-desc">{manifest.description}</p>
      </div>
      <span class="plugin-version">v{manifest.version}</span>
    </header>

    <section class="api-info">
      <h2>API Endpoints</h2>
      <p>
        This plugin exposes its endpoints at
        <code class="endpoint">{API_BASE}{manifest.apiPrefix}/</code>.
      </p>
      <a
        href="{API_BASE}{manifest.apiPrefix}/swagger"
        class="api-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Swagger docs ↗
      </a>
    </section>

    <!--
      Plugin UI slot
      ──────────────
      In production, a plugin-specific component would be rendered here.
      The component would be loaded lazily by looking it up in a client-side
      plugin registry that maps pluginId → Svelte component.
      See docs/PLUGIN_SYSTEM.md § "Frontend Plugin Components" for details.
    -->
    <section class="plugin-ui-slot">
      <div class="slot-placeholder">
        <span class="slot-icon" aria-hidden="true">🔌</span>
        <p>
          <strong>{manifest.displayName}</strong> UI component would load here.
        </p>
        <p class="slot-hint">
          Register a Svelte component for <code>{pluginId}</code> in the
          client-side plugin registry to replace this placeholder.
        </p>
      </div>
    </section>
  </article>
{/if}

<style>
  .plugin-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
    font-weight: 700;
  }

  .plugin-desc {
    margin: 0;
    color: var(--color-muted);
    font-size: 1.05rem;
  }

  .plugin-version {
    background: var(--color-border);
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .api-info,
  .plugin-ui-slot {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
  }

  .endpoint {
    background: #f1f5f9;
    padding: 0.1rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.9rem;
  }

  .api-link {
    display: inline-block;
    margin-top: 0.75rem;
    color: var(--color-accent);
    font-size: 0.9rem;
  }

  .slot-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    text-align: center;
    color: var(--color-muted);
    border: 2px dashed var(--color-border);
    border-radius: 0.5rem;
  }

  .slot-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }

  .slot-hint {
    font-size: 0.85rem;
    max-width: 40ch;
  }

  .not-found {
    text-align: center;
    padding: 4rem 2rem;
  }
</style>
