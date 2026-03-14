<!--
  components/PluginCard.svelte — Dashboard card for a governance module.

  Props
  ─────
  manifest  PluginManifest  The module's metadata from Strapi.

  Traceability: ADR-004, ADR-006
-->
<script lang="ts">
  import type { PluginManifest } from '$lib/api/client';

  export let manifest: PluginManifest;
</script>

<!-- Each card links to the plugin's dedicated page under /plugins/{id} -->
<a href="/plugins/{manifest.pluginId}" class="plugin-card" aria-label="Open {manifest.displayName}">
  <div class="card-icon" aria-hidden="true">📦</div>
  <div class="card-body">
    <h2 class="card-title">{manifest.displayName}</h2>
    <p class="card-desc">{manifest.description}</p>
    <span class="card-version">v{manifest.version}</span>
  </div>
</a>

<style>
  .plugin-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.75rem;
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }

  .plugin-card:hover,
  .plugin-card:focus-visible {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 2px;
  }

  .card-icon {
    font-size: 2rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .card-title {
    margin: 0 0 0.25rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .card-desc {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    color: var(--color-muted, #64748b);
    line-height: 1.4;
  }

  .card-version {
    font-size: 0.75rem;
    color: var(--color-muted, #94a3b8);
  }
</style>
