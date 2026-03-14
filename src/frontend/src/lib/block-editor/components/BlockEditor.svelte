<!--
  components/BlockEditor.svelte — Main block editor component.

  Orchestrates the full editing experience by composing BlockToolbar,
  EditorSelector, and per-block BlockWrapper + block components.

  WCAG 2.0 AA:
  • The block list uses role="list" with an aria-label.
  • An aria-live="polite" region announces block operations to
    screen readers (add, move, delete).
  • Keyboard navigation: Tab between blocks, Alt+↑/↓ to reorder,
    Shift+Delete to remove.
  • Skip link at the top jumps to block content.

  Traceability: ADR-005 — Block Editor Architecture
-->
<script lang="ts">
  import { blocks, liveAnnouncement, blockDocument, setDocumentTitle } from '../core/store';
  import { blockDefinitionMap } from '../core/registry';
  import BlockWrapper from './BlockWrapper.svelte';
  import BlockToolbar from './BlockToolbar.svelte';
  import EditorSelector from './EditorSelector.svelte';

  /* Import built-in block components */
  import TextBlock from '../blocks/TextBlock.svelte';
  import HeadingBlock from '../blocks/HeadingBlock.svelte';
  import ImageBlock from '../blocks/ImageBlock.svelte';
  import CodeBlock from '../blocks/CodeBlock.svelte';

  /**
   * Map of block type → Svelte component.
   *
   * Plugins register additional mappings by calling
   * `registerBlockComponent()` at init time.  This map is intentionally
   * mutable so optional plugins (like D3 graph) can add entries without
   * modifying this file.
   */
  const blockComponents: Record<string, unknown> = {
    text: TextBlock,
    heading: HeadingBlock,
    image: ImageBlock,
    code: CodeBlock,
  };

  /**
   * Register a Svelte component for a given block type.
   * Call from plugin init code to add rendering support.
   */
  export function registerBlockComponent(
    type: string,
    component: unknown,
  ): void {
    blockComponents[type] = component;
  }

  function onTitleInput(e: Event): void {
    setDocumentTitle((e.target as HTMLInputElement).value);
  }
</script>

<div class="block-editor" role="region" aria-label="Block editor">
  <!-- Skip link for keyboard users (WCAG 2.0 AA) -->
  <a href="#block-list" class="skip-link">Skip to content blocks</a>

  <!-- Editor header -->
  <header class="editor-header">
    <div class="title-row">
      <label for="doc-title" class="sr-only">Document title</label>
      <input
        id="doc-title"
        type="text"
        class="doc-title-input"
        value={$blockDocument.title}
        on:input={onTitleInput}
        placeholder="Document title"
        aria-label="Document title"
      />
    </div>

    <div class="header-actions">
      <EditorSelector />
    </div>
  </header>

  <!-- Block insertion toolbar -->
  <BlockToolbar />

  <!-- Keyboard shortcut help (visible on focus) -->
  <details class="shortcut-help">
    <summary>Keyboard shortcuts</summary>
    <dl class="shortcut-list">
      <div class="shortcut-item">
        <dt>Alt + ↑</dt>
        <dd>Move block up</dd>
      </div>
      <div class="shortcut-item">
        <dt>Alt + ↓</dt>
        <dd>Move block down</dd>
      </div>
      <div class="shortcut-item">
        <dt>Shift + Delete</dt>
        <dd>Delete block</dd>
      </div>
      <div class="shortcut-item">
        <dt>Tab</dt>
        <dd>Navigate between blocks</dd>
      </div>
    </dl>
  </details>

  <!-- Block list -->
  <div id="block-list" class="block-list" role="list" aria-label="Content blocks">
    {#if $blocks.length === 0}
      <div class="empty-state" role="status">
        <span class="empty-icon" aria-hidden="true">📄</span>
        <p>No blocks yet. Use the toolbar above to add content.</p>
      </div>
    {:else}
      {#each $blocks as block, idx (block.id)}
        <BlockWrapper {block} index={idx} total={$blocks.length}>
          {#if blockComponents[block.type]}
            <svelte:component this={blockComponents[block.type]} {block} />
          {:else}
            <div class="unknown-block" role="alert">
              <p>
                Unknown block type: <code>{block.type}</code>.
                Register a component for this type to render it.
              </p>
            </div>
          {/if}
        </BlockWrapper>
      {/each}
    {/if}
  </div>

  <!-- ARIA live region for screen reader announcements -->
  <div
    class="sr-only"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {$liveAnnouncement}
  </div>
</div>

<style>
  .block-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 900px;
    margin: 0 auto;
  }

  /* Skip link — visible only on focus (WCAG 2.0 AA) */
  .skip-link {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
    z-index: 1000;
    padding: 0.5rem 1rem;
    background: var(--color-accent, #3b82f6);
    color: #ffffff;
    text-decoration: none;
    border-radius: 0.25rem;
    font-size: 0.85rem;
  }

  .skip-link:focus {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .title-row {
    flex: 1;
    min-width: 200px;
  }

  .doc-title-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    font-size: 1.5rem;
    font-weight: 700;
    font-family: inherit;
    color: inherit;
    background: transparent;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .doc-title-input:hover {
    border-color: var(--color-border, #e2e8f0);
  }

  .doc-title-input:focus-visible {
    border-color: var(--color-accent, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    outline: none;
  }

  .shortcut-help {
    font-size: 0.8rem;
    color: var(--color-muted, #64748b);
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
  }

  .shortcut-help summary {
    cursor: pointer;
    font-weight: 600;
  }

  .shortcut-help summary:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 2px;
  }

  .shortcut-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
    margin: 0.5rem 0 0;
  }

  .shortcut-item {
    display: flex;
    gap: 0.5rem;
  }

  .shortcut-item dt {
    font-family: monospace;
    background: #f1f5f9;
    padding: 0.1rem 0.4rem;
    border-radius: 0.2rem;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .shortcut-item dd {
    margin: 0;
    font-size: 0.8rem;
  }

  .block-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-height: 200px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    border: 2px dashed var(--color-border, #e2e8f0);
    border-radius: 0.75rem;
    color: var(--color-muted, #64748b);
    text-align: center;
  }

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .unknown-block {
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 0.375rem;
    color: #dc2626;
    font-size: 0.85rem;
  }

  /* Screen reader only utility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
