/**
 * core/types.ts — Core type definitions for the block-based editor system.
 *
 * This module defines the foundational types that the entire block editor
 * framework builds upon.  Every block, document, and editor interaction
 * is expressed through these types.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

// ── Block Identity ────────────────────────────────────────────────────────

/** A globally-unique block identifier (UUID v4 recommended). */
export type BlockId = string;

/** The machine-readable type key for a block (e.g. "text", "heading", "d3-graph"). */
export type BlockType = string;

// ── Block Data ────────────────────────────────────────────────────────────

/**
 * Base constraint for block-specific data payloads.
 * Every block type defines its own data shape that extends this.
 */
export type BlockData = Record<string, unknown>;

/**
 * Metadata attached to every block instance.  Metadata is editor-managed
 * and should not be edited directly by block implementations.
 */
export interface BlockMeta {
  /** ISO-8601 timestamp of when the block was created. */
  createdAt: string;
  /** ISO-8601 timestamp of the last content modification. */
  updatedAt: string;
}

/**
 * A single content block within a document.
 *
 * @typeParam T - The data shape specific to this block type.
 */
export interface Block<T extends BlockData = BlockData> {
  /** Unique identifier for this block instance. */
  id: BlockId;
  /** The block type key — must match a registered BlockDefinition. */
  type: BlockType;
  /** Block-type-specific data payload. */
  data: T;
  /** Editor-managed metadata. */
  meta: BlockMeta;
}

// ── Block Definition (Registry Entry) ─────────────────────────────────────

/** Categories that help organise blocks in the insertion toolbar. */
export type BlockCategory = 'text' | 'media' | 'embed' | 'data' | 'layout' | 'custom';

/**
 * A block definition describes a *type* of block that can be inserted into
 * a document.  Definitions are registered in the BlockRegistry and drive
 * the insertion toolbar, serialisation, and rendering logic.
 */
export interface BlockDefinition<T extends BlockData = BlockData> {
  /** Machine-readable type key.  Must be unique across all registrations. */
  type: BlockType;
  /** Human-readable name shown in the insertion toolbar. */
  displayName: string;
  /** Short description for tooltip / screen reader. */
  description: string;
  /** Emoji or icon identifier for the toolbar button. */
  icon: string;
  /** Toolbar category for grouping. */
  category: BlockCategory;
  /** Factory that returns the default data for a new instance. */
  defaultData: () => T;
  /**
   * Serialise block data to an HTML string.
   * Used by the serialiser when exporting the document to HTML.
   */
  toHTML: (data: T) => string;
  /**
   * Accessible label describing the block content for screen readers.
   * Receives the current block data and returns a descriptive string.
   */
  ariaLabel: (data: T) => string;
}

// ── Block Document ────────────────────────────────────────────────────────

/**
 * A BlockDocument is the top-level container for a page of block content.
 * It holds an ordered list of blocks plus document-level metadata.
 */
export interface BlockDocument {
  /** Unique identifier for the document. */
  id: string;
  /** Human-readable document title. */
  title: string;
  /** Ordered list of blocks that make up the document body. */
  blocks: Block[];
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-modified timestamp. */
  updatedAt: string;
}
