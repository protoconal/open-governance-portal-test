<!--
  blocks/TextBlock.svelte — Rich text block component.

  Uses the active editor adapter to provide WYSIWYG editing inside
  a text block.  The adapter is initialised on mount and destroyed
  on unmount to prevent memory leaks.

  WCAG 2.0 AA:
  • The editor region has role="textbox" and aria-label (set by adapter).
  • Focus is managed via the adapter's focus() method.

  Traceability: ADR-005 — Block Editor Architecture
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Block } from '../core/types';
  import type { TextBlockData } from './definitions';
  import { updateBlockData } from '../core/store';
  import { createAdapter, activeAdapterId } from '../adapters/index';
  import type { EditorAdapter } from '../adapters/types';

  export let block: Block<TextBlockData>;

  let editorContainer: HTMLDivElement;
  let adapter: EditorAdapter | null = null;
  let unsubContent: (() => void) | null = null;

  async function initAdapter(): Promise<void> {
    /* Tear down previous adapter if any */
    if (adapter) {
      unsubContent?.();
      adapter.destroy();
    }

    let adapterId = 'base';
    activeAdapterId.subscribe((id) => (adapterId = id))();

    adapter = createAdapter(adapterId);

    await adapter.init({
      container: editorContainer,
      initialContent: block.data.html,
      ariaLabel: `Text block editor — edit content`,
      placeholder: 'Start typing…',
    });

    unsubContent = adapter.onContentChange((html) => {
      updateBlockData<TextBlockData>(block.id, (prev) => ({ ...prev, html }));
    });
  }

  onMount(() => {
    initAdapter();
  });

  onDestroy(() => {
    unsubContent?.();
    adapter?.destroy();
  });
</script>

<div
  class="text-block"
  bind:this={editorContainer}
  role="group"
  aria-label="Text content block"
></div>

<style>
  .text-block {
    width: 100%;
  }
</style>
