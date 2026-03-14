/**
 * block-editor/index.ts — Public API for the block editor framework.
 *
 * Import everything you need from a single entry point:
 *
 *   import {
 *     registerBuiltinBlocks,
 *     BlockEditor,
 *     addBlock,
 *     registerBlock,
 *   } from '$lib/block-editor';
 *
 * Optional plugins are NOT exported here.  Import them separately:
 *
 *   import { registerD3GraphBlock } from '$lib/block-editor/plugins/d3-graph';
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

// ── Core types ────────────────────────────────────────────────────────────
export type {
  Block,
  BlockId,
  BlockType,
  BlockMeta,
  BlockCategory,
  BlockDefinition,
  BlockDocument,
} from './core/types';

// ── Registry ──────────────────────────────────────────────────────────────
export {
  registerBlock,
  unregisterBlock,
  getBlockDefinition,
  clearRegistry,
  blockDefinitions,
  blockDefinitionMap,
} from './core/registry';

// ── State store ───────────────────────────────────────────────────────────
export {
  blockDocument,
  blocks,
  selectedBlockId,
  liveAnnouncement,
  createEmptyDocument,
  loadDocument,
  setDocumentTitle,
  addBlock,
  removeBlock,
  updateBlockData,
  moveBlock,
  moveBlockUp,
  moveBlockDown,
} from './core/store';

// ── Serialisation ─────────────────────────────────────────────────────────
export {
  blockToHTML,
  documentToHTML,
  documentToJSON,
  documentFromJSON,
} from './core/serializer';

// ── Adapters ──────────────────────────────────────────────────────────────
export type { EditorAdapter, EditorAdapterConfig, EditorAdapterFactory } from './adapters/types';
export {
  activeAdapterId,
  createAdapter,
  registerAdapterFactory,
  unregisterAdapterFactory,
  getAdapterFactories,
  createBaseAdapter,
  createMilkdownAdapter,
  createTinyMCEAdapter,
} from './adapters/index';

// ── Built-in blocks ───────────────────────────────────────────────────────
export { registerBuiltinBlocks } from './blocks/definitions';
export type {
  TextBlockData,
  HeadingBlockData,
  ImageBlockData,
  CodeBlockData,
} from './blocks/definitions';

// ── UI components ─────────────────────────────────────────────────────────
export { default as BlockEditor } from './components/BlockEditor.svelte';
export { default as BlockToolbar } from './components/BlockToolbar.svelte';
export { default as BlockWrapper } from './components/BlockWrapper.svelte';
export { default as EditorSelector } from './components/EditorSelector.svelte';
