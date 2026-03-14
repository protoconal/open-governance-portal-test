/**
 * adapters/types.ts — Editor Adapter ABI/API.
 *
 * This module defines the contract that every WYSIWYG editor integration
 * must fulfil.  By programming against this interface the block editor
 * can swap between Milkdown, TinyMCE, or any future editor without
 * changing the core framework or block implementations.
 *
 * ─── Design notes ──────────────────────────────────────────────────────
 * • The adapter lifecycle follows init → (use) → destroy.
 * • `init()` receives a DOM element and mounts the editor inside it.
 * • All content exchange uses plain HTML strings so that blocks can be
 *   serialised uniformly regardless of the underlying editor format.
 * • WCAG 2.0 AA: adapters MUST set `role="textbox"`, `aria-multiline`,
 *   `aria-label`, and manage focus on `init()`.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

// ── Adapter configuration ─────────────────────────────────────────────────

/**
 * Configuration passed to an adapter factory when creating a new instance.
 */
export interface EditorAdapterConfig {
  /** The DOM element the editor should mount into. */
  container: HTMLElement;
  /** Initial HTML content to display. */
  initialContent: string;
  /**
   * Accessible label for the editor region.
   * WCAG 2.0 AA requires every editable region to have a programmatic label.
   */
  ariaLabel: string;
  /** If true the editor should be read-only. */
  readonly?: boolean;
  /** Optional placeholder text shown when the editor is empty. */
  placeholder?: string;
}

// ── Adapter interface ─────────────────────────────────────────────────────

/**
 * The core adapter interface.  Each supported editor (Milkdown, TinyMCE,
 * contenteditable fallback, etc.) implements this interface.
 */
export interface EditorAdapter {
  /** Machine-readable adapter identifier (e.g. "milkdown", "tinymce"). */
  readonly id: string;
  /** Human-readable name for display in the editor selector. */
  readonly displayName: string;

  /**
   * Mount the editor inside the configured container.
   * Returns a promise so adapters can perform async initialisation
   * (loading scripts, fetching themes, etc.).
   */
  init(config: EditorAdapterConfig): Promise<void>;

  /**
   * Tear down the editor and release resources.
   * Must be called before removing the container from the DOM.
   */
  destroy(): void;

  /** Get the current editor content as an HTML string. */
  getContent(): string;

  /** Replace the editor content with the given HTML string. */
  setContent(html: string): void;

  /**
   * Register a callback that fires whenever the content changes.
   * Returns an unsubscribe function.
   */
  onContentChange(callback: (html: string) => void): () => void;

  /** Move keyboard focus into the editor. */
  focus(): void;
}

// ── Adapter factory ───────────────────────────────────────────────────────

/**
 * A factory function that creates a new EditorAdapter instance.
 * The block editor stores a reference to the active factory and uses it
 * whenever a new text-editing block is mounted.
 */
export type EditorAdapterFactory = () => EditorAdapter;
