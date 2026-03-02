<!--
  components/NavBar.svelte — Top navigation bar.

  Dynamically renders a link for every registered plugin so new plugins
  automatically appear in the nav without frontend code changes.

  Traceability: ADR-004
-->
<script lang="ts">
  import { plugins } from '$lib/plugins/registry';
  import { page } from '$app/stores';
</script>

<header class="navbar">
  <div class="navbar-brand">
    <a href="/" class="brand-link" aria-label="Go to dashboard">
      🏛️ <span>Open Governance Portal</span>
    </a>
  </div>

  <nav class="navbar-links" aria-label="Plugin navigation">
    {#each $plugins as plugin (plugin.pluginId)}
      <a
        href="/plugins/{plugin.pluginId}"
        class="nav-link"
        class:active={$page.url.pathname.startsWith(`/plugins/${plugin.pluginId}`)}
        aria-current={$page.url.pathname.startsWith(`/plugins/${plugin.pluginId}`) ? 'page' : undefined}
      >
        {plugin.displayName}
      </a>
    {/each}
  </nav>
</header>

<style>
  .navbar {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 0.75rem 2rem;
    background: var(--color-nav-bg, #1e293b);
    color: #f1f5f9;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .brand-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: inherit;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.1rem;
    white-space: nowrap;
  }

  .navbar-links {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .nav-link {
    padding: 0.4rem 0.85rem;
    border-radius: 0.375rem;
    color: #cbd5e1;
    text-decoration: none;
    font-size: 0.9rem;
    transition: background 0.1s ease, color 0.1s ease;
  }

  .nav-link:hover,
  .nav-link:focus-visible {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .nav-link.active {
    background: var(--color-accent, #3b82f6);
    color: #ffffff;
  }
</style>
