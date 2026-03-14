/**
 * adapters/index.ts — Adapter barrel exports and active adapter store.
 *
 * Provides a Svelte store that tracks which editor adapter is currently
 * active, plus convenience functions for switching adapters at runtime.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

import { writable } from 'svelte/store';
import type { EditorAdapter, EditorAdapterFactory } from './types';
import { createBaseAdapter } from './base-adapter';

export type { EditorAdapter, EditorAdapterConfig, EditorAdapterFactory } from './types';
export { BaseAdapter, createBaseAdapter } from './base-adapter';
export { MilkdownAdapter, createMilkdownAdapter } from './milkdown-adapter';
export { TinyMCEAdapter, createTinyMCEAdapter } from './tinymce-adapter';

// ── Registered adapters ───────────────────────────────────────────────────

/**
 * Map of all available adapter factories keyed by adapter id.
 * The base (contenteditable) adapter is always registered.
 */
const adapterFactories = new Map<string, EditorAdapterFactory>([
  ['base', createBaseAdapter],
]);

/**
 * Register an adapter factory so it appears in the editor-selector UI.
 */
export function registerAdapterFactory(
  id: string,
  factory: EditorAdapterFactory,
): void {
  adapterFactories.set(id, factory);
}

/**
 * Unregister an adapter factory.
 */
export function unregisterAdapterFactory(id: string): void {
  adapterFactories.delete(id);
}

/**
 * Get all registered adapter factories as an array of [id, factory] pairs.
 */
export function getAdapterFactories(): Array<[string, EditorAdapterFactory]> {
  return [...adapterFactories.entries()];
}

// ── Active adapter store ──────────────────────────────────────────────────

/**
 * The ID of the currently active adapter.
 * UI components react to changes in this store to re-initialise editors.
 */
export const activeAdapterId = writable<string>('base');

/**
 * Create a new EditorAdapter instance using the factory registered under
 * the given ID.  Falls back to the base adapter if the ID is unknown.
 */
export function createAdapter(id?: string): EditorAdapter {
  const factory = adapterFactories.get(id ?? 'base') ?? createBaseAdapter;
  return factory();
}
