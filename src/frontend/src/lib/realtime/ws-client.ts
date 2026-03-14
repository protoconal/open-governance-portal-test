/**
 * realtime/ws-client.ts — WebSocket client with auto-reconnect.
 *
 * A lightweight, framework-agnostic WebSocket client that provides:
 * • Typed message envelopes (WsMessage).
 * • Event-based subscription via on/off.
 * • Automatic reconnect with configurable back-off.
 * • Connection state exposed as a Svelte store.
 * • ARIA-friendly status for screen readers.
 *
 * Traceability: ADR-005 — Block Editor Architecture (real-time extension)
 */

import { writable } from 'svelte/store';
import type {
  ConnectionState,
  WsMessage,
  WsEventListener,
  WsClientConfig,
} from './types';

// ── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_RECONNECT_INTERVAL = 3000;
const DEFAULT_MAX_RECONNECT = 10;

// ── Client class ──────────────────────────────────────────────────────────

export class WsClient {
  private ws: WebSocket | null = null;
  private config: Required<WsClientConfig>;
  private listeners = new Map<string, Set<WsEventListener>>();
  private wildcardListeners = new Set<WsEventListener>();
  private reconnectCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  /** Reactive connection state for Svelte components. */
  readonly state = writable<ConnectionState>('disconnected');

  /** Human-readable status for ARIA live regions. */
  readonly statusMessage = writable<string>('Disconnected');

  constructor(config: WsClientConfig) {
    this.config = {
      url: config.url,
      reconnectIntervalMs:
        config.reconnectIntervalMs ?? DEFAULT_RECONNECT_INTERVAL,
      maxReconnectAttempts:
        config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT,
      authToken: config.authToken ?? '',
    };
  }

  // ── Connection lifecycle ──────────────────────────────────────────────

  /** Open the WebSocket connection. */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.intentionalClose = false;
    this.state.set('connecting');
    this.statusMessage.set('Connecting…');

    const url = this.config.authToken
      ? `${this.config.url}?token=${encodeURIComponent(this.config.authToken)}`
      : this.config.url;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectCount = 0;
      this.state.set('connected');
      this.statusMessage.set('Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        this.dispatch(msg);
      } catch {
        /* Ignore non-JSON messages */
      }
    };

    this.ws.onclose = () => {
      if (this.intentionalClose) {
        this.state.set('disconnected');
        this.statusMessage.set('Disconnected');
        return;
      }
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      /* onerror is always followed by onclose — reconnect happens there */
    };
  }

  /** Gracefully close the connection. */
  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.state.set('disconnected');
    this.statusMessage.set('Disconnected');
  }

  // ── Sending ───────────────────────────────────────────────────────────

  /** Send a typed message to the server. */
  send<T>(type: string, payload: T): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[WsClient] Cannot send — not connected.');
      return;
    }
    const message: WsMessage<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.ws.send(JSON.stringify(message));
  }

  // ── Event subscriptions ───────────────────────────────────────────────

  /**
   * Subscribe to a specific event type, or use `"*"` for all events.
   * Returns an unsubscribe function.
   */
  on<T = unknown>(type: string, listener: WsEventListener<T>): () => void {
    const cb = listener as WsEventListener;
    if (type === '*') {
      this.wildcardListeners.add(cb);
      return () => this.wildcardListeners.delete(cb);
    }
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(cb);
    return () => this.listeners.get(type)?.delete(cb);
  }

  /** Remove a specific listener. */
  off(type: string, listener: WsEventListener): void {
    if (type === '*') {
      this.wildcardListeners.delete(listener);
    } else {
      this.listeners.get(type)?.delete(listener);
    }
  }

  // ── Private ───────────────────────────────────────────────────────────

  private dispatch(msg: WsMessage): void {
    /* Type-specific listeners */
    const typeListeners = this.listeners.get(msg.type);
    if (typeListeners) {
      for (const cb of typeListeners) cb(msg);
    }
    /* Wildcard listeners */
    for (const cb of this.wildcardListeners) cb(msg);
  }

  private scheduleReconnect(): void {
    if (this.reconnectCount >= this.config.maxReconnectAttempts) {
      this.state.set('disconnected');
      this.statusMessage.set(
        'Disconnected — could not reconnect after multiple attempts',
      );
      return;
    }

    this.reconnectCount++;
    this.state.set('reconnecting');
    this.statusMessage.set(
      `Reconnecting (attempt ${this.reconnectCount} of ${this.config.maxReconnectAttempts})…`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectIntervalMs);
  }
}
