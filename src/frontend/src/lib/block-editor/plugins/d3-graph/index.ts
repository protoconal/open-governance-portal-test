/**
 * plugins/d3-graph/index.ts — Public API for the D3 Graph optional plugin.
 *
 * Usage:
 *   import { registerD3GraphBlock } from '$lib/block-editor/plugins/d3-graph';
 *   registerD3GraphBlock();   // makes "Graph (D3)" available in toolbar
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

export {
  registerD3GraphBlock,
  unregisterD3GraphBlock,
  d3GraphBlockDef,
  type D3GraphBlockData,
  type GraphNode,
  type GraphEdge,
} from './definition';

export { default as D3GraphBlock } from './D3GraphBlock.svelte';
