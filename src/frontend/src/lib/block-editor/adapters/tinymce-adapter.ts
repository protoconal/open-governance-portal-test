/**
 * adapters/tinymce-adapter.ts — TinyMCE editor adapter.
 *
 * Integrates TinyMCE into the block editor framework via the
 * EditorAdapter interface.
 *
 * TinyMCE is a mature, enterprise-grade WYSIWYG HTML editor with
 * extensive plugin support and accessibility features.
 *
 * ─── Installation ──────────────────────────────────────────────────────
 * This adapter requires:
 *
 *   npm install tinymce
 *
 * Or load TinyMCE from its CDN by adding a script tag to your HTML:
 *   <script src="https://cdn.tiny.cloud/1/YOUR-KEY/tinymce/7/tinymce.min.js"></script>
 *
 * ─── WCAG 2.0 AA ──────────────────────────────────────────────────────
 * • TinyMCE has built-in WCAG 2.0 AA support when configured correctly.
 * • This adapter enables `a11ychecker` if available and sets proper
 *   ARIA labels on the editor iframe.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

import type { EditorAdapter, EditorAdapterConfig } from './types';

/** Minimal TinyMCE editor type for the subset of API we use. */
interface TinyMCEInstance {
  getContent(): string;
  setContent(html: string): void;
  on(event: string, callback: () => void): void;
  off(event: string, callback: () => void): void;
  focus(): void;
  destroy(): void;
}

/** Global tinymce object shape. */
interface TinyMCEGlobal {
  init(options: Record<string, unknown>): Promise<TinyMCEInstance[]>;
}

export class TinyMCEAdapter implements EditorAdapter {
  readonly id = 'tinymce';
  readonly displayName = 'TinyMCE';

  private editor: TinyMCEInstance | null = null;
  private container: HTMLElement | null = null;
  private listeners: Array<(html: string) => void> = [];
  private changeHandler: (() => void) | null = null;

  async init(config: EditorAdapterConfig): Promise<void> {
    this.container = config.container;

    /* Create a target textarea for TinyMCE to enhance */
    const textarea = document.createElement('textarea');
    textarea.value = config.initialContent;
    textarea.setAttribute('aria-label', config.ariaLabel);
    config.container.appendChild(textarea);

    /* Resolve the global tinymce object.  Try dynamic import first
       (npm package), then fall back to window.tinymce (CDN). */
    let tinymce: TinyMCEGlobal;
    try {
      const mod = await import('tinymce');
      tinymce = (mod.default ?? mod) as TinyMCEGlobal;
    } catch {
      if (typeof window !== 'undefined' && 'tinymce' in window) {
        tinymce = (window as unknown as { tinymce: TinyMCEGlobal }).tinymce;
      } else {
        throw new Error(
          '[TinyMCEAdapter] TinyMCE is not available. Install it with ' +
            '`npm install tinymce` or load it from a CDN.',
        );
      }
    }

    const editors = await tinymce.init({
      target: textarea,
      readonly: config.readonly ?? false,
      placeholder: config.placeholder ?? '',
      height: 200,
      menubar: false,
      branding: false,
      statusbar: false,
      toolbar:
        'undo redo | bold italic underline | bullist numlist | link | removeformat',
      plugins: 'lists link',
      content_css: 'default',
      /* Accessibility configuration */
      a11y_advanced_options: true,
    });

    this.editor = editors?.[0] ?? null;

    if (!this.editor) {
      throw new Error('[TinyMCEAdapter] TinyMCE failed to initialise.');
    }

    /* Listen for content changes */
    this.changeHandler = () => {
      const html = this.editor?.getContent() ?? '';
      for (const cb of this.listeners) cb(html);
    };
    this.editor.on('change', this.changeHandler);
    this.editor.on('input', this.changeHandler);

    /* WCAG: label the editor iframe */
    const iframe = config.container.querySelector('iframe');
    if (iframe) {
      iframe.setAttribute('title', config.ariaLabel);
    }
  }

  destroy(): void {
    if (this.editor) {
      if (this.changeHandler) {
        this.editor.off('change', this.changeHandler);
        this.editor.off('input', this.changeHandler);
      }
      this.editor.destroy();
    }
    this.editor = null;
    this.container = null;
    this.listeners = [];
    this.changeHandler = null;
  }

  getContent(): string {
    return this.editor?.getContent() ?? '';
  }

  setContent(html: string): void {
    this.editor?.setContent(html);
  }

  onContentChange(callback: (html: string) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  focus(): void {
    this.editor?.focus();
  }
}

export function createTinyMCEAdapter(): TinyMCEAdapter {
  return new TinyMCEAdapter();
}
