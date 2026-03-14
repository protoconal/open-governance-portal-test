/**
 * api/client.ts — Typed API client for the Governance Portal backend.
 *
 * All communication with the Directus headless CMS goes through this
 * module.  The base URL is read from the VITE_API_BASE_URL environment
 * variable so that the same frontend build can point to different backends
 * without code changes — just swap the environment variable.
 *
 * Directus returns collection data in a `{ data: [...] }` envelope.
 * The helpers in this module unwrap that envelope and normalise field
 * names from snake_case (Directus convention) to camelCase (TS convention).
 *
 * Traceability: ADR-004 — Frontend API communication strategy
 *               ADR-006 — Migration to Directus headless CMS
 */

/** Base URL for the Directus backend API.  Set VITE_API_BASE_URL in .env to override. */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8055';

// ── Directus response envelope ────────────────────────────────────────────

/**
 * Directus collection endpoints return `{ data: T[] }`.
 * Single-item endpoints return `{ data: T }`.
 */
interface DirectusCollectionResponse<T> {
  data: T[];
}

// ── Application types ─────────────────────────────────────────────────────

/**
 * Governance module — the main registry entry.
 * Each governance module (scheduling, finances, members, etc.) is a row
 * in the `governance_modules` Directus collection.
 */
export interface GovernanceModule {
  /** Directus auto-generated numeric ID. */
  id: number;
  /** URL-safe unique key (e.g. "scheduling"). */
  moduleId: string;
  /** Human-readable display name. */
  displayName: string;
  /** Short description shown on dashboard cards. */
  description: string;
  /** Semantic version string. */
  version: string;
  /** Emoji or icon identifier. */
  icon: string;
  /** Whether the module is currently active. */
  enabled: boolean;
}

/**
 * @deprecated Use GovernanceModule instead.  Kept for backward compatibility
 * with components that still reference the legacy PluginManifest shape.
 */
export type PluginManifest = GovernanceModule & {
  pluginId: string;
  apiPrefix: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────

/** Perform a GET request and return the parsed JSON body. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API GET ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Perform a POST request with a JSON body and return the parsed JSON body. */
export async function apiPost<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API POST ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<TResponse>;
}

// ── Governance module loader ──────────────────────────────────────────────

/**
 * Raw row shape returned by Directus for the governance_modules collection.
 * Directus uses snake_case column names by convention.
 */
interface DirectusGovernanceModule {
  id: number;
  module_id: string;
  display_name: string;
  description: string | null;
  version: string | null;
  icon: string | null;
  enabled: boolean;
  status: string;
}

/**
 * Normalise a raw Directus row into a GovernanceModule (camelCase).
 */
function normalizeModule(item: DirectusGovernanceModule): GovernanceModule {
  return {
    id: item.id,
    moduleId: item.module_id ?? '',
    displayName: item.display_name ?? '',
    description: item.description ?? '',
    version: item.version ?? '1.0.0',
    icon: item.icon ?? '📋',
    enabled: item.enabled !== false,
  };
}

/**
 * Fetch all governance modules from Directus.
 * Filters to enabled + published modules and sorts alphabetically.
 */
export async function fetchGovernanceModules(): Promise<GovernanceModule[]> {
  const response = await apiGet<DirectusCollectionResponse<DirectusGovernanceModule>>(
    '/items/governance_modules?filter[enabled][_eq]=true&filter[status][_eq]=published&sort=display_name'
  );
  return response.data.map(normalizeModule);
}

/**
 * @deprecated Use fetchGovernanceModules() instead.
 * Legacy alias that maps GovernanceModule → PluginManifest shape.
 */
export async function fetchPlugins(): Promise<PluginManifest[]> {
  const modules = await fetchGovernanceModules();
  return modules.map((m) => ({
    ...m,
    pluginId: m.moduleId,
    apiPrefix: `/items/${m.moduleId}s`,
  }));
}
