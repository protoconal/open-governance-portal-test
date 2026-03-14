<!--
  components/BlockToolbar.svelte — Block insertion toolbar.

  Displays all registered block types grouped by category.  Users can
  insert a new block by clicking a toolbar button or pressing Enter on
  a focused button.

  WCAG 2.0 AA:
  • The toolbar uses role="toolbar" with aria-label.
  • Each button has an aria-label describing the block type.
  • Focus ring is visible on all buttons.
  • Grouped by category with role="group" and aria-label.

  Traceability: ADR-005 — Block Editor Architecture
-->
<script lang="ts">
  import { blockDefinitions } from '../core/registry';
  import { addBlock } from '../core/store';
  import type { BlockCategory, BlockDefinition } from '../core/types';

  /**
   * Optional: when set, new blocks are inserted after this index.
   * When undefined, blocks are appended at the end.
   */
  export let insertAfterIndex: number | undefined = undefined;

  const categoryLabels: Record<BlockCategory, string> = {
    text: 'Text',
    media: 'Media',
    embed: 'Embed',
    data: 'Data & Visualisation',
    layout: 'Layout',
    custom: 'Custom',
  };

  $: grouped = groupByCategory($blockDefinitions);

  function groupByCategory(
    defs: BlockDefinition[],
  ): Array<[BlockCategory, BlockDefinition[]]> {
    const map = new Map<BlockCategory, BlockDefinition[]>();
    for (const def of defs) {
      const list = map.get(def.category) ?? [];
      list.push(def);
      map.set(def.category, list);
    }
    return [...map.entries()];
  }

  function handleInsert(type: string): void {
    const idx = insertAfterIndex !== undefined ? insertAfterIndex + 1 : undefined;
    addBlock(type, idx);
  }
</script>

<div class="block-toolbar" role="toolbar" aria-label="Insert a new block">
  {#each grouped as [category, defs]}
    <div class="toolbar-group" role="group" aria-label="{categoryLabels[category]} blocks">
      <span class="group-label">{categoryLabels[category]}</span>
      <div class="group-buttons">
        {#each defs as def (def.type)}
          <button
            class="insert-btn"
            on:click={() => handleInsert(def.type)}
            aria-label="Insert {def.displayName} block"
            title={def.description}
          >
            <span class="insert-icon" aria-hidden="true">{def.icon}</span>
            <span class="insert-label">{def.displayName}</span>
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .block-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.75rem;
  }

  .toolbar-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .group-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted, #64748b);
    padding-left: 0.25rem;
  }

  .group-buttons {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .insert-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.375rem;
    background: var(--color-surface, #ffffff);
    color: inherit;
    font-size: 0.8rem;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.1s ease, border-color 0.1s ease;
  }

  .insert-btn:hover {
    background: #f1f5f9;
    border-color: var(--color-accent, #3b82f6);
  }

  .insert-btn:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 2px;
  }

  .insert-icon {
    font-size: 1.1rem;
    line-height: 1;
  }

  .insert-label {
    white-space: nowrap;
  }
</style>
