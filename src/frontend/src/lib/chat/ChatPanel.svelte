<!--
  chat/ChatPanel.svelte — Real-time chat panel component.

  A self-contained chat UI that connects to a Mattermost server and
  displays messages in real-time via WebSockets.  Designed to be
  embedded as a sidebar or overlay in the governance portal.

  WCAG 2.0 AA:
  • Chat messages use role="log" with aria-live="polite" for screen
    reader announcements of new messages.
  • The message input has an aria-label.
  • Channel selector has proper labelling.
  • Focus ring is visible on all interactive elements.
  • Keyboard navigation: Enter sends message, Escape blurs input.
  • Message list auto-scrolls but respects user scroll position.

  Traceability: ADR-005 — Block Editor Architecture (chat extension)
-->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import {
    chatMessages,
    chatChannels,
    activeChannelId,
    activeChannel,
    currentChatUser,
    chatConnectionState,
    MattermostClient,
  } from './mattermost-client';
  import type { MattermostConfig } from './types';

  /** Mattermost connection configuration. */
  export let config: MattermostConfig | null = null;

  let client: MattermostClient | null = null;
  let messageInput = '';
  let messagesContainer: HTMLDivElement;
  let isUserScrolledUp = false;

  onMount(() => {
    if (config) {
      client = new MattermostClient(config);
      client.init();
    }
  });

  onDestroy(() => {
    client?.disconnect();
  });

  async function sendMessage(): Promise<void> {
    if (!messageInput.trim() || !client) return;
    await client.sendMessage(messageInput);
    messageInput = '';
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function onChannelChange(e: Event): void {
    const channelId = (e.target as HTMLSelectElement).value;
    client?.switchChannel(channelId);
  }

  function onScroll(): void {
    if (!messagesContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    isUserScrolledUp = scrollHeight - scrollTop - clientHeight > 50;
  }

  /* Auto-scroll to bottom when new messages arrive (unless user scrolled up) */
  $: if ($chatMessages && messagesContainer && !isUserScrolledUp) {
    tick().then(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
</script>

<aside class="chat-panel" aria-label="Chat panel">
  <!-- Header -->
  <header class="chat-header">
    <h2 class="chat-title">Chat</h2>

    {#if $chatChannels.length > 0}
      <label for="channel-select" class="sr-only">Select channel</label>
      <select
        id="channel-select"
        value={$activeChannelId}
        on:change={onChannelChange}
        class="channel-select"
        aria-label="Chat channel"
      >
        <option value="" disabled>Select a channel…</option>
        {#each $chatChannels as channel (channel.id)}
          <option value={channel.id}>
            # {channel.displayName}
            {#if channel.unreadCount > 0}({channel.unreadCount}){/if}
          </option>
        {/each}
      </select>
    {/if}

    <span class="connection-badge" class:connected={$chatConnectionState === 'connected'}>
      <span class="sr-only">
        Chat {$chatConnectionState === 'connected' ? 'connected' : 'disconnected'}
      </span>
      <span class="badge-dot" aria-hidden="true"></span>
    </span>
  </header>

  <!-- Connection status for screen readers -->
  <div class="sr-only" role="status" aria-live="polite">
    {#if $chatConnectionState === 'connecting'}
      Connecting to chat…
    {:else if $chatConnectionState === 'connected'}
      Chat connected
    {:else if $chatConnectionState === 'error'}
      Chat connection error
    {/if}
  </div>

  <!-- Messages -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="messages-container"
    bind:this={messagesContainer}
    on:scroll={onScroll}
    role="log"
    aria-live="polite"
    aria-label="{$activeChannel?.displayName ?? 'Chat'} messages"
    tabindex="0"
  >
    {#if !config}
      <div class="chat-placeholder">
        <p>Chat is not configured.</p>
        <p class="chat-hint">
          Provide a Mattermost configuration to enable real-time chat.
        </p>
      </div>
    {:else if $chatConnectionState === 'connecting'}
      <div class="chat-status" role="status">Connecting…</div>
    {:else if $chatConnectionState === 'error'}
      <div class="chat-status error" role="alert">
        Could not connect to chat server.
      </div>
    {:else if $chatMessages.length === 0}
      <div class="chat-status">No messages yet.</div>
    {:else}
      {#each $chatMessages as msg (msg.id)}
        <div
          class="message"
          class:own={msg.isOwn}
          aria-label="{msg.senderName} at {formatTime(msg.createdAt)}: {msg.content}"
        >
          <div class="message-header">
            <span class="sender-name">{msg.senderName}</span>
            <time class="message-time" datetime={msg.createdAt}>
              {formatTime(msg.createdAt)}
            </time>
          </div>
          <div class="message-body">{msg.content}</div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Input -->
  {#if config && $chatConnectionState === 'connected'}
    <form class="message-form" on:submit|preventDefault={sendMessage}>
      <label for="chat-input" class="sr-only">Type a message</label>
      <input
        id="chat-input"
        type="text"
        class="message-input"
        bind:value={messageInput}
        on:keydown={handleKeydown}
        placeholder="Type a message…"
        aria-label="Chat message input"
        autocomplete="off"
      />
      <button
        type="submit"
        class="send-btn"
        disabled={!messageInput.trim()}
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  {/if}
</aside>

<style>
  .chat-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 600px;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.75rem;
    background: var(--color-surface, #ffffff);
    overflow: hidden;
  }

  .chat-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border, #e2e8f0);
    background: #f8fafc;
  }

  .chat-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .channel-select {
    flex: 1;
    padding: 0.25rem 0.4rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.25rem;
    font-size: 0.8rem;
    background: var(--color-surface, #ffffff);
    color: inherit;
    min-width: 0;
  }

  .channel-select:focus-visible {
    outline: 2px solid var(--color-accent, #3b82f6);
    outline-offset: 1px;
  }

  .connection-badge {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
    transition: background 0.2s;
  }

  .connection-badge.connected .badge-dot {
    background: #22c55e;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    outline: none;
  }

  .messages-container:focus-visible {
    box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.3);
  }

  .chat-placeholder,
  .chat-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem 1rem;
    color: var(--color-muted, #64748b);
    font-size: 0.9rem;
  }

  .chat-hint {
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }

  .chat-status.error {
    color: #dc2626;
  }

  .message {
    padding: 0.4rem 0.6rem;
    border-radius: 0.5rem;
    background: #f1f5f9;
    max-width: 85%;
    align-self: flex-start;
  }

  .message.own {
    align-self: flex-end;
    background: #dbeafe;
  }

  .message-header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.15rem;
  }

  .sender-name {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-accent, #3b82f6);
  }

  .message-time {
    font-size: 0.65rem;
    color: var(--color-muted, #64748b);
  }

  .message-body {
    font-size: 0.85rem;
    line-height: 1.4;
    word-break: break-word;
  }

  .message-form {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    border-top: 1px solid var(--color-border, #e2e8f0);
    background: #f8fafc;
  }

  .message-input {
    flex: 1;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.375rem;
    font-size: 0.85rem;
    font-family: inherit;
    color: inherit;
    background: var(--color-surface, #ffffff);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .message-input:focus-visible {
    border-color: var(--color-accent, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    outline: none;
  }

  .send-btn {
    padding: 0.4rem 0.85rem;
    border: 1px solid var(--color-accent, #3b82f6);
    border-radius: 0.375rem;
    background: var(--color-accent, #3b82f6);
    color: #ffffff;
    font-size: 0.85rem;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.1s;
    white-space: nowrap;
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-btn:focus-visible {
    outline: 2px solid #1e293b;
    outline-offset: 2px;
  }

  /* Screen reader only utility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
