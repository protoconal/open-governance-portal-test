<!--
  routes/plugins/[pluginId]/+page.svelte — Governance module page.

  This single route handles ALL governance modules.  The page:
    1. Looks up the module manifest from the store by moduleId.
    2. Displays the module's name, description, and Directus API information.
    3. Provides a link to the Directus admin panel for content management.

  In a fully-built application, this page would dynamically import a
  module-specific Svelte component (e.g. a meetings calendar, finance
  ledger, or member directory).

  Traceability: ADR-004, ADR-006
-->
<script lang="ts">
  import { page } from '$app/stores';
  import { pluginMap, pluginsLoading } from '$lib/plugins/registry';
  import { API_BASE } from '$lib/api/client';

  $: pluginId = $page.params.pluginId;
  $: manifest = $pluginMap.get(pluginId ?? '');
</script>

<svelte:head>
  <title>{manifest?.displayName ?? pluginId} — Open Governance Portal</title>
</svelte:head>

{#if $pluginsLoading}
  <p>Loading…</p>
{:else if !manifest}
  <article class="not-found">
    <h1>Module not found</h1>
    <p>No governance module with ID <code>{pluginId}</code> is currently registered.</p>
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
      <h2>Directus REST API</h2>
      <p>
        This module's data is available via Directus at
        <code class="endpoint">{API_BASE}{manifest.apiPrefix}</code>.
      </p>
      <a
        href="{API_BASE}/admin"
        class="api-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Directus Admin Panel ↗
      </a>
    </section>

    <!--
      Module UI slot
      ──────────────
      In production, a module-specific component would be rendered here
      (e.g. a meetings calendar, finance ledger, member directory).
      The component would be loaded lazily by looking it up in a client-side
      module registry that maps moduleId → Svelte component.
    -->
    <section class="plugin-ui-slot">
      <div class="slot-placeholder">
        <span class="slot-icon" aria-hidden="true">🔌</span>
        <p>
          <strong>{manifest.displayName}</strong> UI component would load here.
        </p>
        <p class="slot-hint">
          Register a Svelte component for <code>{pluginId}</code> in the
          client-side module registry to replace this placeholder.
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
