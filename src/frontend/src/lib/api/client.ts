/**
 * api/client.ts — Typed API client for the Governance Portal backend.
 *
 * All communication with the Strapi headless CMS goes through this module.
 * The base URL is read from the VITE_API_BASE_URL environment variable so
 * that the same frontend build can point to different backends without
 * code changes — just swap the environment variable.
 *
 * Strapi returns data in a { data, meta } envelope.  The helpers in this
 * module unwrap that envelope and expose the inner data directly.
 *
 * Traceability: ADR-004 — Frontend API communication strategy
 *               ADR-006 — Migration to Strapi headless CMS
 */

/** Base URL for the Strapi backend API.  Set VITE_API_BASE_URL in .env to override. */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:1337';

// ── Strapi response envelope ──────────────────────────────────────────────

/**
 * Strapi wraps every item in a { id, documentId, ...attributes } shape.
 * Collection endpoints return { data: StrapiItem[], meta }.
 * Single endpoints return { data: StrapiItem, meta }.
 */
interface StrapiItem<T> {
  id: number;
  documentId: string;
  attributes?: T;
  [key: string]: unknown;
}

interface StrapiCollectionResponse<T> {
  data: (StrapiItem<T> & T)[];
  meta: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
}

interface StrapiSingleResponse<T> {
  data: StrapiItem<T> & T;
  meta: Record<string, unknown>;
}

// ── Application types ─────────────────────────────────────────────────────

/**
 * Governance module manifest — the successor to the old PluginManifest.
 * Each governance module (scheduling, finances, members, etc.) is now a
 * Strapi content-type entry in the "Governance Module" collection.
 */
export interface GovernanceModule {
  /** Strapi auto-generated numeric ID. */
  id: number;
  /** Strapi document ID. */
  documentId: string;
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
 * during migration from the ASP.NET backend.
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
 * Normalise a raw Strapi governance-module item into a GovernanceModule.
 * Strapi v5 flattens attributes into the top-level object.
 */
function normalizeModule(item: StrapiItem<GovernanceModule> & Record<string, unknown>): GovernanceModule {
  return {
    id: item.id,
    documentId: String(item.documentId ?? ''),
    moduleId: String(item.moduleId ?? item.documentId ?? ''),
    displayName: String(item.displayName ?? ''),
    description: String(item.description ?? ''),
    version: String(item.version ?? '1.0.0'),
    icon: String(item.icon ?? '📋'),
    enabled: item.enabled !== false,
  };
}

/**
 * Fetch all governance modules from Strapi.
 * Filters to enabled-only modules by default.
 */
export async function fetchGovernanceModules(): Promise<GovernanceModule[]> {
  const response = await apiGet<StrapiCollectionResponse<GovernanceModule>>(
    '/api/governance-modules?filters[enabled][$eq]=true&sort=displayName:asc'
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
    apiPrefix: `/api/${m.moduleId}s`,
  }));
}
