<!--
  blocks/ImageBlock.svelte — Image block component.

  Provides fields for image URL, alt text (required for WCAG), and
  an optional caption.  Shows a live preview when a URL is provided.

  WCAG 2.0 AA:
  • Alt text is required — the field is marked required with aria-required.
  • The preview image always has an alt attribute.
  • Inputs have associated labels.

  Traceability: ADR-005 — Block Editor Architecture
-->
<script lang="ts">
  import type { Block } from '../core/types';
  import type { ImageBlockData } from './definitions';
  import { updateBlockData } from '../core/store';

  export let block: Block<ImageBlockData>;

  function update(field: keyof ImageBlockData, value: string): void {
    updateBlockData<ImageBlockData>(block.id, (prev) => ({
      ...prev,
      [field]: value,
    }));
  }
</script>

<div class="image-block" role="group" aria-label="Image block">
  <div class="image-fields">
    <div class="field">
      <label for="img-src-{block.id}">Image URL</label>
      <input
        id="img-src-{block.id}"
        type="url"
        value={block.data.src}
        on:input={(e) => update('src', e.currentTarget.value)}
        placeholder="https://example.com/image.png"
        aria-label="Image URL"
      />
    </div>

    <div class="field">
      <label for="img-alt-{block.id}">
        Alt text <span class="required" aria-hidden="true">*</span>
      </label>
      <input
        id="img-alt-{block.id}"
        type="text"
        value={block.data.alt}
        on:input={(e) => update('alt', e.currentTarget.value)}
        placeholder="Describe the image for screen readers"
        aria-required="true"
        aria-label="Image alternative text (required)"
      />
    </div>

    <div class="field">
      <label for="img-cap-{block.id}">Caption</label>
      <input
        id="img-cap-{block.id}"
        type="text"
        value={block.data.caption}
        on:input={(e) => update('caption', e.currentTarget.value)}
        placeholder="Optional caption"
        aria-label="Image caption"
      />
    </div>
  </div>

  {#if block.data.src}
    <figure class="image-preview">
      <img
        src={block.data.src}
        alt={block.data.alt || 'No alt text provided'}
      />
      {#if block.data.caption}
        <figcaption>{block.data.caption}</figcaption>
      {/if}
    </figure>
  {:else}
    <div class="image-placeholder" aria-hidden="true">
      <span class="placeholder-icon">🖼️</span>
      <span>Enter an image URL above</span>
    </div>
  {/if}
</div>

<style>
  .image-block {
    width: 100%;
  }

  .image-fields {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .field label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted, #64748b);
  }

  .required {
    color: #dc2626;
  }

  .field input {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.375rem;
    font-size: 0.9rem;
    font-family: inherit;
    color: inherit;
    background: var(--color-surface, #ffffff);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .field input:focus-visible {
    border-color: var(--color-accent, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    outline: none;
  }

  .image-preview {
    margin: 0;
    text-align: center;
  }

  .image-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border, #e2e8f0);
  }

  .image-preview figcaption {
    font-size: 0.85rem;
    color: var(--color-muted, #64748b);
    margin-top: 0.5rem;
  }

  .image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
    border: 2px dashed var(--color-border, #e2e8f0);
    border-radius: 0.5rem;
    color: var(--color-muted, #64748b);
    font-size: 0.9rem;
  }

  .placeholder-icon {
    font-size: 2rem;
  }
</style>
