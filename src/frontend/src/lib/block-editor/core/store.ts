/**
 * core/store.ts — Svelte store managing block-editor document state.
 *
 * All mutations to a BlockDocument go through the actions exported here.
 * Components subscribe to the store for reactive rendering; actions emit
 * ARIA live-region announcements for screen-reader users (WCAG 2.0 AA).
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

import { writable, derived } from 'svelte/store';
import type { Block, BlockDocument, BlockId, BlockType } from './types';
import { getBlockDefinition } from './registry';

// ── Helpers ───────────────────────────────────────────────────────────────

/** Generate a UUID-v4 (crypto-safe when available, Math.random fallback). */
function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

// ── Live-region announcer (WCAG 2.0 AA) ──────────────────────────────────

/**
 * Store that holds the latest screen-reader announcement.
 * Bind an `aria-live="polite"` region in the UI to this store.
 */
export const liveAnnouncement = writable<string>('');

function announce(message: string): void {
  // Clear then set so repeated identical messages still trigger
  liveAnnouncement.set('');
  setTimeout(() => liveAnnouncement.set(message), 50);
}

// ── Document store ────────────────────────────────────────────────────────

/** Create a new empty BlockDocument. */
export function createEmptyDocument(title = 'Untitled'): BlockDocument {
  const timestamp = now();
  return {
    id: uuid(),
    title,
    blocks: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** The active document being edited. */
export const blockDocument = writable<BlockDocument>(createEmptyDocument());

/** Derived: just the ordered blocks array for convenience. */
export const blocks = derived(blockDocument, ($doc) => $doc.blocks);

/** Derived: the currently selected block id (null = none). */
export const selectedBlockId = writable<BlockId | null>(null);

// ── Document-level actions ────────────────────────────────────────────────

/** Replace the entire document (e.g. when loading from backend). */
export function loadDocument(doc: BlockDocument): void {
  blockDocument.set(doc);
  selectedBlockId.set(null);
  announce('Document loaded');
}

/** Update the document title. */
export function setDocumentTitle(title: string): void {
  blockDocument.update((doc) => ({ ...doc, title, updatedAt: now() }));
}

// ── Block CRUD actions ────────────────────────────────────────────────────

/**
 * Insert a new block of the given type.
 *
 * @param type   - Registered block type key.
 * @param index  - Position to insert at.  Defaults to end of document.
 * @returns The newly created block, or `null` if the type is unregistered.
 */
export function addBlock(type: BlockType, index?: number): Block | null {
  const def = getBlockDefinition(type);
  if (!def) {
    console.warn(`[block-editor] Unknown block type "${type}"`);
    return null;
  }

  const timestamp = now();
  const block: Block = {
    id: uuid(),
    type,
    data: def.defaultData(),
    meta: { createdAt: timestamp, updatedAt: timestamp },
  };

  blockDocument.update((doc) => {
    const blocks = [...doc.blocks];
    const pos = index !== undefined ? index : blocks.length;
    blocks.splice(pos, 0, block);
    return { ...doc, blocks, updatedAt: timestamp };
  });

  selectedBlockId.set(block.id);
  announce(`${def.displayName} block added`);
  return block;
}

/**
 * Remove a block by ID.
 *
 * @returns `true` if the block was found and removed.
 */
export function removeBlock(id: BlockId): boolean {
  let removed = false;
  blockDocument.update((doc) => {
    const idx = doc.blocks.findIndex((b) => b.id === id);
    if (idx === -1) return doc;
    removed = true;
    const blocks = [...doc.blocks];
    const removedBlock = blocks[idx];
    blocks.splice(idx, 1);

    const def = getBlockDefinition(removedBlock.type);
    announce(`${def?.displayName ?? 'Block'} removed`);

    return { ...doc, blocks, updatedAt: now() };
  });

  // If the removed block was selected, clear selection
  selectedBlockId.update((sel) => (sel === id ? null : sel));
  return removed;
}

/**
 * Update the data payload of a specific block.
 */
export function updateBlockData<T>(
  id: BlockId,
  updater: (current: T) => T,
): void {
  blockDocument.update((doc) => {
    const blocks = doc.blocks.map((b) => {
      if (b.id !== id) return b;
      return {
        ...b,
        data: updater(b.data as T),
        meta: { ...b.meta, updatedAt: now() },
      };
    });
    return { ...doc, blocks, updatedAt: now() };
  });
}

/**
 * Move a block from one position to another.
 *
 * @param id       - Block to move.
 * @param newIndex - Target position (0-based).
 */
export function moveBlock(id: BlockId, newIndex: number): void {
  blockDocument.update((doc) => {
    const blocks = [...doc.blocks];
    const oldIdx = blocks.findIndex((b) => b.id === id);
    if (oldIdx === -1) return doc;

    const [moved] = blocks.splice(oldIdx, 1);
    const clampedIndex = Math.max(0, Math.min(newIndex, blocks.length));
    blocks.splice(clampedIndex, 0, moved);

    const def = getBlockDefinition(moved.type);
    announce(`${def?.displayName ?? 'Block'} moved to position ${clampedIndex + 1}`);

    return { ...doc, blocks, updatedAt: now() };
  });
}

/**
 * Move a block up by one position.
 */
export function moveBlockUp(id: BlockId): void {
  let currentIndex = -1;
  blockDocument.subscribe((doc) => {
    currentIndex = doc.blocks.findIndex((b) => b.id === id);
  })();
  if (currentIndex > 0) {
    moveBlock(id, currentIndex - 1);
  }
}

/**
 * Move a block down by one position.
 */
export function moveBlockDown(id: BlockId): void {
  let currentIndex = -1;
  let length = 0;
  blockDocument.subscribe((doc) => {
    currentIndex = doc.blocks.findIndex((b) => b.id === id);
    length = doc.blocks.length;
  })();
  if (currentIndex >= 0 && currentIndex < length - 1) {
    moveBlock(id, currentIndex + 1);
  }
}
