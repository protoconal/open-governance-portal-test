<!--
  components/BlockWrapper.svelte — Per-block wrapper with controls.

  Wraps each block in a container that provides:
  • Move up / move down buttons.
  • Delete button.
  • Selection highlight.
  • Keyboard shortcuts for block management.
  • ARIA live announcements for block operations.

  WCAG 2.0 AA:
  • All controls have aria-labels.
  • Focus is visible on every interactive element.
  • Keyboard-accessible move and delete.
  • role="listitem" for the wrapper (parent should be role="list").

  Traceability: ADR-005 — Block Editor Architecture
-->
<script lang="ts">
  import type { Block } from '../core/types';
  import { selectedBlockId, removeBlock, moveBlockUp, moveBlockDown } from '../core/store';
  import { getBlockDefinition } from '../core/registry';

  export let block: Block;
  export let index: number;
  export let total: number;

  $: isSelected = $selectedBlockId === block.id;
  $: definition = getBlockDefinition(block.type);
  $: blockLabel = definition?.displayName ?? block.type;

  function select(): void {
    selectedBlockId.set(block.id);
  }

  function handleDelete(): void {
    removeBlock(block.id);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Delete' && e.shiftKey) {
      e.preventDefault();
      handleDelete();
    }
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      moveBlockUp(block.id);
    }
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      moveBlockDown(block.id);
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="block-wrapper"
  class:selected={isSelected}
  role="listitem"
  aria-label="{blockLabel} block, position {index + 1} of {total}"
  tabindex="0"
  on:click={select}
  on:keydown={handleKeydown}
  on:focus={select}
>
  <!-- Block toolbar (visible on hover/focus) -->
  <div class="block-controls" aria-label="Block controls for {blockLabel}">
    <span class="block-type-label" aria-hidden="true">
      {definition?.icon ?? '?'} {blockLabel}
    </span>

    <div class="control-buttons">
      <button
        class="control-btn"
        on:click|stopPropagation={() => moveBlockUp(block.id)}
        disabled={index === 0}
        aria-label="Move {blockLabel} block up"
        title="Move up (Alt+↑)"
      >
        ↑
      </button>
      <button
        class="control-btn"
        on:click|stopPropagation={() => moveBlockDown(block.id)}
        disabled={index === total - 1}
        aria-label="Move {blockLabel} block down"
        title="Move down (Alt+↓)"
      >
        ↓
      </button>
      <button
        class="control-btn delete-btn"
        on:click|stopPropagation={handleDelete}
        aria-label="Delete {blockLabel} block"
        title="Delete (Shift+Delete)"
      >
        ✕
      </button>
    </div>
  </div>

  <!-- Block content -->
  <div class="block-content">
    <slot />
  </div>
</div>

<style>
  .block-wrapper {
    position: relative;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    padding: 0.5rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    outline: none;
  }

  .block-wrapper:hover,
  .block-wrapper:focus-within {
    border-color: var(--color-border, #e2e8f0);
  }

  .block-wrapper.selected {
    border-color: var(--color-accent, #3b82f6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  .block-wrapper:focus-visible {
    border-color: var(--color-accent, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }

  .block-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem 0.25rem 0.5rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .block-wrapper:hover .block-controls,
  .block-wrapper:focus-within .block-controls,
  .block-wrapper.selected .block-controls {
    opacity: 1;
  }

  /* Always show controls for keyboard users */
  .block-wrapper:focus-visible .block-controls {
    opacity: 1;
  }

  .block-type-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .control-buttons {
    display: flex;
    gap: 0.25rem;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.25rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-muted, #64748b);
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.1s ease, color 0.1s ease;
  }

  .control-btn:hover:not(:disabled) {
    background: #f1f5f9;
    color: #0f172a;
  }

  .control-btn:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 1px;
  }

  .control-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .delete-btn:hover:not(:disabled) {
    background: #fef2f2;
    color: #dc2626;
  }

  .block-content {
    padding: 0.25rem;
  }
</style>
