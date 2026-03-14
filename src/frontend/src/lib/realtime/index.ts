/**
 * realtime/index.ts — Public API for the real-time WebSocket layer.
 *
 * Provides a singleton WsClient and convenience stores for the rest
 * of the application to consume.
 *
 * Usage:
 *   import { wsClient, wsState } from '$lib/realtime';
 *   wsClient.connect();
 *   wsClient.on('chat:message', (msg) => { ... });
 *
 * Traceability: ADR-005
 */

import { writable, derived } from 'svelte/store';
import { WsClient } from './ws-client';
import { API_BASE } from '$lib/api/client';

export type { ConnectionState, WsMessage, WsEventListener, WsClientConfig } from './types';
export { WsClient } from './ws-client';

// ── Singleton client ──────────────────────────────────────────────────────

/**
 * Derive the WebSocket URL from the API base URL.
 * Replaces http(s):// with ws(s):// and appends /ws.
 */
function deriveWsUrl(apiBase: string): string {
  return apiBase.replace(/^http/, 'ws') + '/ws';
}

/** WebSocket URL store — can be overridden before connecting. */
export const wsUrl = writable<string>(deriveWsUrl(API_BASE));

let _clientInstance: WsClient | null = null;

/**
 * Get (or create) the singleton WsClient.
 * Call `connect()` on the returned client to start the connection.
 */
export function getWsClient(): WsClient {
  if (!_clientInstance) {
    let url = '';
    wsUrl.subscribe((u) => (url = u))();
    _clientInstance = new WsClient({ url });
  }
  return _clientInstance;
}

/** Convenience alias for the singleton client. */
export const wsClient = {
  get instance(): WsClient {
    return getWsClient();
  },
};

// ── Convenience stores ────────────────────────────────────────────────────

/** Reactive connection state. */
export const wsState = derived(
  { subscribe: getWsClient().state.subscribe },
  ($s) => $s,
);

/** Reactive status message for ARIA live regions. */
export const wsStatusMessage = derived(
  { subscribe: getWsClient().statusMessage.subscribe },
  ($s) => $s,
);
