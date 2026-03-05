/**
 * plugins/registry.ts — Svelte store that holds all registered plugin manifests.
 *
 * Design rationale
 * ----------------
 * The frontend does NOT hard-code knowledge of specific plugins.  On startup
 * it calls GET /api/plugins, receives a list of PluginManifest objects, and
 * dynamically builds the navigation and dashboard cards from that list.
 *
 * This mirrors the backend's runtime plugin discovery (ADR-003) and means
 * adding a new backend plugin automatically adds it to the UI without any
 * frontend code change.
 *
 * Traceability: ADR-004 — Frontend plugin registry
 */

import { writable, derived } from 'svelte/store';
import type { PluginManifest } from '$lib/api/client';
import { fetchPlugins } from '$lib/api/client';

// ── Stores ────────────────────────────────────────────────────────────────

/** All plugin manifests fetched from the backend. */
export const plugins = writable<PluginManifest[]>([]);

/** Whether the initial plugin load is in progress. */
export const pluginsLoading = writable<boolean>(false);

/** Error message if the plugin load failed, or null. */
export const pluginsError = writable<string | null>(null);

/** Convenience: a map from pluginId → manifest for O(1) lookup. */
export const pluginMap = derived(
  plugins,
  ($plugins) => new Map($plugins.map((p) => [p.pluginId, p]))
);

// ── Actions ───────────────────────────────────────────────────────────────

/**
 * Load plugins from the backend and populate the store.
 * Safe to call multiple times — only one request will be in flight at a time.
 */
export async function loadPlugins(): Promise<void> {
  pluginsLoading.set(true);
  pluginsError.set(null);
  try {
    const manifests = await fetchPlugins();
    plugins.set(manifests);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    pluginsError.set(message);
    // Fall back to an empty plugin list so the app stays usable.
    plugins.set([]);
  } finally {
    pluginsLoading.set(false);
  }
}
