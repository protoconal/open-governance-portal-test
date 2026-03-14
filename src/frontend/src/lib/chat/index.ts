/**
 * chat/index.ts — Public API for the Mattermost chat integration.
 *
 * Usage:
 *   import { ChatPanel, MattermostClient } from '$lib/chat';
 *
 * Traceability: ADR-005 — Block Editor Architecture (chat extension)
 */

export type {
  ChatMessage,
  ChatChannel,
  ChatUser,
  MattermostConfig,
} from './types';

export {
  MattermostClient,
  chatMessages,
  chatChannels,
  activeChannelId,
  activeChannel,
  currentChatUser,
  chatConnectionState,
} from './mattermost-client';

export { default as ChatPanel } from './ChatPanel.svelte';
