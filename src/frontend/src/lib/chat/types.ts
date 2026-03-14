/**
 * chat/types.ts — Types for the Mattermost chat integration.
 *
 * Defines the message, channel, and user types used by the chat
 * components.  These types map to the Mattermost API v4 data model
 * (see https://api.mattermost.com/) but are kept minimal to avoid
 * coupling to internal Mattermost implementation details.
 *
 * Traceability: ADR-005 — Block Editor Architecture (chat extension)
 */

// ── Chat message ──────────────────────────────────────────────────────────

export interface ChatMessage {
  /** Unique message ID (from Mattermost or generated locally). */
  id: string;
  /** Channel this message belongs to. */
  channelId: string;
  /** User who sent the message. */
  userId: string;
  /** Display name of the sender. */
  senderName: string;
  /** Message body (Markdown supported). */
  content: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** Whether this message was sent by the current user. */
  isOwn: boolean;
}

// ── Channel ───────────────────────────────────────────────────────────────

export interface ChatChannel {
  /** Unique channel ID. */
  id: string;
  /** Human-readable channel name. */
  name: string;
  /** Display name (e.g. "Town Hall"). */
  displayName: string;
  /** Number of unread messages in this channel. */
  unreadCount: number;
}

// ── User ──────────────────────────────────────────────────────────────────

export interface ChatUser {
  /** Mattermost user ID. */
  id: string;
  /** Username. */
  username: string;
  /** Display name. */
  displayName: string;
  /** Online / offline / away. */
  status: 'online' | 'offline' | 'away' | 'dnd';
}

// ── Configuration ─────────────────────────────────────────────────────────

export interface MattermostConfig {
  /** Mattermost server URL (e.g. "https://mattermost.example.com"). */
  serverUrl: string;
  /** WebSocket URL (e.g. "wss://mattermost.example.com/api/v4/websocket"). */
  wsUrl: string;
  /** Personal access token or OAuth bearer token. */
  token: string;
  /** Default team ID to scope channels to. */
  teamId?: string;
}
