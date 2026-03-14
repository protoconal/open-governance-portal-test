/**
 * plugins/registry.ts — Svelte store that holds all governance module manifests.
 *
 * Design rationale
 * ----------------
 * The frontend does NOT hard-code knowledge of specific modules.  On startup
 * it calls the Directus REST API to fetch all GovernanceModule entries and
 * dynamically builds the navigation and dashboard cards from that list.
 *
 * Adding a new collection in Directus and a corresponding GovernanceModule
 * entry automatically adds it to the UI without any frontend code change.
 *
 * Traceability: ADR-004 — Frontend module registry
 *               ADR-006 — Migration to Directus headless CMS
 */

import { writable, derived } from 'svelte/store';
import type { GovernanceModule, PluginManifest } from '$lib/api/client';
import { fetchGovernanceModules, fetchPlugins } from '$lib/api/client';

// ── Stores ────────────────────────────────────────────────────────────────

/** All governance modules fetched from Directus. */
export const modules = writable<GovernanceModule[]>([]);

/**
 * @deprecated Use `modules` store instead.
 * Legacy alias mapping GovernanceModule → PluginManifest shape.
 */
export const plugins = derived(modules, ($modules) =>
  $modules.map((m) => ({
    ...m,
    pluginId: m.moduleId,
    apiPrefix: `/items/${m.moduleId}s`,
  } as PluginManifest))
);

/** Whether the initial module load is in progress. */
export const pluginsLoading = writable<boolean>(false);

/** Error message if the module load failed, or null. */
export const pluginsError = writable<string | null>(null);

/** Convenience: a map from moduleId → GovernanceModule for O(1) lookup. */
export const moduleMap = derived(
  modules,
  ($modules) => new Map($modules.map((m) => [m.moduleId, m]))
);

/**
 * @deprecated Use `moduleMap` store instead.
 * Legacy alias providing pluginId → PluginManifest lookup.
 */
export const pluginMap = derived(
  plugins,
  ($plugins) => new Map($plugins.map((p) => [p.pluginId, p]))
);

// ── Actions ───────────────────────────────────────────────────────────────

/**
 * Load governance modules from Directus and populate the store.
 * Safe to call multiple times — only one request will be in flight at a time.
 */
export async function loadPlugins(): Promise<void> {
  pluginsLoading.set(true);
  pluginsError.set(null);
  try {
    const items = await fetchGovernanceModules();
    modules.set(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    pluginsError.set(message);
    // Fall back to an empty list so the app stays usable.
    modules.set([]);
  } finally {
    pluginsLoading.set(false);
  }
}
