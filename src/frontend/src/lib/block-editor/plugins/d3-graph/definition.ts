/**
 * plugins/d3-graph/definition.ts — D3 Graph block definition.
 *
 * An OPTIONAL plugin that provides a force-directed graph block for the
 * block editor.  This plugin is NOT loaded by default — consumers must
 * explicitly import and register it:
 *
 *   import { registerD3GraphBlock } from '$lib/block-editor/plugins/d3-graph';
 *   registerD3GraphBlock();
 *
 * ─── Dependency ────────────────────────────────────────────────────────
 * Requires `d3` (npm install d3).  The D3 import is in the Svelte
 * component, not here, so the definition module itself has zero
 * heavyweight dependencies.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

import type { BlockDefinition } from '../../core/types';
import { registerBlock, unregisterBlock } from '../../core/registry';

// ── Data shape ────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  group?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

export interface D3GraphBlockData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Chart title (used in ARIA label and export). */
  title: string;
  /** Whether to show a data-table alternative for accessibility. */
  showAccessibleTable: boolean;
}

// ── Block definition ──────────────────────────────────────────────────────

export const d3GraphBlockDef: BlockDefinition<D3GraphBlockData> = {
  type: 'd3-graph',
  displayName: 'Graph (D3)',
  description: 'An interactive force-directed graph visualisation powered by D3.js.',
  icon: '🕸️',
  category: 'data',
  defaultData: () => ({
    nodes: [
      { id: 'a', label: 'Node A', group: 1 },
      { id: 'b', label: 'Node B', group: 1 },
      { id: 'c', label: 'Node C', group: 2 },
    ],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ],
    title: 'Untitled Graph',
    showAccessibleTable: true,
  }),
  toHTML: (data) => {
    /* Export a static representation — the interactive version lives
       only inside the Svelte component. */
    const nodeList = data.nodes.map((n) => `<li>${n.label}</li>`).join('');
    const edgeList = data.edges
      .map((e) => `<li>${e.source} → ${e.target}${e.label ? ` (${e.label})` : ''}</li>`)
      .join('');
    return (
      `<div class="block-d3-graph" role="img" aria-label="${data.title}">\n` +
      `  <p><strong>${data.title}</strong></p>\n` +
      `  <p>Nodes:</p><ul>${nodeList}</ul>\n` +
      `  <p>Connections:</p><ul>${edgeList}</ul>\n` +
      `</div>`
    );
  },
  ariaLabel: (data) =>
    `Graph: ${data.title} — ${data.nodes.length} nodes, ${data.edges.length} edges`,
};

// ── Registration helper ───────────────────────────────────────────────────

/**
 * Register the D3 Graph block type.
 * Call once to make the block available in the insertion toolbar.
 */
export function registerD3GraphBlock(): void {
  registerBlock(d3GraphBlockDef);
}

/**
 * Unregister the D3 Graph block type.
 */
export function unregisterD3GraphBlock(): void {
  unregisterBlock('d3-graph');
}
