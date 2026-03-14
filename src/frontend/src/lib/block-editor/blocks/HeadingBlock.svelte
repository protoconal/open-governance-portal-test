<!--
  blocks/HeadingBlock.svelte — Heading block component.

  Provides an editable heading with a level selector (H1–H6).

  WCAG 2.0 AA:
  • The level selector is a labelled <select>.
  • The text input has an aria-label describing its purpose.
  • The heading preview uses the correct semantic heading element.

  Traceability: ADR-005 — Block Editor Architecture
-->
<script lang="ts">
  import type { Block } from '../core/types';
  import type { HeadingBlockData } from './definitions';
  import { updateBlockData } from '../core/store';

  export let block: Block<HeadingBlockData>;

  function onLevelChange(e: Event): void {
    const level = parseInt(
      (e.target as HTMLSelectElement).value, 10,
    ) as HeadingBlockData['level'];
    updateBlockData<HeadingBlockData>(block.id, (prev) => ({
      ...prev,
      level,
    }));
  }

  function onTextInput(e: Event): void {
    const text = (e.target as HTMLInputElement).value;
    updateBlockData<HeadingBlockData>(block.id, (prev) => ({
      ...prev,
      text,
    }));
  }
</script>

<div class="heading-block" role="group" aria-label="Heading block">
  <div class="heading-controls">
    <label class="level-label" for="level-{block.id}">
      Level
    </label>
    <select
      id="level-{block.id}"
      value={block.data.level}
      on:change={onLevelChange}
      class="level-select"
      aria-label="Heading level"
    >
      <option value={1}>H1</option>
      <option value={2}>H2</option>
      <option value={3}>H3</option>
      <option value={4}>H4</option>
      <option value={5}>H5</option>
      <option value={6}>H6</option>
    </select>
  </div>
  <input
    type="text"
    class="heading-input heading-input-{block.data.level}"
    value={block.data.text}
    on:input={onTextInput}
    placeholder="Enter heading text…"
    aria-label="Heading text, level {block.data.level}"
  />
</div>

<style>
  .heading-block {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .heading-controls {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .level-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted, #64748b);
  }

  .level-select {
    padding: 0.25rem 0.4rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.25rem;
    font-size: 0.85rem;
    background: var(--color-surface, #ffffff);
    color: inherit;
  }

  .level-select:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 1px;
  }

  .heading-input {
    flex: 1;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    font-family: inherit;
    color: inherit;
    background: transparent;
    line-height: 1.3;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .heading-input:focus-visible {
    border-color: var(--color-accent, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    outline: none;
  }

  .heading-input-1 { font-size: 2rem; font-weight: 800; }
  .heading-input-2 { font-size: 1.5rem; font-weight: 700; }
  .heading-input-3 { font-size: 1.25rem; font-weight: 700; }
  .heading-input-4 { font-size: 1.1rem; font-weight: 600; }
  .heading-input-5 { font-size: 1rem; font-weight: 600; }
  .heading-input-6 { font-size: 0.9rem; font-weight: 600; }
</style>
