<!--
  blocks/CodeBlock.svelte — Code snippet block component.

  Provides a code editing area with an optional language selector.

  WCAG 2.0 AA:
  • The textarea has an aria-label describing its purpose.
  • The language selector has an associated label.
  • Focus ring is clearly visible on all inputs.

  Traceability: ADR-005 — Block Editor Architecture
-->
<script lang="ts">
  import type { Block } from '../core/types';
  import type { CodeBlockData } from './definitions';
  import { updateBlockData } from '../core/store';

  export let block: Block<CodeBlockData>;

  const commonLanguages = [
    '', 'javascript', 'typescript', 'python', 'csharp', 'java',
    'html', 'css', 'json', 'bash', 'sql', 'go', 'rust',
  ];

  function onLanguageChange(e: Event): void {
    const language = (e.target as HTMLSelectElement).value;
    updateBlockData<CodeBlockData>(block.id, (prev) => ({
      ...prev,
      language,
    }));
  }

  function onCodeInput(e: Event): void {
    const code = (e.target as HTMLTextAreaElement).value;
    updateBlockData<CodeBlockData>(block.id, (prev) => ({
      ...prev,
      code,
    }));
  }
</script>

<div class="code-block" role="group" aria-label="Code block">
  <div class="code-header">
    <label for="code-lang-{block.id}" class="lang-label">Language</label>
    <select
      id="code-lang-{block.id}"
      value={block.data.language}
      on:change={onLanguageChange}
      class="lang-select"
      aria-label="Programming language"
    >
      {#each commonLanguages as lang}
        <option value={lang}>{lang || '(none)'}</option>
      {/each}
    </select>
  </div>

  <textarea
    class="code-textarea"
    value={block.data.code}
    on:input={onCodeInput}
    placeholder="Paste or type your code here…"
    aria-label="Code editor{block.data.language ? `, language: ${block.data.language}` : ''}"
    spellcheck="false"
    autocapitalize="off"
    rows="6"
  ></textarea>
</div>

<style>
  .code-block {
    width: 100%;
  }

  .code-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .lang-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted, #64748b);
  }

  .lang-select {
    padding: 0.2rem 0.4rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.25rem;
    font-size: 0.8rem;
    background: var(--color-surface, #ffffff);
    color: inherit;
  }

  .lang-select:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 1px;
  }

  .code-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.375rem;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    color: inherit;
    background: #f8fafc;
    resize: vertical;
    tab-size: 2;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .code-textarea:focus-visible {
    border-color: var(--color-accent, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    outline: none;
  }
</style>
