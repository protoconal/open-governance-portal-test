/**
 * adapters/milkdown-adapter.ts — Milkdown editor adapter.
 *
 * Integrates the Milkdown Markdown/WYSIWYG editor into the block editor
 * framework via the EditorAdapter interface.
 *
 * Milkdown is a plugin-driven, ProseMirror-based editor that provides a
 * first-class Markdown editing experience with WYSIWYG rendering.
 *
 * ─── Installation ──────────────────────────────────────────────────────
 * This adapter requires the following packages:
 *
 *   npm install @milkdown/kit @milkdown/core @milkdown/ctx
 *              @milkdown/prose @milkdown/preset-commonmark
 *              @milkdown/plugin-listener @milkdown/theme-nord
 *
 * ─── WCAG 2.0 AA ──────────────────────────────────────────────────────
 * • Sets `role="textbox"` and `aria-multiline="true"` on the editor root.
 * • Applies the caller-provided `aria-label`.
 * • Milkdown's ProseMirror core is keyboard-accessible by default.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

import type { EditorAdapter, EditorAdapterConfig } from './types';

/**
 * MilkdownAdapter wraps the Milkdown editor behind the EditorAdapter ABI.
 *
 * Because Milkdown packages are optional peer dependencies, this adapter
 * dynamically imports them in `init()`.  If the packages are not installed
 * the adapter will throw a descriptive error.
 */
export class MilkdownAdapter implements EditorAdapter {
  readonly id = 'milkdown';
  readonly displayName = 'Milkdown (Markdown)';

  private editorInstance: unknown = null;
  private container: HTMLElement | null = null;
  private listeners: Array<(html: string) => void> = [];
  private content = '';

  async init(config: EditorAdapterConfig): Promise<void> {
    this.container = config.container;
    this.content = config.initialContent;

    try {
      /* Dynamic imports — tree-shaken when the adapter is unused. */
      const { Editor, rootCtx, defaultValueCtx, editorViewCtx } =
        await import('@milkdown/kit/core');
      const { commonmark } = await import('@milkdown/kit/preset/commonmark');
      const { listener, listenerCtx } = await import(
        '@milkdown/kit/plugin/listener'
      );
      const { nord } = await import('@milkdown/kit/theme/nord');

      const editor = await Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, config.container);
          ctx.set(defaultValueCtx, config.initialContent);
          ctx.set(listenerCtx, {
            markdown: [
              (getMarkdown: () => string) => {
                this.content = getMarkdown();
                for (const cb of this.listeners) cb(this.content);
              },
            ],
          });
        })
        .config(nord)
        .use(commonmark)
        .use(listener)
        .create();

      this.editorInstance = { editor, editorViewCtx };

      /* WCAG: ensure the editable area has proper ARIA attributes */
      const editable = config.container.querySelector('[contenteditable]');
      if (editable) {
        editable.setAttribute('role', 'textbox');
        editable.setAttribute('aria-multiline', 'true');
        editable.setAttribute('aria-label', config.ariaLabel);
        editable.setAttribute('tabindex', '0');
      }
    } catch {
      throw new Error(
        '[MilkdownAdapter] Failed to initialise. Ensure Milkdown packages ' +
          'are installed: npm install @milkdown/kit',
      );
    }
  }

  destroy(): void {
    if (
      this.editorInstance &&
      typeof (this.editorInstance as { editor: { destroy: () => void } }).editor
        ?.destroy === 'function'
    ) {
      (
        this.editorInstance as { editor: { destroy: () => void } }
      ).editor.destroy();
    }
    this.editorInstance = null;
    this.container = null;
    this.listeners = [];
  }

  getContent(): string {
    return this.content;
  }

  setContent(html: string): void {
    this.content = html;
    /* In a full integration this would call the Milkdown API to replace
       the editor document.  The pattern varies by Milkdown version. */
  }

  onContentChange(callback: (html: string) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  focus(): void {
    const editable = this.container?.querySelector<HTMLElement>(
      '[contenteditable]',
    );
    editable?.focus();
  }
}

export function createMilkdownAdapter(): MilkdownAdapter {
  return new MilkdownAdapter();
}
