/**
 * adapters/base-adapter.ts — Built-in contenteditable adapter.
 *
 * A zero-dependency fallback editor that uses the browser's native
 * `contenteditable` attribute.  Provides basic WYSIWYG editing when
 * neither Milkdown nor TinyMCE is available.
 *
 * WCAG 2.0 AA compliance:
 * • Sets `role="textbox"` and `aria-multiline="true"`.
 * • Applies the caller-provided `aria-label`.
 * • Focus ring via `:focus-visible` (handled in CSS).
 * • Keyboard-accessible — native contenteditable supports all standard
 *   keyboard interactions.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

import type { EditorAdapter, EditorAdapterConfig } from './types';

export class BaseAdapter implements EditorAdapter {
  readonly id = 'base';
  readonly displayName = 'Built-in Editor';

  private el: HTMLDivElement | null = null;
  private listeners: Array<(html: string) => void> = [];
  private inputHandler: (() => void) | null = null;

  async init(config: EditorAdapterConfig): Promise<void> {
    const el = document.createElement('div');
    el.contentEditable = config.readonly ? 'false' : 'true';
    el.innerHTML = config.initialContent;
    el.setAttribute('role', 'textbox');
    el.setAttribute('aria-multiline', 'true');
    el.setAttribute('aria-label', config.ariaLabel);
    el.setAttribute('tabindex', '0');

    if (config.placeholder) {
      el.dataset.placeholder = config.placeholder;
    }

    el.className = 'base-adapter-editor';

    // Add scoped styles
    const style = document.createElement('style');
    style.textContent = `
      .base-adapter-editor {
        min-height: 3rem;
        padding: 0.75rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.375rem;
        outline: none;
        font-size: 1rem;
        line-height: 1.6;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .base-adapter-editor:focus-visible {
        border-color: var(--color-accent, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      }
      .base-adapter-editor:empty::before {
        content: attr(data-placeholder);
        color: var(--color-muted, #64748b);
        pointer-events: none;
      }
    `;

    config.container.appendChild(style);
    config.container.appendChild(el);
    this.el = el;

    // Listen for input events
    this.inputHandler = () => {
      const html = el.innerHTML;
      for (const cb of this.listeners) cb(html);
    };
    el.addEventListener('input', this.inputHandler);
  }

  destroy(): void {
    if (this.el && this.inputHandler) {
      this.el.removeEventListener('input', this.inputHandler);
    }
    if (this.el?.parentElement) {
      // Remove the style element too (previous sibling)
      const style = this.el.previousElementSibling;
      if (style?.tagName === 'STYLE') style.remove();
      this.el.remove();
    }
    this.el = null;
    this.listeners = [];
    this.inputHandler = null;
  }

  getContent(): string {
    return this.el?.innerHTML ?? '';
  }

  setContent(html: string): void {
    if (this.el) {
      this.el.innerHTML = html;
    }
  }

  onContentChange(callback: (html: string) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  focus(): void {
    this.el?.focus();
  }
}

export function createBaseAdapter(): BaseAdapter {
  return new BaseAdapter();
}
