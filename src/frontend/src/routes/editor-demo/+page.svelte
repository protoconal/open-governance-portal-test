<!--
  routes/editor-demo/+page.svelte — Block editor demonstration page.

  Showcases the full block editor with:
  • All built-in block types (text, heading, image, code).
  • The optional D3 graph plugin loaded at runtime.
  • Editor adapter selector (base / milkdown / tinymce).
  • Export to HTML / JSON.
  • Mattermost chat integration sidebar.

  This page serves as both a demo and an integration test surface.
  The app runs as a CSR (client-side rendered) SPA and pulls data
  through REST and WebSocket connections.

  Traceability: ADR-005 — Block Editor Architecture
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import {
    registerBuiltinBlocks,
    BlockEditor,
    blockDocument,
    documentToHTML,
    documentToJSON,
  } from '$lib/block-editor';
  import type { BlockDocument } from '$lib/block-editor';

  /* Optional D3 Graph plugin — imported separately to demonstrate
     the opt-in pattern.  Remove this import to exclude the plugin. */
  import { registerD3GraphBlock, D3GraphBlock } from '$lib/block-editor/plugins/d3-graph';

  /* Mattermost chat integration */
  import { ChatPanel } from '$lib/chat';
  import type { MattermostConfig } from '$lib/chat';

  /* WebSocket infrastructure */
  import { wsState, wsStatusMessage } from '$lib/realtime';

  let exportOutput = '';
  let exportFormat: 'html' | 'json' = 'html';
  let showChat = false;

  /* Build Mattermost config from environment variables (if set) */
  const mattermostConfig: MattermostConfig | null = (() => {
    const serverUrl = import.meta.env.VITE_MATTERMOST_URL;
    const wsUrl = import.meta.env.VITE_MATTERMOST_WS_URL;
    const token = import.meta.env.VITE_MATTERMOST_TOKEN;
    if (!serverUrl || !token) return null;
    return {
      serverUrl,
      wsUrl: wsUrl || serverUrl.replace(/^http/, 'ws') + '/api/v4/websocket',
      token,
      teamId: import.meta.env.VITE_MATTERMOST_TEAM_ID || undefined,
    };
  })();

  onMount(() => {
    /* Register built-in block types */
    registerBuiltinBlocks();

    /* Register the optional D3 graph plugin */
    registerD3GraphBlock();
  });

  let editorComponent: BlockEditor;

  /* Register D3GraphBlock component with the editor once mounted */
  $: if (editorComponent) {
    editorComponent.registerBlockComponent('d3-graph', D3GraphBlock);
  }

  function exportDocument(): void {
    let doc: BlockDocument | undefined;
    blockDocument.subscribe((d) => (doc = d))();
    if (!doc) return;
    exportOutput =
      exportFormat === 'html'
        ? documentToHTML(doc)
        : documentToJSON(doc);
  }
</script>

<svelte:head>
  <title>Block Editor Demo — Open Governance Portal</title>
</svelte:head>

<section class="demo-page">
  <header class="demo-header">
    <div class="header-text">
      <h1>Block Editor Demo</h1>
      <p class="demo-subtitle">
        A block-based WYSIWYG editing interface with interchangeable editors,
        optional D3.js graph visualisation, and real-time Mattermost chat.
      </p>
    </div>

    <div class="header-actions">
      <!-- WebSocket status -->
      <span class="ws-status" role="status" aria-live="polite">
        <span class="sr-only">{$wsStatusMessage}</span>
      </span>

      <!-- Chat toggle -->
      <button
        class="chat-toggle"
        on:click={() => (showChat = !showChat)}
        aria-expanded={showChat}
        aria-controls="chat-sidebar"
        aria-label="{showChat ? 'Hide' : 'Show'} chat panel"
      >
        💬 {showChat ? 'Hide Chat' : 'Show Chat'}
      </button>
    </div>
  </header>

  <div class="demo-layout">
    <!-- Main editor area -->
    <div class="editor-area">
      <BlockEditor bind:this={editorComponent} />

      <!-- Export panel -->
      <details class="export-panel">
        <summary>Export document</summary>
        <div class="export-controls">
          <fieldset class="export-format" role="radiogroup" aria-label="Export format">
            <legend class="sr-only">Export format</legend>
            <label>
              <input type="radio" bind:group={exportFormat} value="html" />
              HTML
            </label>
            <label>
              <input type="radio" bind:group={exportFormat} value="json" />
              JSON
            </label>
          </fieldset>
          <button class="export-btn" on:click={exportDocument}>
            Export
          </button>
        </div>
        {#if exportOutput}
          <label for="export-output" class="sr-only">Exported document</label>
          <textarea
            id="export-output"
            class="export-output"
            readonly
            rows="12"
            aria-label="Exported {exportFormat.toUpperCase()} output"
          >{exportOutput}</textarea>
        {/if}
      </details>
    </div>

    <!-- Chat sidebar -->
    {#if showChat}
      <aside id="chat-sidebar" class="chat-sidebar" aria-label="Chat sidebar">
        <ChatPanel config={mattermostConfig} />
      </aside>
    {/if}
  </div>
</section>

<style>
  .demo-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .demo-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header-text {
    flex: 1;
    min-width: 200px;
  }

  .demo-header h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
    font-weight: 700;
  }

  .demo-subtitle {
    margin: 0;
    color: var(--color-muted, #64748b);
    font-size: 1.05rem;
    max-width: 60ch;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .chat-toggle {
    padding: 0.4rem 0.85rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.375rem;
    background: var(--color-surface, #ffffff);
    color: inherit;
    font-size: 0.85rem;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.1s ease, border-color 0.1s ease;
    white-space: nowrap;
  }

  .chat-toggle:hover {
    background: #f1f5f9;
    border-color: var(--color-accent, #3b82f6);
  }

  .chat-toggle:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 2px;
  }

  .demo-layout {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .editor-area {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .chat-sidebar {
    width: 340px;
    flex-shrink: 0;
    position: sticky;
    top: 5rem;
  }

  @media (max-width: 900px) {
    .demo-layout {
      flex-direction: column;
    }
    .chat-sidebar {
      width: 100%;
      position: static;
    }
  }

  .export-panel {
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.75rem;
    padding: 1rem;
  }

  .export-panel summary {
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
  }

  .export-panel summary:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 2px;
  }

  .export-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }

  .export-format {
    display: flex;
    gap: 0.75rem;
    border: none;
    padding: 0;
    margin: 0;
  }

  .export-format label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .export-format input:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 2px;
  }

  .export-btn {
    padding: 0.4rem 1rem;
    border: 1px solid var(--color-accent, #3b82f6);
    border-radius: 0.375rem;
    background: var(--color-accent, #3b82f6);
    color: #ffffff;
    font-size: 0.9rem;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.1s;
  }

  .export-btn:hover {
    opacity: 0.9;
  }

  .export-btn:focus-visible {
    outline: 2px solid #1e293b;
    outline-offset: 2px;
  }

  .export-output {
    width: 100%;
    margin-top: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.5rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.8rem;
    line-height: 1.4;
    resize: vertical;
    background: #f8fafc;
    color: inherit;
  }

  .export-output:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 1px;
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
