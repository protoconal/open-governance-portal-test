/**
 * chat/mattermost-client.ts — Mattermost API + WebSocket client.
 *
 * Provides a typed client for communicating with a Mattermost server.
 * Uses the Mattermost REST API v4 for data fetching and the WebSocket
 * API for real-time message delivery.
 *
 * ─── Authentication ────────────────────────────────────────────────────
 * A personal access token (PAT) or OAuth2 bearer token must be provided
 * via MattermostConfig.  The token is sent as an `Authorization` header
 * for REST calls and as a query parameter for the WebSocket handshake.
 *
 * ─── WCAG 2.0 AA ──────────────────────────────────────────────────────
 * The client itself is a data layer and doesn't render UI, but it
 * exposes Svelte stores so that chat components can provide accessible
 * rendering (live regions, keyboard navigation, etc.).
 *
 * Traceability: ADR-005 — Block Editor Architecture (chat extension)
 */

import { writable, derived } from 'svelte/store';
import type {
  ChatMessage,
  ChatChannel,
  ChatUser,
  MattermostConfig,
} from './types';

// ── Stores ────────────────────────────────────────────────────────────────

/** All messages in the active channel. */
export const chatMessages = writable<ChatMessage[]>([]);

/** Available channels. */
export const chatChannels = writable<ChatChannel[]>([]);

/** Currently active channel ID. */
export const activeChannelId = writable<string>('');

/** Current authenticated user. */
export const currentChatUser = writable<ChatUser | null>(null);

/** Connection status for the chat WebSocket. */
export const chatConnectionState = writable<
  'disconnected' | 'connecting' | 'connected' | 'error'
>('disconnected');

/** Derived: active channel object. */
export const activeChannel = derived(
  [chatChannels, activeChannelId],
  ([$channels, $id]) => $channels.find((c) => c.id === $id) ?? null,
);

// ── Client ────────────────────────────────────────────────────────────────

export class MattermostClient {
  private config: MattermostConfig;
  private ws: WebSocket | null = null;
  private meUserId = '';

  constructor(config: MattermostConfig) {
    this.config = config;
  }

  // ── REST helpers ────────────────────────────────────────────────────

  private async apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${this.config.serverUrl}/api/v4${path}`, {
      headers: { Authorization: `Bearer ${this.config.token}` },
    });
    if (!res.ok) {
      throw new Error(
        `Mattermost GET ${path} failed: ${res.status} ${res.statusText}`,
      );
    }
    return res.json() as Promise<T>;
  }

  private async apiPost<TBody, TResponse>(
    path: string,
    body: TBody,
  ): Promise<TResponse> {
    const res = await fetch(`${this.config.serverUrl}/api/v4${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(
        `Mattermost POST ${path} failed: ${res.status} ${res.statusText}`,
      );
    }
    return res.json() as Promise<TResponse>;
  }

  // ── Initialisation ──────────────────────────────────────────────────

  /** Authenticate and fetch initial data. */
  async init(): Promise<void> {
    chatConnectionState.set('connecting');

    try {
      /* Get current user */
      const me = await this.apiGet<{
        id: string;
        username: string;
        first_name: string;
        last_name: string;
      }>('/users/me');

      this.meUserId = me.id;
      currentChatUser.set({
        id: me.id,
        username: me.username,
        displayName: `${me.first_name} ${me.last_name}`.trim() || me.username,
        status: 'online',
      });

      /* Fetch channels */
      const teamId = this.config.teamId;
      if (teamId) {
        const channels = await this.apiGet<
          Array<{
            id: string;
            name: string;
            display_name: string;
          }>
        >(`/users/me/teams/${teamId}/channels`);

        chatChannels.set(
          channels.map((ch) => ({
            id: ch.id,
            name: ch.name,
            displayName: ch.display_name,
            unreadCount: 0,
          })),
        );
      }

      /* Connect WebSocket for real-time events */
      this.connectWs();
    } catch (err) {
      chatConnectionState.set('error');
      console.error('[MattermostClient] Init failed:', err);
    }
  }

  // ── WebSocket ───────────────────────────────────────────────────────

  private connectWs(): void {
    const url = `${this.config.wsUrl}?token=${encodeURIComponent(this.config.token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      chatConnectionState.set('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        this.handleWsEvent(data);
      } catch {
        /* Ignore non-JSON frames */
      }
    };

    this.ws.onclose = () => {
      chatConnectionState.set('disconnected');
    };

    this.ws.onerror = () => {
      chatConnectionState.set('error');
    };
  }

  private handleWsEvent(data: {
    event?: string;
    data?: {
      post?: string;
      channel_id?: string;
    };
  }): void {
    if (data.event === 'posted' && data.data?.post) {
      try {
        const post = JSON.parse(data.data.post) as {
          id: string;
          channel_id: string;
          user_id: string;
          message: string;
          create_at: number;
          props?: { username?: string };
        };

        const msg: ChatMessage = {
          id: post.id,
          channelId: post.channel_id,
          userId: post.user_id,
          senderName: post.props?.username ?? post.user_id,
          content: post.message,
          createdAt: new Date(post.create_at).toISOString(),
          isOwn: post.user_id === this.meUserId,
        };

        chatMessages.update((msgs) => [...msgs, msg]);
      } catch {
        /* Ignore malformed posts */
      }
    }
  }

  // ── Channel operations ──────────────────────────────────────────────

  /** Switch to a different channel and load its history. */
  async switchChannel(channelId: string): Promise<void> {
    activeChannelId.set(channelId);

    const posts = await this.apiGet<{
      order: string[];
      posts: Record<
        string,
        {
          id: string;
          channel_id: string;
          user_id: string;
          message: string;
          create_at: number;
          props?: { username?: string };
        }
      >;
    }>(`/channels/${channelId}/posts?per_page=50`);

    const messages: ChatMessage[] = posts.order
      .map((id) => posts.posts[id])
      .filter(Boolean)
      .map((post) => ({
        id: post.id,
        channelId: post.channel_id,
        userId: post.user_id,
        senderName: post.props?.username ?? post.user_id,
        content: post.message,
        createdAt: new Date(post.create_at).toISOString(),
        isOwn: post.user_id === this.meUserId,
      }))
      .reverse(); // Oldest first

    chatMessages.set(messages);
  }

  // ── Sending messages ────────────────────────────────────────────────

  /** Post a message to the active channel. */
  async sendMessage(content: string): Promise<void> {
    let channelId = '';
    activeChannelId.subscribe((id) => (channelId = id))();

    if (!channelId || !content.trim()) return;

    await this.apiPost('/posts', {
      channel_id: channelId,
      message: content.trim(),
    });
  }

  // ── Cleanup ─────────────────────────────────────────────────────────

  /** Close the WebSocket and reset stores. */
  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    chatConnectionState.set('disconnected');
    chatMessages.set([]);
    chatChannels.set([]);
    activeChannelId.set('');
    currentChatUser.set(null);
  }
}
