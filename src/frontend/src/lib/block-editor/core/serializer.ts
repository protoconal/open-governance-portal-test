/**
 * core/serializer.ts — Block document serialisation utilities.
 *
 * Converts a BlockDocument to/from HTML and JSON so that documents can
 * be persisted, transported, and rendered outside the editor.
 *
 * The HTML serialiser delegates to each BlockDefinition's `toHTML()`
 * method, wrapping each block in a semantic `<section>` with data
 * attributes that enable round-tripping back to blocks.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

import type { Block, BlockDocument } from './types';
import { getBlockDefinition } from './registry';

// ── HTML serialisation ────────────────────────────────────────────────────

/**
 * Render a single block to an HTML string.
 * Falls back to a `<div>` with a warning if the type is unregistered.
 */
export function blockToHTML(block: Block): string {
  const def = getBlockDefinition(block.type);
  const inner = def
    ? def.toHTML(block.data)
    : `<div class="block-unknown">Unknown block type: ${block.type}</div>`;

  const ariaLabel = def ? def.ariaLabel(block.data) : `Unknown ${block.type} block`;

  return (
    `<section data-block-id="${block.id}" data-block-type="${block.type}" ` +
    `aria-label="${ariaLabel}">\n${inner}\n</section>`
  );
}

/**
 * Render an entire document to a standalone HTML string.
 * Includes minimal structure (article > sections) for semantic HTML.
 */
export function documentToHTML(doc: BlockDocument): string {
  const blocksHtml = doc.blocks.map(blockToHTML).join('\n\n');
  return (
    `<article data-document-id="${doc.id}" aria-label="${doc.title}">\n` +
    `<h1>${doc.title}</h1>\n\n` +
    `${blocksHtml}\n` +
    `</article>`
  );
}

// ── JSON serialisation ────────────────────────────────────────────────────

/**
 * Serialise a document to a JSON string.
 * This is the canonical storage format — it preserves all block data
 * and metadata losslessly.
 */
export function documentToJSON(doc: BlockDocument): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Deserialise a JSON string back into a BlockDocument.
 *
 * @throws If the JSON is malformed or missing required fields.
 */
export function documentFromJSON(json: string): BlockDocument {
  const parsed: unknown = JSON.parse(json);
  if (!isBlockDocument(parsed)) {
    throw new Error('Invalid BlockDocument JSON: missing required fields');
  }
  return parsed;
}

// ── Type guard ────────────────────────────────────────────────────────────

function isBlockDocument(value: unknown): value is BlockDocument {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.blocks) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}
