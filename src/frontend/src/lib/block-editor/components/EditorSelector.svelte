<!--
  components/EditorSelector.svelte — Adapter switcher.

  A dropdown that lets the user choose which WYSIWYG editor adapter to
  use for text blocks.  The selection is stored in the activeAdapterId
  store and applies to all text blocks.

  WCAG 2.0 AA:
  • The select has an associated label.
  • Focus ring is visible.

  Traceability: ADR-005 — Block Editor Architecture
-->
<script lang="ts">
  import { activeAdapterId, getAdapterFactories } from '../adapters/index';

  $: factories = getAdapterFactories();

  function onChange(e: Event): void {
    const value = (e.target as HTMLSelectElement).value;
    activeAdapterId.set(value);
  }
</script>

<div class="editor-selector">
  <label for="editor-adapter-select" class="selector-label">
    Editor engine
  </label>
  <select
    id="editor-adapter-select"
    value={$activeAdapterId}
    on:change={onChange}
    class="selector-select"
    aria-label="Choose WYSIWYG editor engine"
  >
    {#each factories as [id, _factory]}
      <option value={id}>{id}</option>
    {/each}
  </select>
</div>

<style>
  .editor-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .selector-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted, #64748b);
    white-space: nowrap;
  }

  .selector-select {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.25rem;
    font-size: 0.8rem;
    background: var(--color-surface, #ffffff);
    color: inherit;
    font-family: inherit;
  }

  .selector-select:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 1px;
  }
</style>
