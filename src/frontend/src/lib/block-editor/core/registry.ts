/**
 * core/registry.ts — Block type registry.
 *
 * A central, store-backed registry that holds every block type the editor
 * knows about.  Plugins (including the D3 graph block) register their
 * definitions here so the insertion toolbar, serialiser, and renderer
 * can discover them at runtime.
 *
 * The registry is a Svelte writable store so that UI components
 * automatically re-render when new block types are registered.
 *
 * Traceability: ADR-005 — Block Editor Architecture
 */

import { writable, derived } from 'svelte/store';
import type { BlockType, BlockDefinition } from './types';

// ── Store ─────────────────────────────────────────────────────────────────

/** Internal map of all registered block definitions keyed by type. */
const _registry = writable<Map<BlockType, BlockDefinition>>(new Map());

/**
 * Readable snapshot of all registered definitions as an array.
 * Use this in toolbar components to list available block types.
 */
export const blockDefinitions = derived(_registry, ($r) => [...$r.values()]);

/**
 * Readable map for O(1) lookup by block type.
 * Use this in the renderer and serialiser.
 */
export const blockDefinitionMap = derived(_registry, ($r) => new Map($r));

// ── Actions ───────────────────────────────────────────────────────────────

/**
 * Register a new block type.
 *
 * @throws If a block with the same `type` key is already registered.
 */
export function registerBlock(
  definition: BlockDefinition,
): void {
  _registry.update((map) => {
    if (map.has(definition.type)) {
      throw new Error(
        `Block type "${definition.type}" is already registered. ` +
          'Unregister the existing definition first.',
      );
    }
    const next = new Map(map);
    next.set(definition.type, definition);
    return next;
  });
}

/**
 * Remove a previously registered block type.
 *
 * @returns `true` if the definition was found and removed, `false` otherwise.
 */
export function unregisterBlock(type: BlockType): boolean {
  let removed = false;
  _registry.update((map) => {
    if (!map.has(type)) return map;
    const next = new Map(map);
    next.delete(type);
    removed = true;
    return next;
  });
  return removed;
}

/**
 * Look up a single block definition by type.
 * Returns `undefined` if the type is not registered.
 *
 * Note: for reactive lookups inside Svelte components, prefer
 * subscribing to `blockDefinitionMap` instead.
 */
export function getBlockDefinition(
  type: BlockType,
): BlockDefinition | undefined {
  let result: BlockDefinition | undefined;
  _registry.subscribe((map) => {
    result = map.get(type);
  })();
  return result;
}

/**
 * Reset the registry to empty.  Primarily useful in tests.
 */
export function clearRegistry(): void {
  _registry.set(new Map());
}
