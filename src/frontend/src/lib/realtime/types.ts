/**
 * realtime/types.ts — WebSocket infrastructure types.
 *
 * Defines the message envelope, event types, and connection state used
 * by the WebSocket client.  These types form the real-time contract
 * between the frontend and any backend that implements the same protocol.
 *
 * Traceability: ADR-005 — Block Editor Architecture (real-time extension)
 */

// ── Connection state ──────────────────────────────────────────────────────

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// ── Message envelope ──────────────────────────────────────────────────────

/**
 * Every WebSocket message (in both directions) is wrapped in this envelope.
 * The `type` field identifies the event and the `payload` carries the data.
 */
export interface WsMessage<T = unknown> {
  /** Event type identifier (e.g. "chat:message", "block:update"). */
  type: string;
  /** Event-specific payload. */
  payload: T;
  /** ISO-8601 timestamp of when the message was created. */
  timestamp: string;
}

// ── Event listener ────────────────────────────────────────────────────────

/** Callback signature for WebSocket event listeners. */
export type WsEventListener<T = unknown> = (message: WsMessage<T>) => void;

// ── Configuration ─────────────────────────────────────────────────────────

export interface WsClientConfig {
  /** WebSocket server URL (e.g. "ws://localhost:5000/ws"). */
  url: string;
  /** How many milliseconds to wait before attempting a reconnect. */
  reconnectIntervalMs?: number;
  /** Maximum number of reconnect attempts before giving up. */
  maxReconnectAttempts?: number;
  /** Optional authentication token sent as a query parameter. */
  authToken?: string;
}
