/**
 * api/client.ts — Typed API client for the Governance Portal backend.
 *
 * All communication with the ASP.NET API goes through this module.
 * The base URL is read from the VITE_API_BASE_URL environment variable so
 * that the same frontend build can point to different backends without
 * code changes — just swap the environment variable.
 *
 * Traceability: ADR-004 — Frontend API communication strategy
 */

/** Base URL for the backend API.  Set VITE_API_BASE_URL in .env to override. */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

// ── Types ─────────────────────────────────────────────────────────────────

/**
 * Matches GovernancePortal.Core.Models.PluginManifest on the backend.
 * Update this type whenever the C# record changes.
 */
export interface PluginManifest {
  pluginId: string;
  displayName: string;
  description: string;
  version: string;
  icon: string;
  apiPrefix: string;
}

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

// ── Plugin manifest loader ─────────────────────────────────────────────────

/**
 * Fetch all registered plugin manifests from the backend.
 * Called once on application load; results are stored in the plugin store.
 */
export async function fetchPlugins(): Promise<PluginManifest[]> {
  return apiGet<PluginManifest[]>('/api/plugins');
}
