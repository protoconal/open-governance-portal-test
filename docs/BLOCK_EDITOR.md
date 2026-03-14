# Block Editor Architecture

> Traceability tag: ADR-005
> Relates to: ADR-004, ADR-006

---

## Overview

The **Block Editor** is a core, extensible framework that provides
WYSIWYG document editing through a **block-based** interface.  Each
document is an ordered list of typed content blocks (text, heading,
image, code, graphs, etc.) that can be inserted, removed, reordered,
and edited independently.

The framework supports **interchangeable editor adapters** so that the
underlying WYSIWYG engine (Milkdown, TinyMCE, or a built-in
`contenteditable` fallback) can be swapped without changing block
implementations.

---

## Design Goals

| # | Goal | Approach |
|---|------|----------|
| 1 | Extensibility | Block types and editor adapters are registered at runtime via a plugin registry. |
| 2 | Editor-agnostic | A stable adapter ABI lets any WYSIWYG engine slot in. |
| 3 | Accessibility | WCAG 2.0 Level AA compliance is a first-class requirement. |
| 4 | Serialisation | Documents round-trip losslessly through JSON and export to semantic HTML. |
| 5 | Optional plugins | Heavy dependencies (D3.js) are opt-in imports, not bundled by default. |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     BlockEditor UI                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ BlockToolbar│  │EditorSelector│  │  Keyboard Help   │  │
│  └────────────┘  └──────────────┘  └──────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Block List (role="list")                           │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ BlockWrapper (role="listitem")                │  │  │
│  │  │  ┌─ Controls: ↑ ↓ ✕ ─────────────────────┐  │  │  │
│  │  │  │ [Block Component] (Text/Heading/etc.)   │  │  │  │
│  │  │  └────────────────────────────────────────┘  │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │ BlockWrapper … (repeats per block)            │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────┐                        │
│  │ ARIA Live Region (sr-only)  │                        │
│  └──────────────────────────────┘                        │
└──────────────────────────────────────────────────────────┘

        ▼ subscribes to ▼

┌──────────────────────────────────────────────────────────┐
│                     Core Stores                           │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ blockDocument│  │ registry   │  │ activeAdapterId  │  │
│  │ (Svelte      │  │ (block     │  │ (which editor    │  │
│  │  writable)   │  │  type defs)│  │  adapter to use) │  │
│  └──────────────┘  └────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────┘

        ▼ uses ▼

┌──────────────────────────────────────────────────────────┐
│                    Adapter Layer (ABI)                     │
│                                                           │
│  interface EditorAdapter {                                │
│    init(config) → Promise<void>                           │
│    destroy()                                              │
│    getContent() → string                                  │
│    setContent(html)                                       │
│    onContentChange(cb) → unsubscribe                      │
│    focus()                                                │
│  }                                                        │
│                                                           │
│  Implementations:                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │  BaseAdapter │  │  Milkdown   │  │    TinyMCE       │  │
│  │ (contenteditable)│ Adapter   │  │    Adapter        │  │
│  └─────────────┘  └─────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Module Map

```
src/frontend/src/lib/block-editor/
├── core/
│   ├── types.ts           Core type definitions (Block, BlockDocument, etc.)
│   ├── registry.ts        Block type registry (Svelte store)
│   ├── store.ts           Document state store + CRUD actions
│   └── serializer.ts      HTML / JSON serialisation
├── adapters/
│   ├── types.ts           EditorAdapter interface (the ABI)
│   ├── index.ts           Adapter registry + active adapter store
│   ├── base-adapter.ts    Built-in contenteditable fallback
│   ├── milkdown-adapter.ts  Milkdown integration (optional peer dep)
│   └── tinymce-adapter.ts   TinyMCE integration (optional peer dep)
├── blocks/
│   ├── definitions.ts     Built-in block type definitions + registration
│   ├── TextBlock.svelte   Rich text block (uses active adapter)
│   ├── HeadingBlock.svelte  Heading with level selector
│   ├── ImageBlock.svelte    Image with alt text & caption
│   └── CodeBlock.svelte     Code snippet with language selector
├── components/
│   ├── BlockEditor.svelte   Main orchestrator component
│   ├── BlockToolbar.svelte  Block insertion toolbar
│   ├── BlockWrapper.svelte  Per-block wrapper (controls, selection)
│   └── EditorSelector.svelte  Adapter switcher dropdown
├── plugins/
│   └── d3-graph/            ← OPTIONAL plugin (import separately)
│       ├── definition.ts    Block definition + registration helpers
│       ├── D3GraphBlock.svelte  Interactive D3.js graph
│       └── index.ts         Public exports
└── index.ts               Public API barrel exports
```

---

## Editor Adapter ABI

The adapter interface is the contract that allows editor engines to be
swapped transparently.  Every adapter must implement:

```typescript
interface EditorAdapter {
  readonly id: string;
  readonly displayName: string;
  init(config: EditorAdapterConfig): Promise<void>;
  destroy(): void;
  getContent(): string;
  setContent(html: string): void;
  onContentChange(callback: (html: string) => void): () => void;
  focus(): void;
}
```

### Configuration

```typescript
interface EditorAdapterConfig {
  container: HTMLElement;
  initialContent: string;
  ariaLabel: string;       // WCAG 2.0 AA — required
  readonly?: boolean;
  placeholder?: string;
}
```

### Available Adapters

| Adapter | ID | Dependency | Notes |
|---------|-----|-----------|-------|
| Built-in | `base` | None | Uses `contenteditable`. Always available. |
| Milkdown | `milkdown` | `@milkdown/kit` | **Preferred.** Markdown-native WYSIWYG. |
| TinyMCE | `tinymce` | `tinymce` | Enterprise-grade HTML editor. |

### Adding a New Adapter

1. Create a class implementing `EditorAdapter`.
2. Create a factory function: `() => new YourAdapter()`.
3. Register it: `registerAdapterFactory('your-id', factory)`.
4. It will immediately appear in the EditorSelector dropdown.

---

## Block System

### Block Definition

Each block type is described by a `BlockDefinition` object:

```typescript
interface BlockDefinition<T extends BlockData = BlockData> {
  type: BlockType;           // unique key, e.g. "text"
  displayName: string;       // shown in toolbar
  description: string;       // tooltip
  icon: string;              // emoji or icon id
  category: BlockCategory;   // toolbar grouping
  defaultData: () => T;      // factory for new instances
  toHTML: (data: T) => string;  // HTML serialisation
  ariaLabel: (data: T) => string;  // screen reader label
}
```

### Built-in Block Types

| Type | Category | Description |
|------|----------|-------------|
| `text` | Text | Rich text paragraph (uses adapter) |
| `heading` | Text | H1–H6 heading with level selector |
| `image` | Media | Image with alt text and caption |
| `code` | Text | Code snippet with language selector |

### Optional: D3 Graph Block

| Type | Category | Dependency | Registration |
|------|----------|-----------|-------------|
| `d3-graph` | Data | `d3` (npm) | `import { registerD3GraphBlock } from '.../plugins/d3-graph'` |

### Creating a Custom Block

1. Define a data interface:
   ```typescript
   interface MyBlockData { value: string; }
   ```
2. Create a `BlockDefinition<MyBlockData>`.
3. Register it: `registerBlock(myBlockDef)`.
4. Create a Svelte component for the block.
5. Register the component with the BlockEditor:
   ```typescript
   editorComponent.registerBlockComponent('my-block', MyBlockComponent);
   ```

---

## WCAG 2.0 Level AA Compliance

Accessibility is a first-class concern throughout the framework.

### Perceivable

- **Text alternatives**: All images require alt text; graphs provide a
  toggle-able data table as a text alternative.
- **Colour contrast**: All UI colours meet the 4.5:1 ratio for normal
  text and 3:1 for large text / UI components.
- **Colour is not sole indicator**: Focus states use both colour and
  outline/box-shadow.

### Operable

- **Keyboard accessible**: Every interactive element is reachable by
  keyboard.  Blocks support Alt+↑/↓ for reordering and Shift+Delete
  for removal.
- **No keyboard traps**: Tab moves between blocks; Escape returns to
  the wrapper.
- **Focus visible**: All interactive elements have `:focus-visible`
  styles with a minimum 3px accent ring.
- **Skip link**: "Skip to content blocks" link at the top of the editor.

### Understandable

- **Labels**: Every form field has a `<label>` or `aria-label`.
- **Error identification**: Missing required fields (e.g. image alt
  text) are indicated via `aria-required`.
- **Consistent navigation**: The toolbar, blocks, and controls appear
  in a predictable order.

### Robust

- **ARIA roles**: `role="list"`, `role="listitem"`, `role="toolbar"`,
  `role="textbox"`, `role="group"`, `role="status"` (live region).
- **Live announcements**: Block add/move/delete operations are
  announced to screen readers via an `aria-live="polite"` region.
- **Semantic HTML**: Export produces semantic `<article>`, `<section>`,
  `<figure>`, `<h1>`–`<h6>` elements.

---

## Serialisation

### JSON (lossless, canonical storage)

```typescript
const json = documentToJSON(doc);
const doc = documentFromJSON(json);
```

### HTML (semantic export)

```typescript
const html = documentToHTML(doc);
// Returns: <article><h1>Title</h1><section>…</section>…</article>
```

Each block is wrapped in a `<section>` with `data-block-id` and
`data-block-type` attributes to support future round-tripping.

---

## Recommended Enterprise Frameworks

The block editor architecture draws inspiration from and could
integrate with these well-maintained frameworks:

| Framework | Fit | Notes |
|-----------|-----|-------|
| **[Editor.js](https://editorjs.io/)** | ★★★★★ | Block-based, JSON output, plugin ecosystem. Most similar to this architecture. |
| **[Plate](https://platejs.org/)** (React/Slate-based) | ★★★★☆ | Enterprise block editor toolkit. React-only but architecture is exemplary. |
| **[Tiptap](https://tiptap.dev/)** | ★★★★☆ | ProseMirror-based, framework-agnostic, collaborative editing support. |
| **[Milkdown](https://milkdown.dev/)** | ★★★★☆ | ProseMirror-based, Markdown-native, plugin-driven. Our preferred adapter. |
| **[TinyMCE](https://www.tiny.cloud/)** | ★★★★☆ | Industry standard WYSIWYG, WCAG compliant, large plugin ecosystem. |
| **[BlockSuite](https://blocksuite.io/)** | ★★★★☆ | Collaborative block editor framework by AFFiNE. Modern, extensible. |
| **[Sanity Portable Text](https://www.sanity.io/docs/portable-text)** | ★★★☆☆ | Structured content format that serialises well; CMS-oriented. |

For greenfield projects needing collaborative editing, **Tiptap** or
**BlockSuite** are strong choices.  For Markdown-first workflows,
**Milkdown** is ideal.  For maximum enterprise compatibility, **TinyMCE**
remains the safest bet.

---

## Future Extensions

- [ ] Collaborative editing via CRDT (Yjs integration with Milkdown/Tiptap)
- [ ] Drag-and-drop block reordering
- [ ] Block templates / presets
- [ ] Backend persistence API (Directus collection for block documents)
- [ ] Version history / undo stack per document
- [ ] Plugin marketplace for community block types
- [ ] Real-time preview mode (read-only render)
- [ ] Additional adapter: Tiptap, ProseMirror raw

---

## Client-Side Rendering (CSR) & WebSocket Architecture

The frontend runs as a **pure CSR single-page application**.  SvelteKit
is configured with `adapter-static` and `ssr = false` so that:

- All HTML is rendered in the browser.
- Data is fetched at runtime via the REST API and WebSockets.
- The built output is a set of static files deployable to any CDN or
  file server.

### WebSocket Infrastructure

A lightweight WebSocket client (`$lib/realtime`) provides:

| Feature | Implementation |
|---------|---------------|
| Typed message envelopes | `WsMessage<T>` with type, payload, timestamp |
| Event subscriptions | `on('event', callback)` / `off()` / `on('*', …)` |
| Auto-reconnect | Configurable interval and max attempts |
| Svelte stores | `wsState`, `wsStatusMessage` for reactive UI |
| Auth support | Token passed as query parameter on connect |

```typescript
import { getWsClient } from '$lib/realtime';

const ws = getWsClient();
ws.connect();
ws.on('block:update', (msg) => { /* handle real-time block update */ });
ws.send('cursor:move', { blockId: '…', position: 42 });
```

### Mattermost Chat Integration

The `$lib/chat` module provides a complete Mattermost integration:

- **MattermostClient** — REST API v4 + WebSocket client for channels,
  messages, and user presence.
- **ChatPanel** — Drop-in Svelte component with channel selector,
  message list, and input.
- **Real-time delivery** — New messages arrive via WebSocket and are
  appended to the store instantly.

```svelte
<script>
  import { ChatPanel } from '$lib/chat';
</script>

<ChatPanel config={{
  serverUrl: 'https://mattermost.example.com',
  wsUrl: 'wss://mattermost.example.com/api/v4/websocket',
  token: 'your-access-token',
  teamId: 'team-id',
}} />
```

Environment variables (`.env`):

```
VITE_MATTERMOST_URL=https://mattermost.example.com
VITE_MATTERMOST_WS_URL=wss://mattermost.example.com/api/v4/websocket
VITE_MATTERMOST_TOKEN=your-personal-access-token
VITE_MATTERMOST_TEAM_ID=your-team-id
```
